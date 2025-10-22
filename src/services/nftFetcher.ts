/**
 * NFT Fetcher Service (OpenSea/Rainbow Style)
 * Directly queries Hiro blockchain indexer for user's NFTs
 * No dependency on registry contract - fully decentralized
 */

import { callReadOnlyFunction, cvToValue } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

const HIRO_API = import.meta.env.VITE_HIRO_API_URL || 'https://api.testnet.hiro.so';
const SERVER_BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8000';
const HIRO_API_KEY = import.meta.env.VITE_HIRO_API_KEY;

// Unified fallback image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';

export interface UserNFT {
  contractId: string;
  contractAddress: string;
  contractName: string;
  tokenId: number;
  assetIdentifier: string;
  owner: string;
}

export interface TicketMetadata {
  eventName: string;
  eventDate: string | null;
  eventTime: string;
  venue: string | null;
  image: string | null;
  description: string;
  category: string;
  price: string;
  priceFormatted: string;
}

/**
 * Fetch all NFT holdings for a user directly from Hiro API
 * This is how OpenSea/Rainbow does it - no registry needed!
 */
export async function fetchUserNFTHoldings(userAddress: string): Promise<UserNFT[]> {
  try {
    console.log('🔍 [NFTFetcher] Fetching NFTs for:', userAddress);

    // Try server first for better caching and rate limit handling
    try {
      const serverUrl = `${SERVER_BASE}/api/hiro/nft/user/${userAddress}/holdings`;
      console.log('  📡 Trying server:', serverUrl);
      
      const serverResponse = await fetch(serverUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        console.log('✅ Got NFT holdings from server');
        
        // Transform server response if needed
        if (serverData.nfts && Array.isArray(serverData.nfts)) {
          return serverData.nfts;
        }
        // If server returns raw data, process it below
        if (serverData.results) {
          const data = serverData;
          const nfts = processNFTHoldingsData(data);
          return nfts;
        }
      } else {
        console.log(`⚠️ Server returned ${serverResponse.status}, falling back to direct API`);
      }
    } catch (serverError) {
      console.log('⚠️ Server unavailable, using direct Hiro API:', serverError);
    }

    // Fallback to direct Hiro API
    const url = `${HIRO_API}/extended/v1/tokens/nft/holdings?principal=${userAddress}&limit=200`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (HIRO_API_KEY) {
      headers['x-api-key'] = HIRO_API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error('❌ Hiro API error:', response.status, response.statusText);
      
      // Handle rate limiting
      if (response.status === 429) {
        console.error('⚠️ Rate limited by Hiro API. Please wait and try again.');
        throw new Error('Rate limited. Please try again in a few moments.');
      }
      
      return [];
    }

    const data = await response.json();
    console.log('📦 Raw NFT holdings:', data);
    
    return processNFTHoldingsData(data);

  } catch (error) {
    console.error('❌ [NFTFetcher] Error fetching NFTs:', error);
    throw error; // Propagate error for better handling
  }
}

/**
 * Helper function to process NFT holdings data
 */
function processNFTHoldingsData(data: any): UserNFT[] {
  const nfts: UserNFT[] = [];

  if (data.results && Array.isArray(data.results)) {
    for (const item of data.results) {
      try {
        // Parse asset identifier: CONTRACT_ADDRESS.CONTRACT_NAME::ASSET_NAME
        const assetId = item.asset_identifier;
        const [contractPart, assetName] = assetId.split('::');
        const [contractAddress, contractName] = contractPart.split('.');

        // Extract token ID from value
        const tokenId = parseInt(item.value?.repr?.replace('u', '') || '0');

        // Only include NFTs with valid contract info
        if (contractAddress && contractName && assetName) {
          nfts.push({
            contractId: `${contractAddress}.${contractName}`,
            contractAddress,
            contractName,
            tokenId,
            assetIdentifier: assetId,
            owner: item.principal || '',
          });

          console.log(`  ✅ Found NFT: ${contractName} #${tokenId}`);
        }
      } catch (err) {
        console.warn('⚠️ Error parsing NFT item:', err);
      }
    }
  }

  console.log(`✅ [NFTFetcher] Total NFTs found: ${nfts.length}`);
  return nfts;
}

/**
 * Get event metadata from contract
 * Enhanced with retry logic for rate limit handling
 */
export async function getEventMetadataFromContract(
  contractAddress: string,
  contractName: string
): Promise<TicketMetadata> {

  // Always return metadata (never null) - use fallback if needed
  const fallbackMetadata: TicketMetadata = {
    eventName: contractName
      .split('-')
      .filter(part => isNaN(Number(part)))
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Event',
    eventDate: null,
    eventTime: 'TBA',
    venue: null,
    image: FALLBACK_IMAGE,
    description: 'Event ticket NFT',
    category: 'General',
    price: '0',
    priceFormatted: '0',
  };

  // Retry logic for rate limiting
  const MAX_RETRIES = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  📋 Getting metadata from ${contractAddress}.${contractName}... (attempt ${attempt}/${MAX_RETRIES})`);

      // Call get-event-details function
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-event-details',
        functionArgs: [],
        senderAddress: contractAddress,
        network,
      });

    const eventDetails = cvToValue(result);
    console.log('  📋 Event details raw:', JSON.stringify(eventDetails, null, 2));

    // Check if result has data
    if (!eventDetails || typeof eventDetails !== 'object') {
      console.warn('  ⚠️ No event details found, using fallback');
      return fallbackMetadata;
    }

    // Handle different response structures
    let details = eventDetails.value || eventDetails;

    // If wrapped in ok/response
    if (details?.type === 'ok' || details?.type === 'response') {
      details = details.value;
    }

    console.log('  📋 Parsed details:', details);

    // Helper function to extract value from Clarity object
    const extractValue = (field: any): any => {
      if (!field) return null;
      // If it's a Clarity object with .value property
      if (typeof field === 'object' && 'value' in field) {
        // If it's a uint, convert to number
        if (field.type === 'uint') {
          return Number(field.value);
        }
        return field.value;
      }
      // Otherwise return as is
      return field;
    };

    // Extract data safely - try multiple field names and extract .value
    const eventName = String(
      extractValue(details?.name) ||
      extractValue(details?.['event-name']) ||
      extractValue(details?.eventName) ||
      fallbackMetadata.eventName
    );

    const eventDate =
      extractValue(details?.['event-date']) ||
      extractValue(details?.date) ||
      extractValue(details?.eventDate) ||
      null;

    // Try multiple venue field names and extract .value
    const venue =
      extractValue(details?.['venue-address']) ||
      extractValue(details?.venue) ||
      extractValue(details?.location) ||
      extractValue(details?.venueAddress) ||
      extractValue(details?.place) ||
      extractValue(details?.address) ||
      null;

    const imageUri = String(
      extractValue(details?.['image-uri']) ||
      extractValue(details?.image) ||
      extractValue(details?.imageUri) ||
      extractValue(details?.img) ||
      FALLBACK_IMAGE
    );

    const description = String(
      extractValue(details?.description) ||
      extractValue(details?.desc) ||
      fallbackMetadata.description
    );

    const category = String(
      extractValue(details?.category) ||
      extractValue(details?.type) ||
      extractValue(details?.ticketType) ||
      'General'
    );

    const price = String(extractValue(details?.price) || '0');

    console.log('  📍 Extracted venue (final):', venue);
    console.log('  🏷️ Extracted event name (final):', eventName);

    // Format price safely
    let priceFormatted = '0';
    try {
      const priceNum = parseInt(price);
      if (!isNaN(priceNum)) {
        priceFormatted = (priceNum / 1000000).toFixed(2).replace(/\.?0+$/, '');
      }
    } catch {
      priceFormatted = '0';
    }

    // Format event time safely
    let eventTime = 'TBA';
    try {
      if (eventDate) {
        const date = new Date(eventDate);
        if (!isNaN(date.getTime())) {
          eventTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    } catch {
      eventTime = 'TBA';
    }

    const metadata: TicketMetadata = {
      eventName,
      eventDate,
      eventTime,
      venue,
      image: imageUri,
      description,
      category,
      price,
      priceFormatted,
    };

      console.log('  ✅ Metadata compiled:', metadata);
      return metadata;

    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      const errorMessage = error?.message || String(error);
      const is429 = errorMessage.includes('429') || errorMessage.includes('rate limit');
      
      if (is429 && attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`  ⚠️ Rate limited (429), retrying in ${delay}ms... (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      }
      
      // If not rate limit error or last attempt, break
      console.warn(`  ⚠️ Error getting metadata for ${contractAddress}.${contractName}:`, error);
      break;
    }
  }
  
  // If all retries failed, return fallback
  console.log('  🔄 Using fallback metadata after retries');
  return fallbackMetadata;
}

/**
 * Fetch NFT mint transaction from Hiro API
 * This gets the transaction hash when the NFT was minted
 */
export async function fetchNFTMintTransaction(
  contractId: string,
  tokenId: number
): Promise<string | null> {
  try {
    const [contractAddress, contractName] = contractId.split('.');

    console.log(`🔍 Fetching mint TX for ${contractId} token #${tokenId}`);

    // Try multiple asset identifier formats
    const possibleIdentifiers = [
      `${contractAddress}.${contractName}::ticket`,
      `${contractAddress}.${contractName}::nft-ticket`,
      `${contractAddress}.${contractName}::event-ticket`,
    ];

    // Method 1: Try NFT mints endpoint with different identifiers
    for (const assetIdentifier of possibleIdentifiers) {
      try {
        const url = `${HIRO_API}/extended/v1/tokens/nft/mints?asset_identifier=${encodeURIComponent(assetIdentifier)}&limit=200`;
        console.log(`  Trying: ${url}`);

        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        console.log(`  Found ${data.results?.length || 0} mint events`);

        if (data.results && Array.isArray(data.results)) {
          for (const event of data.results) {
            const eventTokenId = parseInt(event.value?.repr?.replace('u', '') || '0');
            console.log(`    Event token: ${eventTokenId}, looking for: ${tokenId}`);
            if (eventTokenId === tokenId) {
              console.log(`  ✅ Found mint TX: ${event.tx_id}`);
              return event.tx_id || null;
            }
          }
        }
      } catch (err) {
        console.warn(`  ⚠️ Error with identifier ${assetIdentifier}:`, err);
      }
    }

    // Method 2: Use NFT history endpoint (more reliable)
    try {
      const historyUrl = `${HIRO_API}/extended/v1/address/${contractAddress}/nft_events?limit=200`;
      console.log(`  Trying history: ${historyUrl}`);

      const historyResponse = await fetch(historyUrl);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log(`  Found ${historyData.nft_events?.length || 0} NFT events`);

        if (historyData.nft_events && Array.isArray(historyData.nft_events)) {
          for (const event of historyData.nft_events) {
            // Check if this is a mint event for our contract and token
            if (event.asset_identifier?.includes(contractName)) {
              const eventTokenId = parseInt(event.value?.repr?.replace('u', '') || '0');
              console.log(`    History event token: ${eventTokenId}, type: ${event.event_type}`);

              if (eventTokenId === tokenId && event.event_type === 'mint') {
                console.log(`  ✅ Found mint TX from history: ${event.tx_id}`);
                return event.tx_id || null;
              }
            }
          }
        }
      } else {
        console.log(`  ⚠️ History endpoint returned ${historyResponse.status}, skipping...`);
      }
    } catch (err) {
      console.warn('  ⚠️ Error fetching NFT history:', err);
    }

    console.log('  Method 2 failed, trying Method 3...');

    // Method 3: Get contract transactions and find mint-ticket calls
    try {
      const txUrl = `${HIRO_API}/extended/v1/address/${contractAddress}.${contractName}/transactions?limit=200`;
      console.log(`  Trying contract transactions: ${txUrl}`);

      const txResponse = await fetch(txUrl);
      console.log(`  Contract transactions response status: ${txResponse.status}`);

      if (txResponse.ok) {
        const txData = await txResponse.json();
        console.log(`  Found ${txData.results?.length || 0} transactions`);

        if (txData.results && Array.isArray(txData.results)) {
          // Log all transactions to debug
          console.log(`  Transactions for debugging:`, txData.results.map((tx: any) => ({
            tx_id: tx.tx_id,
            type: tx.tx_type,
            function: tx.contract_call?.function_name,
            status: tx.tx_status
          })));

          for (const tx of txData.results) {
            // Check if this is a contract call transaction
            if (tx.tx_type === 'contract_call' &&
                tx.contract_call?.function_name === 'mint-ticket' &&
                tx.tx_status === 'success') {

              console.log(`    Checking mint-ticket TX: ${tx.tx_id}`);
              console.log(`    Events:`, tx.events);

              // Check events in this transaction to find the minted token ID
              if (tx.events && Array.isArray(tx.events)) {
                for (const event of tx.events) {
                  if (event.event_type === 'non_fungible_token_asset' &&
                      event.asset?.asset_event_type === 'mint') {
                    const mintedTokenId = parseInt(event.asset?.value?.repr?.replace('u', '') || '0');
                    console.log(`    TX ${tx.tx_id}: minted token ${mintedTokenId}`);

                    if (mintedTokenId === tokenId) {
                      console.log(`  ✅ Found mint TX from contract transactions: ${tx.tx_id}`);
                      return tx.tx_id || null;
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        console.log(`  ⚠️ Contract transactions endpoint returned ${txResponse.status}`);
      }
    } catch (err) {
      console.warn('  ⚠️ Error fetching contract transactions:', err);
    }

    console.warn(`⚠️ Mint transaction not found for token ${tokenId} after trying all methods`);
    return null;

  } catch (error) {
    console.error(`❌ Error fetching mint transaction:`, error);
    return null;
  }
}

/**
 * Main function: Get user's tickets with full metadata
 * OPTIMIZED: Uses normalized data store to reuse event data
 */
export async function getUserTicketsFromIndexer(userAddress: string) {
  try {
    console.log('🎫 [NFTFetcher] Starting ticket fetch for:', userAddress);

    // Import dataStore and transformer (dynamic to avoid circular deps)
    const { dataStore } = await import('./dataStore');
    const { transformToNormalizedTicket } = await import('./dataTransformer');

    // Step 1: Get all NFTs owned by user
    const nfts = await fetchUserNFTHoldings(userAddress);

    if (nfts.length === 0) {
      console.log('📭 No NFTs found for this user');
      return [];
    }

    // Step 2: Group NFTs by contract
    const nftsByContract = new Map<string, UserNFT[]>();

    for (const nft of nfts) {
      const contractId = nft.contractId;
      if (!nftsByContract.has(contractId)) {
        nftsByContract.set(contractId, []);
      }
      nftsByContract.get(contractId)!.push(nft);
    }

    console.log(`📊 NFTs grouped into ${nftsByContract.size} contracts`);

    // Step 3: Build tickets using normalized data store (REUSE event data!)
    const tickets: any[] = [];
    const contractsToFetch: string[] = [];

    // First pass: Check which events are NOT in store
    for (const [contractId] of nftsByContract.entries()) {
      const cachedEvent = dataStore.getEvent(contractId);
      if (!cachedEvent) {
        contractsToFetch.push(contractId);
      } else {
        console.log(`  💾 Event ${contractId} found in store - reusing!`);
      }
    }

    // Fetch missing events with rate limit protection
    if (contractsToFetch.length > 0) {
      console.log(`  🔄 Fetching ${contractsToFetch.length} missing events...`);
      
      const BATCH_SIZE = 2; // Reduce to 2 parallel requests
      const BATCH_DELAY = 1500; // 1.5s delay between batches
      
      for (let i = 0; i < contractsToFetch.length; i += BATCH_SIZE) {
        const batch = contractsToFetch.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(contractsToFetch.length / BATCH_SIZE);
        
        console.log(`    📦 Batch ${batchNum}/${totalBatches}: Processing ${batch.length} events...`);
        
        await Promise.allSettled(
          batch.map(async (contractId) => {
            const parts = contractId.split('.');
            const contractAddress = parts[0] || '';
            const contractName = parts[1] || '';
            
            if (!contractAddress || !contractName) {
              console.warn(`    ⚠️ Invalid contractId: ${contractId}`);
              return;
            }
            
            try {
              const metadata = await getEventMetadataFromContract(contractAddress, contractName);
              
              // Store in dataStore using transformer
              const { transformToNormalizedEvent } = await import('./dataTransformer');
              const normalized = transformToNormalizedEvent(
                { 
                  contractAddress, 
                  contractName, 
                  eventId: 0, 
                  isActive: true, 
                  isFeatured: false, 
                  isVerified: false,
                  organizer: contractAddress,
                  registeredAt: Date.now()
                },
                metadata
              );
              dataStore.setEvent(normalized);
              console.log(`      ✅ Cached event: ${contractId}`);
            } catch (err) {
              console.warn(`      ⚠️ Could not fetch event ${contractId}:`, err);
            }
          })
        );
        
        // Add delay between batches (except for last batch)
        if (i + BATCH_SIZE < contractsToFetch.length) {
          console.log(`      ⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
      
      console.log(`  ✅ Finished fetching missing events`);
    }

    // Second pass: Create tickets using normalized transformer
    for (const [contractId, contractNFTs] of nftsByContract.entries()) {
      try {
        console.log(`  🎫 Processing ${contractNFTs.length} tickets for ${contractId}`);

        for (const nft of contractNFTs) {
          // Use normalized transformer (reuses event from store)
          const normalizedTicket = transformToNormalizedTicket(
            contractId,
            nft.tokenId,
            userAddress
          );

          // Try to fetch mint transaction
          let mintTxId = '';
          try {
            const mintTx = await fetchNFTMintTransaction(contractId, nft.tokenId);
            mintTxId = mintTx || '';
          } catch (err) {
            // Silent fail for mint tx
          }

          // Convert to component format (compatible with existing UI)
          const ticket = {
            id: normalizedTicket.id,
            tokenId: normalizedTicket.tokenId,
            eventName: normalizedTicket.eventName,
            eventDate: normalizedTicket.eventDate,
            eventTime: normalizedTicket.eventTime,
            location: normalizedTicket.location,
            image: normalizedTicket.image,
            ticketNumber: normalizedTicket.ticketNumber,
            contractAddress: normalizedTicket.contractId.split('.')[0],
            contractName: normalizedTicket.contractId.split('.')[1],
            contractId: normalizedTicket.contractId,
            status: normalizedTicket.status,
            quantity: 1,
            category: normalizedTicket.category,
            price: normalizedTicket.price,
            mintTxId: mintTxId,
          };

          tickets.push(ticket);
          console.log(`    ✅ Created ticket: ${ticket.eventName} #${nft.tokenId}`);
        }
      } catch (err) {
        console.error(`  ❌ Error processing contract ${contractId}:`, err);
      }
    }

    // Sort by event date (soonest first)
    tickets.sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateA - dateB;
    });

    console.log(`✅ [NFTFetcher] Total tickets created: ${tickets.length}`);
    console.log(`📊 Data reuse: ${nftsByContract.size - contractsToFetch.length}/${nftsByContract.size} events from cache`);
    
    return tickets;

  } catch (error) {
    console.error('❌ [NFTFetcher] Error in getUserTicketsFromIndexer:', error);
    return [];
  }
}

/**
 * Cache for better performance
 */
const ticketCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 120000; // 2 minutes

export async function getUserTicketsFromIndexerCached(userAddress: string) {
  // Check cache
  const cached = ticketCache.get(userAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('💾 Using cached ticket data');
    return cached.data;
  }

  // Fetch fresh data
  const tickets = await getUserTicketsFromIndexer(userAddress);

  // Cache it
  ticketCache.set(userAddress, {
    data: tickets,
    timestamp: Date.now(),
  });

  return tickets;
}

export function clearNFTCache(userAddress?: string) {
  if (userAddress) {
    ticketCache.delete(userAddress);
  } else {
    ticketCache.clear();
  }
}
