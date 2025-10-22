const { parseClarityValue } = require('../utils/clarityParser');
const { makeHiroRequest } = require('../utils/hiroApiHelper');

module.exports = (app, cache, axios, getHiroHeaders, HIRO_API_BASE) => {
  // Get contract information by contract ID
  app.get('/api/hiro/contract/:contractId', async (req, res) => {
    try {
      const { contractId } = req.params;
      const cacheKey = `contract_${contractId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const [address, name] = contractId.split('.');
      if (!address || !name) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      // Try V2 API first, fallback to extended API
      let url = `${HIRO_API_BASE}/v2/contracts/by_id/${address}/${name}`;
      let response;
      
      try {
        response = await makeHiroRequest(url, {
          method: 'GET',
          headers: getHiroHeaders()
        });
      } catch (v2Error) {
        // Fallback to extended V1 API
        url = `${HIRO_API_BASE}/extended/v1/contract/${address}.${name}`;
        response = await makeHiroRequest(url, {
          method: 'GET',
          headers: getHiroHeaders()
        });
      }

      const data = response.data;

      // Cache for 10 minutes (600 seconds)
      cache.set(cacheKey, data, 600);
      res.json(data);

    } catch (error) {
      console.error('Error fetching contract info:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch contract information' 
        });
      }
    }
  });

  // Get transaction status
  app.get('/api/hiro/transaction/:txId', async (req, res) => {
    try {
      const { txId } = req.params;
      const cacheKey = `tx_${txId}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const url = `${HIRO_API_BASE}/extended/v1/tx/${txId}`;
      const response = await axios.get(url, {
        headers: getHiroHeaders(),
        timeout: 10000
      });

      const data = response.data;

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, data, 300);
      res.json(data);

    } catch (error) {
      console.error('Error fetching transaction status:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch transaction status' 
        });
      }
    }
  });

  // Get all transactions for a contract
  app.get('/api/hiro/contract/:contractId/transactions', async (req, res) => {
    try {
      const { contractId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const cacheKey = `contract_${contractId}_transactions_${limit}_${offset}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const [address, name] = contractId.split('.');
      if (!address || !name) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      const url = `${HIRO_API_BASE}/extended/v1/contract/${address}.${name}/transactions?limit=${limit}&offset=${offset}`;
      const response = await axios.get(url, {
        headers: getHiroHeaders(),
        timeout: 15000
      });

      const data = response.data;

      // Cache for 3 minutes (180 seconds) - transactions change frequently
      cache.set(cacheKey, data, 180);
      res.json(data);

    } catch (error) {
      console.error('Error fetching contract transactions:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch contract transactions' 
        });
      }
    }
  });

  // Get contract events
  app.get('/api/hiro/contract/:contractId/events', async (req, res) => {
    try {
      const { contractId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const cacheKey = `contract_${contractId}_events_${limit}_${offset}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const [address, name] = contractId.split('.');
      if (!address || !name) {
        return res.status(400).json({ error: 'Invalid contract ID format' });
      }

      const url = `${HIRO_API_BASE}/extended/v1/contract/${address}.${name}/events?limit=${limit}&offset=${offset}`;
      const response = await axios.get(url, {
        headers: getHiroHeaders(),
        timeout: 15000
      });

      const data = response.data;

      // Cache for 2 minutes (120 seconds) - events change frequently
      cache.set(cacheKey, data, 120);
      res.json(data);

    } catch (error) {
      console.error('Error fetching contract events:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch contract events' 
        });
      }
    }
  });

  // Get transactions by address
  app.get('/api/hiro/address/:address/transactions', async (req, res) => {
    try {
      const { address } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const cacheKey = `address_${address}_transactions_${limit}_${offset}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Validate address format
      if (!address || address.length < 20) {
        return res.status(400).json({ error: 'Invalid address format' });
      }

      if (!address.startsWith('ST') && !address.startsWith('SP')) {
        return res.status(400).json({ error: 'Address does not start with ST or SP' });
      }

      const url = `${HIRO_API_BASE}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
      const response = await axios.get(url, {
        headers: getHiroHeaders(),
        timeout: 15000
      });

      const data = response.data;

      // Cache for 3 minutes (180 seconds)
      cache.set(cacheKey, data, 180);
      res.json(data);

    } catch (error) {
      console.error('Error fetching address transactions:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch address transactions' 
        });
      }
    }
  });

  // Get contract deployments by address
  app.get('/api/hiro/address/:address/deployments', async (req, res) => {
    try {
      const { address } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const cacheKey = `address_${address}_deployments_${limit}_${offset}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Validate address format
      if (!address || address.length < 20) {
        return res.status(400).json({ error: 'Invalid address format' });
      }

      if (!address.startsWith('ST') && !address.startsWith('SP')) {
        return res.status(400).json({ error: 'Address does not start with ST or SP' });
      }

      // Try V2 API first, fallback to V1
      let url = `${HIRO_API_BASE}/extended/v2/addresses/${address}/transactions`;
      let response;
      
      try {
        response = await axios.get(url, {
          headers: getHiroHeaders(),
          timeout: 15000
        });
      } catch (v2Error) {
        // Fallback to V1
        url = `${HIRO_API_BASE}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
        response = await axios.get(url, {
          headers: getHiroHeaders(),
          timeout: 15000
        });
      }

      const data = response.data;

      // Filter and format contract deployments
      const contractDeployments = (data.results || [])
        .filter((item) => {
          const tx = item.tx || item;
          return tx.tx_type === 'smart_contract';
        })
        .map((item) => {
          const tx = item.tx || item;
          const contractId = tx.smart_contract?.contract_id || `${tx.sender_address}.unknown`;
          const contractName = contractId.split('.')[1] || 'unknown';
          
          return {
            tx_id: tx.tx_id,
            contract_id: contractId,
            tx_status: tx.tx_status,
            block_height: tx.block_height,
            burn_block_time: tx.burn_block_time,
            burn_block_time_iso: tx.burn_block_time_iso,
            canonical: tx.canonical,
            contract_name: contractName,
            source_code: tx.smart_contract?.source_code,
          };
        });

      const result = {
        total: contractDeployments.length,
        results: contractDeployments,
      };

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, result, 300);
      res.json(result);

    } catch (error) {
      console.error('Error fetching contract deployments:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch contract deployments' 
        });
      }
    }
  });

  // Call read-only contract function via Hiro API
  app.post('/api/hiro/contract/:contractAddress/:contractName/call-read/:functionName', async (req, res) => {
    try {
      const { contractAddress, contractName, functionName } = req.params;
      const { arguments: functionArgs = [], sender } = req.body;
      
      const cacheKey = `readonly_${contractAddress}_${contractName}_${functionName}_${JSON.stringify(functionArgs)}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const url = `${HIRO_API_BASE}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
      const response = await axios.post(url, {
        sender: sender || contractAddress,
        arguments: functionArgs,
      }, {
        headers: getHiroHeaders(),
        timeout: 10000
      });

      const data = response.data;

      // Cache for 1 minute (60 seconds) - read-only functions might return different results quickly
      cache.set(cacheKey, data, 60);
      res.json(data);

    } catch (error) {
      console.error('Error calling read-only function:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to call read-only function' 
        });
      }
    }
  });

  // Get NFT events (mints, transfers, burns)
  app.get('/api/hiro/nft/:contractId/events', async (req, res) => {
    try {
      const { contractId } = req.params;
      const { type = 'all', limit = 100 } = req.query; // type: mints, transfers, all
      
      const cacheKey = `nft_${contractId}_events_${type}_${limit}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Get mints - use contract events API instead
      let mints = [];
      if (type === 'all' || type === 'mints') {
        try {
          const [address, name] = contractId.split('.');
          const eventsUrl = `${HIRO_API_BASE}/extended/v1/contract/${address}.${name}/events?limit=${limit}`;
          const eventsResponse = await axios.get(eventsUrl, {
            headers: getHiroHeaders(),
            timeout: 15000
          });
          
          mints = (eventsResponse.data.results || [])
            .filter((event) => event.event_type === 'non_fungible_token_asset' && event.asset?.asset_event_type === 'mint')
            .map((event) => ({
              txId: event.tx_id,
              tokenId: parseInt(event.asset?.value?.repr?.replace('u', '') || '0'),
              recipient: event.asset?.recipient || '',
              timestamp: event.timestamp || 0,
              blockHeight: event.block_height,
              price: undefined,
            }));
        } catch (mintError) {
          console.warn('Error fetching mints:', mintError.message);
        }
      }

      // Get transfers - use contract events API
      let transfers = [];
      if (type === 'all' || type === 'transfers') {
        try {
          const [address, name] = contractId.split('.');
          const eventsUrl = `${HIRO_API_BASE}/extended/v1/contract/${address}.${name}/events?limit=${limit}`;
          const eventsResponse = await axios.get(eventsUrl, {
            headers: getHiroHeaders(),
            timeout: 15000
          });
          
          transfers = (eventsResponse.data.results || [])
            .filter((event) => event.event_type === 'non_fungible_token_asset' && event.asset?.asset_event_type === 'transfer')
            .map((event) => ({
              txId: event.tx_id,
              tokenId: parseInt(event.asset?.value?.repr?.replace('u', '') || '0'),
              from: event.asset?.sender || '',
              to: event.asset?.recipient || '',
              timestamp: event.timestamp || 0,
              blockHeight: event.block_height,
            }));
        } catch (transferError) {
          console.warn('Error fetching transfers:', transferError.message);
        }
      }

      const result = {
        mints,
        transfers,
        burns: 0, // Would need to count burn events separately
        lastActivity: mints.length > 0 && mints[0] ? mints[0].timestamp : new Date().toISOString(),
      };

      // Cache for 2 minutes (120 seconds)
      cache.set(cacheKey, result, 120);
      res.json(result);

    } catch (error) {
      console.error('Error fetching NFT events:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch NFT events' 
        });
      }
    }
  });

  // Get NFT holders for a contract
  app.get('/api/hiro/nft/:contractId/holders', async (req, res) => {
    try {
      const { contractId } = req.params;
      const { limit = 200 } = req.query;
      
      const cacheKey = `nft_${contractId}_holders_${limit}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const url = `${HIRO_API_BASE}/extended/v1/tokens/nft/holdings?principal=${contractId}&limit=${limit}`;
      const response = await axios.get(url, {
        headers: getHiroHeaders(),
        timeout: 15000
      });

      const data = response.data;

      // Group by holder address
      const holdersMap = new Map();
      (data.results || []).forEach((holding) => {
        const address = holding.principal;
        const tokenId = parseInt(holding.value?.repr?.replace('u', '') || '0');

        if (!holdersMap.has(address)) {
          holdersMap.set(address, {
            address,
            tokenIds: [],
            tokenCount: 0,
            firstAcquired: holding.block_height,
            lastActivity: holding.block_height,
          });
        }

        const holder = holdersMap.get(address);
        holder.tokenIds.push(tokenId);
        holder.tokenCount++;
      });

      const holders = Array.from(holdersMap.values());

      // Cache for 5 minutes (300 seconds)
      cache.set(cacheKey, { total: holders.length, holders }, 300);
      res.json({ total: holders.length, holders });

    } catch (error) {
      console.error('Error fetching NFT holders:', error.message);
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch NFT holders' 
        });
      }
    }
  });

  // Get NFT holdings for a specific user
  app.get('/api/hiro/nft/user/:userAddress/holdings', async (req, res) => {
    try {
      const { userAddress } = req.params;
      const { limit = 200 } = req.query;
      
      const cacheKey = `nft_user_holdings_${userAddress}_${limit}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('✅ Returning cached NFT holdings');
        return res.json(cached);
      }

      console.log(`⚙️  Fetching NFT holdings for ${userAddress}`);

      const url = `${HIRO_API_BASE}/extended/v1/tokens/nft/holdings?principal=${userAddress}&limit=${limit}`;
      const response = await makeHiroRequest(url, {
        method: 'GET',
        headers: getHiroHeaders()
      });

      const data = response.data;

      // Process and transform the data
      const nfts = [];
      
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          try {
            // Parse asset identifier
            const assetId = item.asset_identifier;
            const [contractPart, assetName] = assetId.split('::');
            const [contractAddress, contractName] = contractPart.split('.');
            
            // Extract token ID
            const tokenId = parseInt(item.value?.repr?.replace('u', '') || '0');
            
            if (contractAddress && contractName && assetName) {
              nfts.push({
                contractId: `${contractAddress}.${contractName}`,
                contractAddress,
                contractName,
                tokenId,
                assetIdentifier: assetId,
                owner: userAddress,
              });
            }
          } catch (err) {
            console.warn('⚠️  Error parsing NFT item:', err);
          }
        }
      }

      const result = {
        total: nfts.length,
        nfts,
        results: data.results, // Keep raw data for compatibility
      };

      // Cache for 3 minutes (180 seconds)
      cache.set(cacheKey, result, 180);
      res.json(result);

    } catch (error) {
      console.error('Error fetching user NFT holdings:', error.message);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        return res.status(429).json({
          error: 'Rate Limited',
          message: 'Too many requests. Please try again later.',
          retryAfter: error.response.headers['retry-after'] || 60
        });
      }
      
      if (error.response) {
        res.status(error.response.status).json({ 
          error: 'External API Error',
          message: error.response.data || error.response.statusText 
        });
      } else {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch NFT holdings' 
        });
      }
    }
  });
};