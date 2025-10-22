/**
 * NFT Fetcher Service (OpenSea/Rainbow Style)
 * Directly queries Hiro blockchain indexer for user's NFTs
 * No dependency on registry contract - fully decentralized
 */

import { callReadOnlyFunction, cvToValue, uintCV } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

const HIRO_API = 'https://api.testnet.hiro.so';

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

    const url = `${HIRO_API}/extended/v1/tokens/nft/holdings?principal=${userAddress}&limit=200`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ Hiro API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('📦 Raw NFT holdings:', data);

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
              owner: userAddress,
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

  } catch (error) {
    console.error('❌ [NFTFetcher] Error fetching NFTs:', error);
    return [];
  }
}

/**
 * Get event metadata from contract
 * Enhanced with better error handling and fallbacks
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
    image: '/background-section1.png',
    description: 'Event ticket NFT',
    category: 'General',
    price: '0',
    priceFormatted: '0',
  };

  try {
    console.log(`  📋 Getting metadata from ${contractAddress}.${contractName}...`);

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
      '/background-section1.png'
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

  } catch (error) {
    console.warn(`  ⚠️ Error getting metadata for ${contractAddress}.${contractName}:`, error);
    console.log('  🔄 Using fallback metadata');
    return fallbackMetadata;
  }
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
 * OpenSea/Rainbow style - direct indexer query
 */
export async function getUserTicketsFromIndexer(userAddress: string) {
  try {
    console.log('🎫 [NFTFetcher] Starting ticket fetch for:', userAddress);

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

    // Step 3: Fetch metadata for each contract and build tickets
    const tickets: any[] = [];

    for (const [contractId, contractNFTs] of nftsByContract.entries()) {
      try {
        const [contractAddress, contractName] = contractId.split('.');

        console.log(`  🎫 Processing contract: ${contractId} (${contractNFTs.length} NFTs)`);

        // Get event metadata (always returns valid metadata, never null)
        const metadata = await getEventMetadataFromContract(contractAddress, contractName);

        // Create tickets for each NFT
        for (const nft of contractNFTs) {
          // Format event date safely
          let formattedEventDate = 'TBA';
          try {
            if (metadata.eventDate) {
              const date = new Date(metadata.eventDate);
              if (!isNaN(date.getTime())) {
                formattedEventDate = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              }
            }
          } catch (err) {
            console.warn('    ⚠️ Error formatting date:', err);
          }

          // Try to fetch mint transaction for this NFT
          let mintTxId = '';
          try {
            const mintTx = await fetchNFTMintTransaction(contractId, nft.tokenId);
            mintTxId = mintTx || '';
          } catch (err) {
            console.warn(`    ⚠️ Could not fetch mint tx for token ${nft.tokenId}`);
          }

          const ticket = {
            id: `${contractId}-${nft.tokenId}`,
            tokenId: nft.tokenId,
            eventName: String(metadata.eventName),
            eventDate: String(formattedEventDate),
            eventTime: String(metadata.eventTime),
            location: String(metadata.venue || 'TBA'),
            image: String(metadata.image || '/background-section1.png'),
            ticketNumber: `#TKT-${nft.tokenId.toString().padStart(6, '0')}`,
            contractAddress: String(contractAddress),
            contractName: String(contractName),
            contractId: String(contractId),
            status: determineTicketStatus(metadata.eventDate),
            quantity: 1,
            category: String(metadata.category || 'General'),
            price: String(metadata.priceFormatted || '0'),
            mintTxId: mintTxId, // Transaction hash for Hiro Explorer
          };

          tickets.push(ticket);
          console.log(`    ✅ Created ticket: ${ticket.eventName} #${nft.tokenId}`);
        }
      } catch (err) {
        console.error(`  ❌ Error processing contract ${contractId}:`, err);
        // Continue with next contract
      }
    }

    // Sort by event date (soonest first)
    tickets.sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateA - dateB;
    });

    console.log(`✅ [NFTFetcher] Total tickets created: ${tickets.length}`);
    return tickets;

  } catch (error) {
    console.error('❌ [NFTFetcher] Error in getUserTicketsFromIndexer:', error);
    return [];
  }
}

/**
 * Determine ticket status based on event date
 */
function determineTicketStatus(eventDate: string | null): 'active' | 'used' {
  if (!eventDate) {
    return 'active';
  }

  try {
    const eventDateTime = new Date(eventDate).getTime();
    const now = Date.now();

    return eventDateTime > now ? 'active' : 'used';
  } catch {
    return 'active';
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
