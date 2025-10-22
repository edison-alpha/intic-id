const { parseClarityValue } = require('../utils/clarityParser');
const { jsonArrayToClarityValues } = require('../utils/clarityConverter');
const { hexToCV } = require('@stacks/transactions');
const { StacksTestnet, StacksMainnet } = require('@stacks/network');

module.exports = (app, cache, axios, callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV, DEFAULT_NETWORK) => {
  const HIRO_API_BASE = process.env.HIRO_API_URL || 'https://api.testnet.hiro.so';
  const NETWORK = DEFAULT_NETWORK === 'mainnet' 
    ? new StacksMainnet() 
    : new StacksTestnet();

  // Helper function to parse Clarity response
  const parseClarityResponse = (response) => {
    if (!response) {
      return null;
    }

    try {
      // Get the actual data object
      let data = null;
      
      // Handle different response structures from cvToJSON
      if (response.value?.value) {
        data = response.value.value;
      } else if (response.value) {
        data = response.value;
      } else {
        data = response;
      }

      // If data is an object, extract event details
      if (data && typeof data === 'object') {
        // Handle kebab-case or camelCase field names
        const getValue = (obj, ...keys) => {
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null) {
              // If value is object with 'value' property, extract it
              if (typeof obj[key] === 'object' && obj[key].value !== undefined) {
                return obj[key].value;
              }
              return obj[key];
            }
          }
          return null;
        };

        return {
          eventName: getValue(data, 'event-name', 'eventName', 'name'),
          eventDate: getValue(data, 'event-date', 'eventDate', 'date'),
          venue: getValue(data, 'venue', 'location'),
          venueAddress: getValue(data, 'venue-address', 'venueAddress', 'address'),
          image: getValue(data, 'image-uri', 'image-url', 'imageUri', 'image'),
          imageUri: getValue(data, 'image-uri', 'image-url', 'imageUri', 'image'),
          price: parseInt(getValue(data, 'price', 'ticket-price') || '0'),
          ticketsAvailable: parseInt(getValue(data, 'tickets-available', 'ticketsAvailable', 'available') || '0'),
          maxTickets: parseInt(getValue(data, 'max-tickets', 'maxTickets', 'capacity', 'total-supply') || '0'),
          category: getValue(data, 'category', 'type'),
          description: getValue(data, 'description', 'desc'),
          isUsed: getValue(data, 'is-used', 'isUsed', 'used') === true,
          cancelled: getValue(data, 'cancelled', 'is-cancelled', 'isCancelled') === true,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing Clarity response:', error);
      return null;
    }
  };

  const getHiroHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (process.env.HIRO_API_KEY) {
      headers['x-api-key'] = process.env.HIRO_API_KEY;
    }

    return headers;
  };

  // Optimized endpoint for BrowseEvents (MyTickets equivalent)
  app.get('/api/optimized/events', async (req, res) => {
    try {
      const cacheKey = 'optimized_events_list';
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }      // Get registry contract details
      const REGISTRY_ADDRESS = process.env.REGISTRY_CONTRACT_ADDRESS || 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C';
      const REGISTRY_NAME = 'event-registry-v2';

      // Step 1: Get total events count
      const totalResult = await callReadOnlyFunction({
        contractAddress: REGISTRY_ADDRESS,
        contractName: REGISTRY_NAME,
        functionName: 'get-total-events',
        functionArgs: [],
        network: NETWORK,
        senderAddress: REGISTRY_ADDRESS,
      });

      const totalEventsData = cvToJSON(totalResult);
      
      // Response can be: { type: 'ok', value: { type: 'uint', value: '23' } }
      // or: { value: { value: '23' } }
      let totalEvents = 0;
      
      if (totalEventsData?.value?.value) {
        // Nested value structure
        totalEvents = parseInt(totalEventsData.value.value);
      } else if (totalEventsData?.value) {
        // Direct value
        totalEvents = parseInt(totalEventsData.value);
      }

      if (totalEvents === 0) {
        const result = { events: [], total: 0 };
        cache.set(cacheKey, result, 300);
        return res.json(result);
      }

      // Step 2: Fetch events in batches
      const events = [];
      const batchSize = 10;

      for (let startId = 1; startId <= totalEvents; startId += batchSize) {
        const endId = Math.min(startId + batchSize - 1, totalEvents);

        try {
          const batchResult = await callReadOnlyFunction({
            contractAddress: REGISTRY_ADDRESS,
            contractName: REGISTRY_NAME,
            functionName: 'get-events-range',
            functionArgs: [uintCV(startId), uintCV(endId)],
            network: NETWORK,
            senderAddress: REGISTRY_ADDRESS,
          });

          const batchData = cvToJSON(batchResult);
          
          // Response structure: { success: true, value: { value: { start, end, events: { value: [...] } } } }
          const tupleValue = batchData?.value?.value || {};
          const eventsList = tupleValue.events?.value || [];

          // Parse each event
          for (let i = 0; i < eventsList.length; i++) {
            const item = eventsList[i];
            
            // Check if item is some (not none)
            if (item?.value?.value) {
              const eventData = item.value.value;
              
              // Extract contract-address - only use the principal (address part)
              const contractAddressFull = eventData['contract-address']?.value || '';
              const contractName = eventData['contract-name']?.value || '';
              
              // Extract only principal address (before first dot if exists)
              const contractAddress = contractAddressFull.split('.')[0];
              
              const event = {
                eventId: parseInt(eventData['event-id']?.value || '0'),
                contractAddress,
                contractName,
                organizer: eventData.organizer?.value || '',
                registeredAt: parseInt(eventData['registered-at']?.value || '0'),
                isActive: eventData['is-active']?.value === true,
                isVerified: eventData['is-verified']?.value === true,
                isFeatured: eventData['is-featured']?.value === true,
              };

              if (event.isActive && event.contractAddress) {
                events.push(event);
              }
            }
          }
        } catch (batchError) {
          console.error(`Error fetching batch ${startId}-${endId}:`, batchError.message);
        }
      }

      const result = { events, total: events.length };

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, result, 300);
      res.json(result);

    } catch (error) {
      console.error('Error fetching optimized events:', error.message);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch events',
        events: [], // Return empty array instead of error
        total: 0
      });
    }
  });

  // Optimized endpoint for user's tickets
  app.get('/api/optimized/user/:userAddress/tickets', async (req, res) => {
    try {
      const { userAddress } = req.params;
      const cacheKey = `user_tickets_${userAddress}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }      // Step 1: Get all NFTs owned by user from Hiro API
      const nftUrl = `${HIRO_API_BASE}/extended/v1/tokens/nft/holdings?principal=${userAddress}&limit=200`;
      const nftResponse = await axios.get(nftUrl, {
        headers: getHiroHeaders(),
        timeout: 15000
      });

      const nftData = nftResponse.data;
      const userTickets = [];

      if (!nftData || !nftData.results || nftData.results.length === 0) {
        const result = {
          tickets: [],
          total: 0
        };
        cache.set(cacheKey, result, 180);
        return res.json(result);
      }

      // Step 2: Process each NFT and fetch event details
      for (const nft of nftData.results) {
        try {
          // Parse asset identifier
          const assetId = nft.asset_identifier;
          const [contractPart, assetName] = assetId.split('::');
          const [contractAddress, contractName] = contractPart.split('.');
          
          // Extract token ID
          const tokenId = parseInt(nft.value?.repr?.replace('u', '') || '0');
          
          if (!contractAddress || !contractName) continue;

          const contractId = `${contractAddress}.${contractName}`;

          // Try to get event details (check if already cached)
          const eventCacheKey = `optimized_event_${contractId}`;
          let eventDetails = cache.get(eventCacheKey);

          // If not cached, fetch from contract
          if (!eventDetails) {
            // Try different function names (newer contracts have get-event-details, older have get-event-info)
            const functionNames = ['get-event-details', 'get-event-info'];
            let success = false;
            
            for (const functionName of functionNames) {
              try {
                const eventResult = await callReadOnlyFunction({
                  contractAddress,
                  contractName,
                  functionName,
                  functionArgs: [],
                  network: NETWORK,
                  senderAddress: contractAddress,
                });

                if (eventResult) {
                  const parsedDetails = cvToJSON(eventResult);
                  eventDetails = parseClarityResponse(parsedDetails);
                  
                  // Cache event details for 2 minutes
                  cache.set(eventCacheKey, eventDetails, 120);
                  success = true;
                  break; // Found working function, stop trying
                }
              } catch (err) {
                // Try next function name
                continue;
              }
            }
            
            if (!success) {
              console.warn(`⚠️  Could not fetch details for ${contractId}: No working read-only function found`);
              // Use minimal details
              eventDetails = {
                name: contractName,
                eventName: contractName,
              };
            }
          }

          // Create ticket object with UI-compatible fields
          const eventDateValue = eventDetails?.eventDate;
          let formattedDate = 'TBA';
          let formattedTime = 'TBA';
          
          if (eventDateValue) {
            try {
              // Handle both timestamp (in milliseconds) and string dates
              const timestamp = typeof eventDateValue === 'number' 
                ? (eventDateValue > 9999999999 ? eventDateValue : eventDateValue * 1000) // Handle both seconds and milliseconds
                : new Date(eventDateValue).getTime();
              
              const dateObj = new Date(timestamp);
              if (!isNaN(dateObj.getTime())) {
                // Format: "Dec 25, 2025"
                formattedDate = dateObj.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                // Format: "19:00"
                formattedTime = dateObj.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                });
              }
            } catch (err) {
              console.warn('Date parsing error:', err.message);
            }
          }

          const ticket = {
            // UI required fields
            id: `${contractId}-${tokenId}`,
            ticketNumber: `#${tokenId}`,
            eventName: eventDetails?.eventName || eventDetails?.name || contractName.replace(/-/g, ' '),
            eventDate: formattedDate,
            eventTime: formattedTime,
            location: eventDetails?.venueAddress || eventDetails?.venue || 'TBA',
            image: eventDetails?.image || eventDetails?.imageUri || null,
            quantity: 1, // Each NFT = 1 ticket
            category: eventDetails?.category || 'General',
            
            // Determine status: used, active (upcoming), or expired
            status: (() => {
              if (eventDetails?.isUsed) return 'used';
              
              // Check if event is in the past
              const eventTimestamp = typeof eventDateValue === 'number' 
                ? (eventDateValue > 9999999999 ? eventDateValue : eventDateValue * 1000)
                : new Date(eventDateValue).getTime();
              
              if (eventTimestamp && !isNaN(eventTimestamp) && eventTimestamp < Date.now()) {
                return 'expired';
              }
              
              return 'active'; // Upcoming event
            })(),
            
            // Backend/blockchain fields
            tokenId,
            contractId,
            contractAddress,
            contractName,
            venue: eventDetails?.venue || 'TBA',
            price: eventDetails?.price 
              ? (eventDetails.price > 1000000 ? eventDetails.price / 1000000 : eventDetails.price)
              : 0,
            owner: userAddress,
            isUsed: eventDetails?.isUsed || false,
            mintTxId: nft.tx_id || null,
          };

          userTickets.push(ticket);

        } catch (parseError) {
          console.error('Error parsing NFT:', parseError.message);
        }
      }

      const result = {
        tickets: userTickets,
        total: userTickets.length
      };

      // Cache for 1 minute (60 seconds) - shorter TTL for user data
      cache.set(cacheKey, result, 60);
      res.json(result);

    } catch (error) {
      console.error('Error fetching user tickets:', error.message);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        return res.status(429).json({
          error: 'Rate Limited',
          message: 'Too many requests. Please try again later.',
          retryAfter: error.response.headers['retry-after'] || 60
        });
      }
      
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to fetch user tickets',
        tickets: [],
        total: 0
      });
    }
  });

  // Optimized endpoint for specific event details
  app.get('/api/optimized/event/:contractId', async (req, res) => {
    try {
      const { contractId } = req.params;
      const cacheKey = `optimized_event_${contractId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Get event data using the existing Stacks.js route
      // This would call our existing /api/stacks/contract/:contractId/event-details endpoint
      // but for this implementation, I'll create a direct call
      const parts = contractId.split('.');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      const contractAddress = parts[0];
      const contractName = parts[1];

      // Try to get event details using Stacks.js
      let eventDetails = null;
      
      try {
        const eventDetailsResult = await callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-event-details',
          functionArgs: [],
          network: NETWORK,
          senderAddress: contractAddress,
        });

        if (eventDetailsResult) {
          const parsedDetails = cvToJSON(eventDetailsResult);
          eventDetails = parseClarityResponse(parsedDetails);
        }
      } catch (e) {
        // If get-event-details fails, try get-event-info
        try {
          const eventInfoResult = await callReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-event-info',
            functionArgs: [],
            network: NETWORK,
            senderAddress: contractAddress,
          });

          if (eventInfoResult) {
            const parsedInfo = cvToJSON(eventInfoResult);
            eventDetails = parseClarityResponse(parsedInfo);
          }
        } catch (e2) {
          // If both fail, try individual functions
          const [nameResult, dateResult, priceResult, supplyResult, remainingResult] = await Promise.allSettled([
            callReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-event-name',
              functionArgs: [],
              network: NETWORK,
              senderAddress: contractAddress,
            }),
            callReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-event-date',
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
              functionName: 'get-total-supply',
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
          ]);

          eventDetails = {};
          
          if (nameResult.status === 'fulfilled') {
            const parsed = cvToJSON(nameResult.value);
            eventDetails.name = parseClarityResponse(parsed);
          }
          
          if (dateResult.status === 'fulfilled') {
            const parsed = cvToJSON(dateResult.value);
            eventDetails['event-date'] = parseClarityResponse(parsed);
          }
          
          if (priceResult.status === 'fulfilled') {
            const parsed = cvToJSON(priceResult.value);
            eventDetails.price = parseClarityResponse(parsed);
          }
          
          if (supplyResult.status === 'fulfilled') {
            const parsed = cvToJSON(supplyResult.value);
            eventDetails['total-supply'] = parseClarityResponse(parsed);
          }
          
          if (remainingResult.status === 'fulfilled') {
            const parsed = cvToJSON(remainingResult.value);
            eventDetails['tickets-remaining'] = parseClarityResponse(parsed);
          }
        }
      }

      // Format response similar to frontend requirements
      const result = {
        contractId,
        eventName: eventDetails?.name || eventDetails?.['event-name'] || 'Unknown Event',
        eventDate: eventDetails?.['event-date'] ? new Date(eventDetails['event-date'] * 1000).toISOString() : null,
        venue: eventDetails?.venue || 'TBA',
        venueAddress: eventDetails?.['venue-address'] || null,
        venueCoordinates: eventDetails?.['venue-coordinates'] || null,
        image: eventDetails?.['image-uri'] || eventDetails?.imageUri || null,
        price: eventDetails?.price ? Number(eventDetails.price) / 1000000 : 0, // Convert microSTX to STX
        priceFormatted: eventDetails?.price ? (Number(eventDetails.price) / 1000000).toFixed(6) : '0',
        totalSupply: eventDetails?.['total-supply'] || eventDetails?.totalSupply || 0,
        available: eventDetails?.['tickets-remaining'] || eventDetails?.ticketsRemaining || 0,
        isCancelled: eventDetails?.cancelled || false,
        isActive: !(eventDetails?.cancelled || false),
        metadataUri: eventDetails?.['metadata-uri'] || eventDetails?.metadataUri || null,
      };

      // Cache for 2 minutes (120 seconds)
      cache.set(cacheKey, result, 120);
      res.json(result);

    } catch (error) {
      console.error('Error fetching event details:', error.message);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to fetch event details' 
      });
    }
  });

  // Optimized endpoint for user's owned tokens in a specific contract
  app.get('/api/optimized/contract/:contractId/user/:userAddress/tokens', async (req, res) => {
    try {
      const { contractId, userAddress } = req.params;
      const cacheKey = `user_contract_tokens_${contractId}_${userAddress}`;
      
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

      // Get last token ID to know the range
      const lastTokenIdResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-last-token-id',
        functionArgs: [],
        network: NETWORK,
        senderAddress: contractAddress,
      });

      const parsedLastTokenId = cvToJSON(lastTokenIdResult);
      const lastTokenId = parseClarityResponse(parsedLastTokenId);

      if (!lastTokenId || lastTokenId === 0) {
        const result = [];
        cache.set(cacheKey, result, 300);
        return res.json(result);
      }

      // Limit the number of tokens to check to prevent excessive API calls
      const maxTokensToCheck = Math.min(lastTokenId, 50);
      const ownershipPromises = [];

      for (let tokenId = 1; tokenId <= maxTokensToCheck; tokenId++) {
        ownershipPromises.push(
          callReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-owner',
            functionArgs: [uintCV(tokenId)],
            network: NETWORK,
            senderAddress: contractAddress,
          })
            .then(result => {
              const ownerResult = cvToJSON(result);
              const owner = parseClarityResponse(ownerResult);
              return owner === userAddress ? tokenId : null;
            })
            .catch(err => {
              console.warn(`Error checking ownership of token #${tokenId}:`, err.message);
              return null;
            })
        );
      }

      const ownershipResults = await Promise.all(ownershipPromises);
      const ownedTokens = ownershipResults.filter(tokenId => tokenId !== null);

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, ownedTokens, 300);
      res.json(ownedTokens);

    } catch (error) {
      console.error('Error fetching user tokens:', error.message);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to fetch user tokens' 
      });
    }
  });

  // Optimized endpoint for check-in validation
  app.post('/api/optimized/checkin/validate', async (req, res) => {
    try {
      const { contractId, tokenId, userAddress } = req.body;
      
      if (!contractId || !tokenId || !userAddress) {
        return res.status(400).json({ error: 'Missing required fields: contractId, tokenId, userAddress' });
      }

      const cacheKey = `checkin_validation_${contractId}_${tokenId}_${userAddress}`;
      
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

      // Check if ticket exists and get details
      const ticketResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-ticket',
        functionArgs: [uintCV(tokenId)],
        network: NETWORK,
        senderAddress: contractAddress,
      });

      const ticketData = cvToJSON(ticketResult);
      const ticket = parseClarityResponse(ticketData);

      if (!ticket) {
        const result = {
          isValid: false,
          isUsed: false,
          isExpired: false,
          owner: '',
          message: 'Ticket not found',
        };
        
        cache.set(cacheKey, result, 60); // Cache for 1 minute
        return res.json(result);
      }

      // Check if ticket is already used
      const isUsed = ticket['is-used'] || ticket.isUsed || false;
      if (isUsed) {
        const result = {
          isValid: false,
          isUsed: true,
          isExpired: false,
          owner: ticket.owner || '',
          message: 'Ticket already used',
        };
        
        cache.set(cacheKey, result, 60);
        return res.json(result);
      }

      // Check ownership
      const owner = ticket.owner || '';
      if (owner !== userAddress) {
        const result = {
          isValid: false,
          isUsed: false,
          isExpired: false,
          owner: owner,
          message: 'Not the ticket owner',
        };
        
        cache.set(cacheKey, result, 60);
        return res.json(result);
      }

      // Check if ticket exists but not used and owned by user
      const result = {
        isValid: true,
        isUsed: false,
        isExpired: false,
        owner: owner,
        message: 'Ticket valid for check-in',
      };

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, result, 300);
      res.json(result);

    } catch (error) {
      console.error('Error validating check-in:', error.message);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to validate check-in' 
      });
    }
  });

  // Aggregated analytics for a contract
  app.get('/api/optimized/contract/:contractId/analytics', async (req, res) => {
    try {
      const { contractId } = req.params;
      const cacheKey = `contract_analytics_${contractId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Fetch all relevant data in parallel
      const [transactions, events, holders, contractData] = await Promise.allSettled([
        // Get contract transactions
        axios.get(`${HIRO_API_BASE}/extended/v1/contract/${contractId}/transactions?limit=100`, {
          headers: getHiroHeaders(),
          timeout: 10000
        }),
        
        // Get contract events
        axios.get(`${HIRO_API_BASE}/extended/v1/contract/${contractId}/events?limit=100`, {
          headers: getHiroHeaders(),
          timeout: 10000
        }),
        
        // Get NFT holders
        axios.get(`${HIRO_API_BASE}/extended/v1/tokens/nft/holdings?principal=${contractId}&limit=200`, {
          headers: getHiroHeaders(),
          timeout: 10000
        }),
        
        // Get contract data using Stacks.js
        (async () => {
          const parts = contractId.split('.');
          if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error('Invalid contract ID');
          }
          
          const [address, name] = parts;
          
          const [supplyResult, soldResult, remainingResult, priceResult] = await Promise.allSettled([
            callReadOnlyFunction({
              contractAddress: address,
              contractName: name,
              functionName: 'get-total-supply',
              functionArgs: [],
              network: NETWORK,
              senderAddress: address,
            }),
            callReadOnlyFunction({
              contractAddress: address,
              contractName: name,
              functionName: 'get-last-token-id',
              functionArgs: [],
              network: NETWORK,
              senderAddress: address,
            }),
            callReadOnlyFunction({
              contractAddress: address,
              contractName: name,
              functionName: 'get-tickets-remaining',
              functionArgs: [],
              network: NETWORK,
              senderAddress: address,
            }),
            callReadOnlyFunction({
              contractAddress: address,
              contractName: name,
              functionName: 'get-ticket-price',
              functionArgs: [],
              network: NETWORK,
              senderAddress: address,
            }),
          ]);
          
          return {
            maxSupply: supplyResult.status === 'fulfilled' ? parseClarityResponse(cvToJSON(supplyResult.value)) : 0,
            sold: soldResult.status === 'fulfilled' ? parseClarityResponse(cvToJSON(soldResult.value)) : 0,
            remaining: remainingResult.status === 'fulfilled' ? parseClarityResponse(cvToJSON(remainingResult.value)) : 0,
            price: priceResult.status === 'fulfilled' ? parseClarityResponse(cvToJSON(priceResult.value)) : 0
          };
        })()
      ]);

      // Process transaction data
      let totalTransactions = 0;
      let successfulTxs = 0;
      let failedTxs = 0;
      let uniqueUsers = new Set();
      const dailyActivity = {};

      if (transactions.status === 'fulfilled') {
        const txData = transactions.value.data;
        totalTransactions = txData.total || txData.results?.length || 0;
        const txResults = txData.results || [];
        
        txResults.forEach(tx => {
          if (tx.tx_status === 'success') {
            successfulTxs++;
          } else if (tx.tx_status !== 'pending') {
            failedTxs++;
          }
          
          if (tx.sender_address) {
            uniqueUsers.add(tx.sender_address);
          }
          
          if (tx.burn_block_time_iso) {
            const date = new Date(tx.burn_block_time_iso).toISOString().split('T')[0];
            if (date) {
              dailyActivity[date] = (dailyActivity[date] || 0) + 1;
            }
          }
        });
      }

      // Process event data
      const totalEvents = events.status === 'fulfilled' 
        ? (events.value.data.total || events.value.data.results?.length || 0) 
        : 0;

      // Process holders data
      let totalHolders = 0;
      if (holders.status === 'fulfilled') {
        const holderData = holders.value.data;
        totalHolders = holderData.total || holderData.results?.length || 0;
      }

      // Process contract data
      const contractInfo = contractData.status === 'fulfilled' ? contractData.value : {
        maxSupply: 0, sold: 0, remaining: 0, price: 0
      };

      const result = {
        totalTransactions,
        successfulTransactions: successfulTxs,
        failedTransactions: failedTxs,
        totalEvents,
        uniqueUsers: uniqueUsers.size,
        totalHolders,
        dailyActivity,
        contractStats: {
          maxSupply: contractInfo.maxSupply,
          sold: contractInfo.sold,
          remaining: contractInfo.remaining,
          price: contractInfo.price ? Number(contractInfo.price) / 1000000 : 0
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache for 10 minutes (600 seconds)
      cache.set(cacheKey, result, 600);
      res.json(result);

    } catch (error) {
      console.error('Error fetching contract analytics:', error.message);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to fetch contract analytics' 
      });
    }
  });
};