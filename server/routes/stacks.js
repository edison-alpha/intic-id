const { StacksTestnet, StacksMainnet } = require('@stacks/network');
const { jsonArrayToClarityValues } = require('../utils/clarityConverter');

module.exports = (app, cache, callReadOnlyFunction, cvToJSON, hexToCV, uintCV, standardPrincipalCV, DEFAULT_NETWORK) => {
  // Get Stacks network instance
  const NETWORK = DEFAULT_NETWORK === 'mainnet' 
    ? new StacksMainnet() 
    : new StacksTestnet();

  // Call read-only contract function using Stacks.js
  app.post('/api/stacks/contract/:contractAddress/:contractName/call-read/:functionName', async (req, res) => {
    const { contractAddress, contractName, functionName } = req.params;
    
    try {
      const { functionArgs = [], senderAddress } = req.body;
      
      const cacheKey = `stacks_readonly_${contractAddress}_${contractName}_${functionName}_${JSON.stringify(functionArgs)}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Convert JSON arguments back to ClarityValues
      const clarityArgs = jsonArrayToClarityValues(functionArgs);

      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs: clarityArgs,
        network: NETWORK,
        senderAddress: senderAddress || contractAddress,
      };

      const result = await callReadOnlyFunction(options);
      const jsonResult = cvToJSON(result);
      
      const response = {
        success: true,
        result: jsonResult, // Use jsonResult instead of raw ClarityValue
        json: jsonResult
      };

      // Cache for 1 minute (60 seconds)
      cache.set(cacheKey, response, 60);
      res.json(response);

    } catch (error) {
      console.error(`Error calling ${contractName}.${functionName}:`, error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        result: null
      });
    }
  });

  // Get NFT ticket data using Stacks.js
  app.get('/api/stacks/nft-ticket/:contractId', async (req, res) => {
    try {
      const { contractId } = req.params;
      const cacheKey = `stacks_nft_ticket_${contractId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const parts = contractId.split('.');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      const contractAddress = parts[0];
      const contractName = parts[1];

      // Try get-event-details (NEW - returns full tuple)
      const eventDetailsResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-event-details',
        functionArgs: [],
        network: NETWORK,
        senderAddress: contractAddress,
      });

      if (eventDetailsResult) {
        const eventDetails = cvToJSON(eventDetailsResult);
        const parsedDetails = parseClarityResponse(eventDetails);

        if (parsedDetails) {
          const totalSupply = parsedDetails['total-supply'] || parsedDetails.totalSupply;
          const ticketsSold = parsedDetails['tickets-sold'] || parsedDetails.ticketsSold;
          const ticketsRemaining = parsedDetails['tickets-remaining'] || parsedDetails.ticketsRemaining;
          const price = parsedDetails.price;
          const cancelled = parsedDetails.cancelled;
          const eventDate = parsedDetails['event-date'] || parsedDetails.eventDate;
          const eventName = parsedDetails.name;
          const venue = parsedDetails.venue;
          const venueAddress = parsedDetails['venue-address'] || parsedDetails.venueAddress;
          const venueCoordinates = parsedDetails['venue-coordinates'] || parsedDetails.venueCoordinates;
          const imageUri = parsedDetails['image-uri'] || parsedDetails.imageUri;
          const metadataUri = parsedDetails['metadata-uri'] || parsedDetails.metadataUri;
          const paymentCurrency = parsedDetails['payment-currency'] || parsedDetails.paymentCurrency;
          const pricingMode = parsedDetails['pricing-mode'] || parsedDetails.pricingMode;

          const result = {
            maxSupply: totalSupply ? Number(totalSupply) : null,
            mintedCount: ticketsSold ? Number(ticketsSold) : null,
            remainingSupply: ticketsRemaining ? Number(ticketsRemaining) : null,
            mintPrice: price ? price.toString() : null,
            eventCancelled: cancelled === true,
            eventDate: eventDate ? Number(eventDate) : null,
            royaltyPercentage: null,
            // Additional fields from get-event-details
            eventName: eventName || null,
            venue: venue || null,
            venueAddress: venueAddress || null,
            venueCoordinates: venueCoordinates || null,
            imageUri: imageUri || null,
            metadataUri: metadataUri || null,
            paymentCurrency: paymentCurrency || null,
            pricingMode: pricingMode || null,
          };

          // Cache for 2 minutes (120 seconds)
          cache.set(cacheKey, result, 120);
          return res.json(result);
        }
      }

      // Try get-event-info (OLD - partial data)
      const eventInfoResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-event-info',
        functionArgs: [],
        network: NETWORK,
        senderAddress: contractAddress,
      });

      if (eventInfoResult) {
        const eventInfo = cvToJSON(eventInfoResult);
        const parsedInfo = parseClarityResponse(eventInfo);

        if (parsedInfo) {
          const totalSupply = parsedInfo['total-supply'] || parsedInfo.totalSupply;
          const sold = parsedInfo.sold;
          const remaining = parsedInfo.remaining;
          const price = parsedInfo.price;
          const cancelled = parsedInfo.cancelled;
          const eventDate = parsedInfo['event-date'] || parsedInfo.eventDate;
          const royaltyPercent = parsedInfo['royalty-percent'] || parsedInfo.royaltyPercent;

          const result = {
            maxSupply: totalSupply ? Number(totalSupply) : null,
            mintedCount: sold ? Number(sold) : null,
            remainingSupply: remaining ? Number(remaining) : null,
            mintPrice: price ? price.toString() : null,
            eventCancelled: cancelled === true,
            eventDate: eventDate ? Number(eventDate) : null,
            royaltyPercentage: royaltyPercent ? Number(royaltyPercent) : null,
          };

          // Cache for 2 minutes (120 seconds)
          cache.set(cacheKey, result, 120);
          return res.json(result);
        }
      }

      // Fallback: Call individual functions
      const [
        totalSupplyResult,
        lastTokenIdResult,
        remainingResult,
        priceResult,
        cancelledResult
      ] = await Promise.allSettled([
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-total-supply',
          functionArgs: [],
          network: NETWORK,
          senderAddress: contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-last-token-id',
          functionArgs: [],
          network: NETWORK,
          senderAddress: contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-tickets-remaining',
          functionArgs: [],
          network: NETWORK,
          senderAddress: contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-ticket-price',
          functionArgs: [],
          network: NETWORK,
          senderAddress: contractAddress,
        }),
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'is-event-cancelled',
          functionArgs: [],
          network: NETWORK,
          senderAddress: contractAddress,
        }),
      ]);

      const results = {
        maxSupply: null,
        mintedCount: null,
        remainingSupply: null,
        mintPrice: null,
        eventCancelled: false,
        eventDate: null,
        royaltyPercentage: null,
      };

      if (totalSupplyResult.status === 'fulfilled') {
        const parsed = cvToJSON(totalSupplyResult.value);
        results.maxSupply = parseClarityResponse(parsed);
        if (results.maxSupply) results.maxSupply = Number(results.maxSupply);
      }

      if (lastTokenIdResult.status === 'fulfilled') {
        const parsed = cvToJSON(lastTokenIdResult.value);
        results.mintedCount = parseClarityResponse(parsed);
        if (results.mintedCount) results.mintedCount = Number(results.mintedCount);
      }

      if (remainingResult.status === 'fulfilled') {
        const parsed = cvToJSON(remainingResult.value);
        results.remainingSupply = parseClarityResponse(parsed);
        if (results.remainingSupply) results.remainingSupply = Number(results.remainingSupply);
      }

      if (priceResult.status === 'fulfilled') {
        const parsed = cvToJSON(priceResult.value);
        results.mintPrice = parseClarityResponse(parsed)?.toString();
      }

      if (cancelledResult.status === 'fulfilled') {
        const parsed = cvToJSON(cancelledResult.value);
        results.eventCancelled = parseClarityResponse(parsed) === true;
      }

      // Cache for 2 minutes (120 seconds)
      cache.set(cacheKey, results, 120);
      res.json(results);

    } catch (error) {
      console.error('Error fetching NFT data with Stacks.js:', error.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch NFT ticket data'
      });
    }
  });

  // Get event details
  app.get('/api/stacks/contract/:contractId/event-details', async (req, res) => {
    try {
      const { contractId } = req.params;
      const cacheKey = `stacks_event_details_${contractId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const parts = contractId.split('.');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      const contractAddress = parts[0];
      const contractName = parts[1];

      const eventDetailsResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-event-details',
        functionArgs: [],
        network: NETWORK,
        senderAddress: contractAddress,
      });

      if (!eventDetailsResult) {
        return res.status(404).json({ error: 'Event details not found' });
      }

      const eventDetails = cvToJSON(eventDetailsResult);
      const parsedDetails = parseClarityResponse(eventDetails);

      // Cache for 2 minutes (120 seconds)
      cache.set(cacheKey, parsedDetails, 120);
      res.json(parsedDetails);

    } catch (error) {
      console.error('Error fetching event details:', error.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch event details'
      });
    }
  });

  // Check if user owns any tokens from a contract
  app.get('/api/stacks/contract/:contractId/user/:userAddress/owned-tokens', async (req, res) => {
    try {
      const { contractId, userAddress } = req.params;
      const cacheKey = `user_tokens_${contractId}_${userAddress}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const parts = contractId.split('.');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      const contractAddress = parts[0];
      const contractName = parts[1];

      // Get last token ID to know range
      const lastTokenIdResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-last-token-id',
        functionArgs: [],
        network: NETWORK,
        senderAddress: contractAddress,
      });

      const lastTokenIdValue = cvToJSON(lastTokenIdResult);
      const lastTokenId = parseClarityResponse(lastTokenIdValue);
      
      if (!lastTokenId || lastTokenId === 0) {
        const result = [];
        cache.set(cacheKey, result, 120);
        return res.json(result);
      }

      // Check ownership for each token (up to a reasonable limit)
      const maxTokensToCheck = Math.min(lastTokenId, 100); // Prevent excessive API calls
      const ownershipChecks = [];
      
      for (let tokenId = 1; tokenId <= maxTokensToCheck; tokenId++) {
        ownershipChecks.push(
          callReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-owner',
            functionArgs: [uintCV(tokenId)],
            network: NETWORK,
            senderAddress: contractAddress,
          })
            .then((result) => {
              try {
                const ownerResult = cvToJSON(result);
                const owner = parseClarityResponse(ownerResult);
                
                if (owner === userAddress) {
                  return tokenId;
                }
              } catch (err) {
                console.warn(`Error parsing token #${tokenId}:`, err);
              }
              return null;
            })
            .catch((err) => {
              console.warn(`Error getting owner of token #${tokenId}:`, err);
              return null;
            })
        );
      }

      const results = await Promise.all(ownershipChecks);
      const ownedTokens = results.filter((id) => id !== null);

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, ownedTokens, 300);
      res.json(ownedTokens);

    } catch (error) {
      console.error('Error checking token ownership:', error.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check token ownership'
      });
    }
  });

  // Get STX balance for an address
  app.get('/api/stacks/address/:address/balance', async (req, res) => {
    try {
      const { address } = req.params;
      const cacheKey = `balance_${address}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Use Hiro API for balance (Stacks.js doesn't have balance queries)
      const axios = require('axios');
      const HIRO_API_BASE = process.env.HIRO_API_URL || 'https://api.testnet.hiro.so';
      const HIRO_API_KEY = process.env.HIRO_API_KEY || process.env.VITE_HIRO_API_KEY;
      
      const headers = {};
      if (HIRO_API_KEY) {
        headers['x-api-key'] = HIRO_API_KEY;
      }
      
      const response = await axios.get(`${HIRO_API_BASE}/extended/v1/address/${address}/balances`, {
        headers,
        timeout: 10000
      });

      const data = response.data;
      const balance = Number(data.stx.balance) / 1000000; // Convert microSTX to STX

      const result = {
        stx: {
          balance: data.stx.balance,
          balance_formatted: balance
        },
        fungible_tokens: data.fungible_tokens || {}
      };

      // Cache for 5 minutes (300 seconds) - longer cache to reduce API calls
      cache.set(cacheKey, result, 300);
      res.json(result);

    } catch (error) {
      console.error('Error fetching balance:', error.message);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        return res.status(429).json({
          error: 'Rate Limited',
          message: 'Too many requests to Hiro API. Please try again later.',
          retryAfter: error.response.headers['retry-after'] || 60
        });
      }
      
      res.status(error.response?.status || 500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch balance'
      });
    }
  });

  // Parse clarity response helper
  function parseClarityResponse(clarityValue) {
    if (!clarityValue) return null;

    const json = clarityValue;
    
    // Handle response types (ok/err) - check for 'success' property OR type starting with '(response'
    const isResponseType = json.type?.startsWith('(response') || 'success' in json;
    
    if (isResponseType) {
      if (json.success) {
        return parseClarityValue(json.value);
      } else {
        console.warn('Contract returned error response:', json.value);
        return null;
      }
    }
    
    // Direct parse
    return parseClarityValue(json);
  }

  // Parse clarity value helper
  function parseClarityValue(json) {
    if (!json) return null;
    
    const typeStr = json.type || '';

    // Check if it's a tuple (type string starts with "(tuple")
    if (typeStr.startsWith('(tuple')) {
      const tupleObj = {};
      if (json.value && typeof json.value === 'object') {
        for (const [key, value] of Object.entries(json.value)) {
          tupleObj[key] = parseClarityValue(value);
        }
      }
      return tupleObj;
    }

    // Handle string types with length specifier like "(string-ascii 46)"
    if (typeStr.startsWith('(string-ascii') || typeStr.startsWith('(string-utf8')) {
      return json.value;
    }

    switch (typeStr) {
      case 'uint':
      case 'int':
        // Convert BigInt to string for JSON serialization
        const bigIntValue = typeof json.value === 'string' ? BigInt(json.value) : BigInt(json.value);
        return bigIntValue.toString();

      case 'bool':
        return json.value;

      case 'string-ascii':
      case 'string-utf8':
        return json.value;

      case 'principal':
        return json.value;

      case 'optional':
        return json.value ? parseClarityValue(json.value) : null;

      case 'list':
        return json.value.map((item) => parseClarityValue(item));

      default:
        return json.value;
    }
  }
};