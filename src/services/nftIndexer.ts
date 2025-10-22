/**
 * NFT Ticket Indexer Service
 * Indexes and manages NFT ticketing contract data from Hiro blockchain
 */

import { getContractInfo } from './hiroIndexer';
import { getNFTTicketDataWithStacks } from './stacksReader';

const HIRO_API_BASE = 'https://api.testnet.hiro.so';
const HIRO_API_KEY = import.meta.env.VITE_HIRO_API_KEY;

const getHiroHeaders = () => ({
  'x-hiro-api-key': HIRO_API_KEY,
  'Content-Type': 'application/json',
});

export interface NFTTicketMetadata {
  contractId: string;
  contractName: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
  description?: string;
  imageUri?: string;
  
  // Supply Information
  totalSupply: number;
  maxSupply?: number;
  mintedCount: number;
  remainingSupply?: number;
  
  // Pricing
  mintPrice?: string; // in microSTX
  mintPriceFormatted?: string; // in STX
  
  // Holder Information
  totalHolders: number;
  uniqueHolders: number;
  
  // Contract Statistics
  totalTransfers: number;
  totalMints: number;
  totalBurns: number;
  
  // Recent Activity
  recentMints: NFTMintEvent[];
  recentTransfers: NFTTransferEvent[];
  
  // Contract Status
  isPaused?: boolean;
  isActive: boolean;
  deployedAt: string;
  lastActivityAt?: string;
  
  // Additional Metadata
  contractUri?: string;
  royaltyPercentage?: number;
  creatorAddress?: string;
}

export interface NFTMintEvent {
  txId: string;
  tokenId: number;
  recipient: string;
  timestamp: string;
  blockHeight: number;
  price?: string;
}

export interface NFTTransferEvent {
  txId: string;
  tokenId: number;
  from: string;
  to: string;
  timestamp: string;
  blockHeight: number;
}

export interface NFTHolder {
  address: string;
  tokenIds: number[];
  tokenCount: number;
  firstAcquired: string;
  lastActivity: string;
}

/**
 * Get comprehensive NFT ticket contract data
 */
export const getNFTTicketData = async (contractId: string): Promise<NFTTicketMetadata | null> => {
  try {
    // Get basic contract info (optional - contract might not be in registry yet)
    const contractInfo = await getContractInfo(contractId);

    const [address, name] = contractId.split('.');

    // Use Stacks.js for reliable contract reads
    const stacksData = await getNFTTicketDataWithStacks(contractId);
    
    if (!stacksData) {
      console.error('❌ Failed to get contract data from Stacks.js');
      return null;
    }

    console.log('📊 [NFT Indexer] Stacks data for', contractId, ':', stacksData);

    // Fetch NFT events (mints and transfers) from Hiro API
    const nftEvents = await fetchNFTEvents(contractId);
    
    // Fetch holders data from Hiro API
    const holders = await fetchNFTHolders(contractId);

    // Calculate statistics
    const totalMints = nftEvents.mints.length;
    const totalTransfers = nftEvents.transfers.length;
    const totalBurns = nftEvents.burns;
    
    // Use data from Stacks.js contract reads
    const mintedCount = stacksData.mintedCount || totalMints - totalBurns;
    
    const metadata: NFTTicketMetadata = {
      contractId,
      contractName: name || 'unknown',
      ...(stacksData.eventName && { eventName: stacksData.eventName }),
      ...(stacksData.eventDate && { eventDate: new Date(stacksData.eventDate).toISOString() }),
      ...(stacksData.venue && { venue: stacksData.venue }),
      ...(stacksData.imageUri && { imageUri: stacksData.imageUri }),
      
      totalSupply: mintedCount,
      ...(stacksData.maxSupply && { maxSupply: stacksData.maxSupply }),
      mintedCount: mintedCount,
      ...(stacksData.remainingSupply !== null && { remainingSupply: stacksData.remainingSupply ?? (stacksData.maxSupply ? stacksData.maxSupply - mintedCount : 0) }),
      
      mintPrice: stacksData.mintPrice || '0',
      mintPriceFormatted: stacksData.mintPrice ? formatMicroSTX(stacksData.mintPrice) : '0',
      
      totalHolders: holders.length,
      uniqueHolders: holders.length,
      
      totalTransfers,
      totalMints,
      totalBurns,
      
      recentMints: nftEvents.mints.slice(0, 10),
      recentTransfers: nftEvents.transfers.slice(0, 10),
      
      isPaused: stacksData.eventCancelled || false,
      isActive: !stacksData.eventCancelled,
      deployedAt: contractInfo?.tx_id ? new Date().toISOString() : new Date().toISOString(),
      lastActivityAt: nftEvents.lastActivity || new Date().toISOString(),
      
      royaltyPercentage: stacksData.royaltyPercentage || 0,
      creatorAddress: address || 'unknown',
    };

    return metadata;

  } catch (error) {
    console.error('❌ Error fetching NFT ticket data:', error);
    return null;
  }
};

/**
 * Fetch all NFT events (mints, transfers, burns) for a contract
 */
const fetchNFTEvents = async (contractId: string): Promise<{
  mints: NFTMintEvent[];
  transfers: NFTTransferEvent[];
  burns: number;
  lastActivity?: string;
}> => {
  try {
    const url = `${HIRO_API_BASE}/extended/v1/tokens/nft/mints?asset_identifier=${contractId}::nft-ticket&limit=100`;

    const response = await fetch(url, {
      headers: getHiroHeaders(),
    });

    if (!response.ok) {
      return { mints: [], transfers: [], burns: 0 };
    }

    const data = await response.json();

    // Parse mint events
    const mints: NFTMintEvent[] = (data.results || []).map((event: any) => ({
      txId: event.tx_id,
      tokenId: parseInt(event.value?.repr?.replace('u', '') || '0'),
      recipient: event.recipient,
      timestamp: event.timestamp,
      blockHeight: event.block_height,
      price: undefined, // Would need to parse from tx
    }));

    // Get transfer events
    const transfersUrl = `${HIRO_API_BASE}/extended/v1/tokens/nft/history?asset_identifier=${contractId}::nft-ticket&limit=100`;
    const transfersResponse = await fetch(transfersUrl, {
      headers: getHiroHeaders(),
    });

    let transfers: NFTTransferEvent[] = [];
    if (transfersResponse.ok) {
      const transfersData = await transfersResponse.json();
      transfers = (transfersData.results || [])
        .filter((event: any) => event.value?.type === 'transfer')
        .map((event: any) => ({
          txId: event.tx_id,
          tokenId: parseInt(event.asset?.value?.repr?.replace('u', '') || '0'),
          from: event.sender || '',
          to: event.recipient || '',
          timestamp: event.timestamp,
          blockHeight: event.block_height,
        }));
    }

    const lastActivity = mints.length > 0 && mints[0] ? mints[0].timestamp : new Date().toISOString();

    return {
      mints,
      transfers,
      burns: 0, // Would need to count burn events separately
      lastActivity,
    };

  } catch (error) {
    console.error('❌ Error fetching NFT events:', error);
    return { mints: [], transfers: [], burns: 0 };
  }
};

/**
 * Fetch all NFT holders for a contract
 */
const fetchNFTHolders = async (contractId: string): Promise<NFTHolder[]> => {
  try {
    const url = `${HIRO_API_BASE}/extended/v1/tokens/nft/holdings?principal=${contractId}&limit=200`;

    const response = await fetch(url, {
      headers: getHiroHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    // Group by holder address
    const holdersMap = new Map<string, NFTHolder>();

    (data.results || []).forEach((holding: any) => {
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

      const holder = holdersMap.get(address)!;
      holder.tokenIds.push(tokenId);
      holder.tokenCount++;
    });

    return Array.from(holdersMap.values());

  } catch (error) {
    console.error('❌ Error fetching NFT holders:', error);
    return [];
  }
};

/**
 * Fetch metadata from IPFS
 */
export const fetchIPFSMetadata = async (ipfsUri: string): Promise<any> => {
  try {
    // Convert IPFS URI to HTTP gateway URL
    let httpUrl = ipfsUri;
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      httpUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
    }

    const response = await fetch(httpUrl);
    if (!response.ok) {
      return null;
    }

    const metadata = await response.json();
    return metadata;

  } catch (error) {
    console.error('❌ Error fetching IPFS metadata:', error);
    return null;
  }
};

/**
 * Call read-only function on smart contract
 */
const callContractFunction = async (
  contractId: string,
  functionName: string,
  args: string[] = []
): Promise<any> => {
  try {
    const [contractAddress, contractName] = contractId.split('.');
    const url = `${HIRO_API_BASE}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;

    // Convert args to proper Hiro API format
    // Hiro expects each argument as a hex-encoded Clarity value
    const clarityArgs = args.map(arg => {
      // If argument starts with 'u', it's a uint - convert to Clarity hex format
      if (arg.startsWith('u')) {
        const num = BigInt(arg.substring(1)); // Remove 'u' prefix
        // Clarity uint format: 0x01 (type byte) + 16 bytes for the number
        const hex = num.toString(16).padStart(32, '0');
        return `0x01${hex}`;
      }
      // For other types, return as-is (will need more handling for other types)
      return arg;
    });

    const requestBody = {
      sender: contractAddress,
      arguments: clarityArgs,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getHiroHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Failed to call ${functionName}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`❌ Error calling ${functionName}:`, error);
    return null;
  }
};

/**
 * Parse Clarity value to JavaScript value
 */
const parseClarityValue = (clarityValue: any): any => {
  if (!clarityValue) return null;

  const type = clarityValue.type;
  const value = clarityValue.value;

  switch (type) {
    case 'uint':
    case 'int':
      return parseInt(value);
    case 'bool':
      return value === 'true';
    case 'string-ascii':
    case 'string-utf8':
      return value;
    case 'principal':
      return value;
    case 'optional':
      return value ? parseClarityValue(value) : null;
    default:
      return value;
  }
};

/**
 * @deprecated - Legacy function, replaced by Stacks.js implementation
 * Fetch contract data via read-only functions (OLD METHOD - using Hiro API)
 * Now using getNFTTicketDataWithStacks() from stacksReader.ts instead
 */

/**
 * Extract event name from contract name
  try {
    const [, contractName] = contractId.split('.');

    // Call read-only functions from smart contract
    const results: any = {};

    // Get event-info first - this contains most data we need
    const eventInfoResult = await callContractFunction(contractId, 'get-event-info');
    
    if (eventInfoResult?.result) {
      const result = eventInfoResult.result;
      
      // Check if it's a successful response with ok variant
      if (result.type === 'ok' && result.value?.type === 'tuple') {
        const tupleData = result.value.data;
        
        // Parse all fields from get-event-info
        results.mintPrice = parseClarityValue(tupleData.price)?.toString() || '0';
        results.maxSupply = parseClarityValue(tupleData['total-supply']) || 0;
        results.totalSupply = parseClarityValue(tupleData.sold) || 0;
        results.remainingSupply = parseClarityValue(tupleData.remaining) || 0;
        results.eventCancelled = parseClarityValue(tupleData.cancelled) || false;
        results.eventDate = parseClarityValue(tupleData['event-date']);
        results.royaltyPercentage = parseClarityValue(tupleData['royalty-percent']) || 0;
      } else {
        // Fallback: Try individual functions
        
        // Get total supply
        const totalSupplyResult = await callContractFunction(contractId, 'get-total-supply');
      if (totalSupplyResult?.result && totalSupplyResult.result.type === 'response') {
        results.maxSupply = parseClarityValue(totalSupplyResult.result.value);
      }
      
      // Get last token ID (already minted count)
      const lastTokenResult = await callContractFunction(contractId, 'get-last-token-id');
      if (lastTokenResult?.result && lastTokenResult.result.type === 'response') {
        results.totalSupply = parseClarityValue(lastTokenResult.result.value);
      }
      
      // Get tickets remaining
      const remainingResult = await callContractFunction(contractId, 'get-tickets-remaining');
      if (remainingResult?.result && remainingResult.result.type === 'response') {
        results.remainingSupply = parseClarityValue(remainingResult.result.value);
      }

      // Get ticket price
      const priceResult = await callContractFunction(contractId, 'get-ticket-price');
      if (priceResult?.result && priceResult.result.type === 'response') {
        results.mintPrice = parseClarityValue(priceResult.result.value)?.toString() || '0';
      }
      
        // Check if event cancelled
        const cancelledResult = await callContractFunction(contractId, 'is-event-cancelled');
        if (cancelledResult?.result && cancelledResult.result.type === 'response') {
          results.eventCancelled = parseClarityValue(cancelledResult.result.value);
        }
      }
    } else {
      // Use all fallback methods
      const totalSupplyResult = await callContractFunction(contractId, 'get-total-supply');
      if (totalSupplyResult?.result) {
        results.maxSupply = parseClarityValue(totalSupplyResult.result.type === 'ok' ? totalSupplyResult.result.value : totalSupplyResult.result);
      }
      
      const lastTokenResult = await callContractFunction(contractId, 'get-last-token-id');
      if (lastTokenResult?.result) {
        results.totalSupply = parseClarityValue(lastTokenResult.result.type === 'ok' ? lastTokenResult.result.value : lastTokenResult.result);
      }
      
      const remainingResult = await callContractFunction(contractId, 'get-tickets-remaining');
      if (remainingResult?.result) {
        results.remainingSupply = parseClarityValue(remainingResult.result.type === 'ok' ? remainingResult.result.value : remainingResult.result);
      }

      const priceResult = await callContractFunction(contractId, 'get-ticket-price');
      if (priceResult?.result) {
        results.mintPrice = parseClarityValue(priceResult.result.type === 'ok' ? priceResult.result.value : priceResult.result)?.toString() || '0';
      }
      
      const cancelledResult = await callContractFunction(contractId, 'is-event-cancelled');
      if (cancelledResult?.result) {
        results.eventCancelled = parseClarityValue(cancelledResult.result.type === 'ok' ? cancelledResult.result.value : cancelledResult.result) || false;
      }
    }
    
    // Extract event name from contract name
    results.eventName = extractEventNameFromContract(contractName || 'unknown');

    // Get token URI for token #1 (to get metadata)
    const tokenUriResult = await callContractFunction(contractId, 'get-token-uri', ['u1']);
    if (tokenUriResult?.result && tokenUriResult.result.type === 'response') {
      const tokenUriOpt = tokenUriResult.result.value;
      if (tokenUriOpt?.type === 'some') {
        const tokenUri = parseClarityValue(tokenUriOpt.value);
        
        if (tokenUri) {
          results.contractUri = tokenUri;
          
          // Try to fetch metadata from IPFS
          try {
            const metadata = await fetchIPFSMetadata(tokenUri);
            if (metadata) {
              results.eventName = metadata.name || results.eventName;
              results.description = metadata.description || results.description;
              results.imageUri = metadata.image || metadata.image_url;
              results.venue = metadata.venue || metadata.attributes?.find((a: any) => a.trait_type === 'Venue')?.value;
            }
          } catch (err) {
            // Silently fail for IPFS metadata
          }
        }
      }
    }

    // Event is considered active if not cancelled
    results.isPaused = results.eventCancelled || false;
    results.isActive = !results.eventCancelled;

    return results;

  } catch (error) {
    console.error('❌ Error fetching contract read-only data:', error);
    // Return fallback data
    const [, contractName] = contractId.split('.');
    return {
      totalSupply: 0,
      maxSupply: 1000,
      mintPrice: '100000',
      eventName: extractEventNameFromContract(contractName || 'unknown'),
      isPaused: false,
    };
  }
};

/**
 * Extract event name from contract name
 */
export const extractEventNameFromContract = (contractName: string): string => {
  // Convert contract name to readable format
  // e.g., "summer-fest-2025-1760602746156" -> "Summer Fest 2025"
  return contractName
    .split('-')
    .filter(part => isNaN(Number(part))) // Remove timestamp
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format microSTX to STX
 */
const formatMicroSTX = (microSTX: string): string => {
  const stx = parseInt(microSTX) / 1000000;
  return parseFloat(stx.toFixed(6)).toString().replace(/\.?0+$/, '');
};

/**
 * Get NFT holders with pagination
 */
export const getNFTHolders = async (
  contractId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  total: number;
  holders: NFTHolder[];
}> => {
  try {
    const allHolders = await fetchNFTHolders(contractId);
    const paginatedHolders = allHolders.slice(offset, offset + limit);

    return {
      total: allHolders.length,
      holders: paginatedHolders,
    };
  } catch (error) {
    console.error('❌ Error getting NFT holders:', error);
    return {
      total: 0,
      holders: [],
    };
  }
};

/**
 * Get recent mints for NFT contract
 */
export const getRecentMints = async (
  contractId: string,
  limit: number = 20
): Promise<NFTMintEvent[]> => {
  try {
    const events = await fetchNFTEvents(contractId);
    return events.mints.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting recent mints:', error);
    return [];
  }
};

/**
 * Get NFT metadata by token ID
 */
export const getNFTMetadata = async (
  _contractId: string,
  tokenId: number
): Promise<any> => {
  try {

    // In production, this would call the token-uri read-only function
    // and fetch the metadata JSON from the URI

    return {
      tokenId,
      name: `Ticket #${tokenId}`,
      description: 'Event ticket NFT',
      image: '', // Would be fetched from token URI
      attributes: [],
    };

  } catch (error) {
    console.error('❌ Error fetching NFT metadata:', error);
    return null;
  }
};

/**
 * Index all NFT ticket contracts for an address
 */
export const indexAllNFTTickets = async (
  contractIds: string[]
): Promise<NFTTicketMetadata[]> => {
  try {
    const nftDataPromises = contractIds.map(contractId => getNFTTicketData(contractId));
    const nftData = await Promise.all(nftDataPromises);

    // Filter out null results
    const validNFTData = nftData.filter((data): data is NFTTicketMetadata => data !== null);

    return validNFTData;

  } catch (error) {
    console.error('❌ Error indexing NFT tickets:', error);
    return [];
  }
};

/**
 * Check if a contract is an NFT ticket contract
 */
export const isNFTTicketContract = (contractName: string): boolean => {
  // Exclude known non-NFT contracts first
  const excludePatterns = [
    /event-registry/i,
    /registry/i,
    /factory/i,
    /marketplace/i,
    /governance/i,
    /payment/i,
    /sbtc/i,
    /trait/i,
    /^sip-\d+/i, // SIP trait contracts
  ];

  // If matches any exclude pattern, it's not an NFT ticket contract
  if (excludePatterns.some(pattern => pattern.test(contractName))) {
    return false;
  }

  // Check if contract name matches NFT ticket naming patterns
  // VERY INCLUSIVE - assume most contracts are NFT tickets unless explicitly excluded
  const nftPatterns = [
    /nft-ticket/i,           // Explicit NFT ticket
    /ticket-nft/i,           // Alternative order
    /ticket/i,               // Contains "ticket"
    /-ticket-\d+/i,          // ticket with timestamp
    /(concert|show|festival|event)-.*-\d{10,}/i, // Event name with timestamp
    /^(summer|winter|spring|fall|autumn)-(fest|festival|concert|show|morning|evening|night)/i, // Seasonal events
    /-20\d{2}-\d{10,}/i,     // Contains year (2024, 2025, etc) followed by timestamp
    /^[a-z]+-[a-z]+-20\d{2}/i, // Pattern: word-word-year
    /-\d{13}$/,              // Ends with 13-digit timestamp (deployed contracts)
    /regular.*-\d{13}$/i,    // "regular" contracts with timestamp
  ];

  const isNFT = nftPatterns.some(pattern => pattern.test(contractName));
  
  if (isNFT) {
  } else {
  }
  
  return isNFT;
};

/**
 * Get aggregate statistics for all NFT tickets
 */
export const getAggregateNFTStats = (nftTickets: NFTTicketMetadata[]) => {
  return {
    totalContracts: nftTickets.length,
    totalMinted: nftTickets.reduce((sum, nft) => sum + nft.mintedCount, 0),
    totalHolders: nftTickets.reduce((sum, nft) => sum + nft.totalHolders, 0),
    totalTransfers: nftTickets.reduce((sum, nft) => sum + nft.totalTransfers, 0),
    activeContracts: nftTickets.filter(nft => nft.isActive).length,
    pausedContracts: nftTickets.filter(nft => nft.isPaused).length,
    averageMintPrice: nftTickets.reduce((sum, nft) => {
      const price = parseInt(nft.mintPrice || '0');
      return sum + price;
    }, 0) / nftTickets.length,
  };
};

/**
 * =====================================================
 * Direct Contract Read-Only Function Helpers
 * =====================================================
 */

/**
 * Get token URI from contract (read-only function: get-token-uri)
 * Returns the metadata URI for a specific token ID
 */
export const getTokenUri = async (contractId: string, tokenId: number = 1): Promise<string | null> => {
  try {
    
    // Try different function names that contracts might use
    const functionNames = ['get-token-uri', 'get-uri', 'token-uri'];
    
    for (const funcName of functionNames) {
      try {
        const result = await callContractFunction(contractId, funcName, [`u${tokenId}`]);
        
        if (result?.result) {
          const uri = parseClarityValue(result.result);
          if (uri) {
            console.log(`✅ Token URI (via ${funcName}): ${uri}`);
            return uri;
          }
        }
      } catch (err) {
        // Try next function name
        continue;
      }
    }
    
    // If no token minted yet, try to get base URI or contract URI
    
    try {
      const contractUriResult = await callContractFunction(contractId, 'get-contract-uri', []);
      if (contractUriResult?.result) {
        const uri = parseClarityValue(contractUriResult.result);
        if (uri) {
          return uri;
        }
      }
    } catch {
      // Ignore
    }
    
    console.warn(`⚠️ get-token-uri returned no result for any function variant`);
    return null;
  } catch (error) {
    console.error(`❌ Error calling get-token-uri:`, error);
    return null;
  }
};

/**
 * Get ticket price from contract (read-only function: get-ticket-price)
 * Returns the mint price in microSTX
 */
export const getTicketPrice = async (contractId: string): Promise<string | null> => {
  try {
    
    const result = await callContractFunction(contractId, 'get-ticket-price');
    
    if (result?.result) {
      const price = parseClarityValue(result.result);
      return price?.toString() || null;
    }
    
    console.warn(`⚠️ get-ticket-price returned no result`);
    return null;
  } catch (error) {
    console.error(`❌ Error calling get-ticket-price:`, error);
    return null;
  }
};

/**
 * Get total supply from contract (read-only function: get-total-supply)
 * Returns the maximum number of tickets
 */
export const getTotalSupply = async (contractId: string): Promise<number | null> => {
  try {
    
    const result = await callContractFunction(contractId, 'get-total-supply');
    
    if (result?.result) {
      const supply = parseClarityValue(result.result);
      return supply;
    }
    
    console.warn(`⚠️ get-total-supply returned no result`);
    return null;
  } catch (error) {
    console.error(`❌ Error calling get-total-supply:`, error);
    return null;
  }
};

/**
 * Get tickets remaining from contract (read-only function: get-tickets-remaining)
 * Returns the number of tickets still available to mint
 */
export const getTicketsRemaining = async (contractId: string): Promise<number | null> => {
  try {
    
    const result = await callContractFunction(contractId, 'get-tickets-remaining');
    
    if (result?.result) {
      const remaining = parseClarityValue(result.result);
      return remaining;
    }
    
    console.warn(`⚠️ get-tickets-remaining returned no result`);
    return null;
  } catch (error) {
    console.error(`❌ Error calling get-tickets-remaining:`, error);
    return null;
  }
};

/**
 * Get last token ID from contract (read-only function: get-last-token-id)
 * Returns the ID of the last minted token
 */
export const getLastTokenId = async (contractId: string): Promise<number | null> => {
  try {
    
    const result = await callContractFunction(contractId, 'get-last-token-id');
    
    if (result?.result) {
      const lastId = parseClarityValue(result.result);
      return lastId;
    }
    
    console.warn(`⚠️ get-last-token-id returned no result`);
    return null;
  } catch (error) {
    console.error(`❌ Error calling get-last-token-id:`, error);
    return null;
  }
};

/**
 * Get event info from contract (read-only function: get-event-info)
 * Returns event details like name, date, venue, description
 */
export const getEventInfo = async (contractId: string): Promise<any | null> => {
  try {
    
    const result = await callContractFunction(contractId, 'get-event-info');
    
    if (result?.result) {
      const eventInfo = result.result;
      
      if (eventInfo.type === 'tuple') {
        const data = eventInfo.data;
        const info = {
          eventName: parseClarityValue(data['event-name']) || parseClarityValue(data['name']),
          eventDate: parseClarityValue(data['event-date']) || parseClarityValue(data['date']),
          venue: parseClarityValue(data.venue),
          description: parseClarityValue(data.description),
        };
        return info;
      }
    }
    
    console.warn(`⚠️ get-event-info returned no result`);
    return null;
  } catch (error) {
    console.error(`❌ Error calling get-event-info:`, error);
    return null;
  }
};

/**
 * Check if event is cancelled (read-only function: is-event-cancelled)
 */
export const isEventCancelled = async (contractId: string): Promise<boolean> => {
  try {
    
    const result = await callContractFunction(contractId, 'is-event-cancelled');
    
    if (result?.result) {
      const cancelled = parseClarityValue(result.result);
      return cancelled === true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error calling is-event-cancelled:`, error);
    return false;
  }
};

/**
 * Get complete event data using direct contract calls
 * This function combines all read-only contract functions to build complete event data
 * NOW USES get-event-details for comprehensive on-chain data
 */
export const getEventDataFromContract = async (contractId: string): Promise<any | null> => {
  try {
    console.log('🔍 [getEventDataFromContract] Fetching data for:', contractId);
    
    const [contractAddress, contractName] = contractId.split('.');
    
    // Use getNFTTicketDataWithStacks which now calls get-event-details
    const stacksData = await getNFTTicketDataWithStacks(contractId);
    
    if (!stacksData) {
      console.warn('⚠️ No data from Stacks.js, trying localStorage fallback...');
      
      // Try to get from localStorage as fallback
      try {
        const deployedContracts = JSON.parse(
          localStorage.getItem(`deployed-contracts-${contractAddress}`) || '[]'
        );
        
        const deployedContract = deployedContracts.find((c: any) => 
          c.contractAddress === contractId || 
          c.contractName === contractName
        );
        
        if (deployedContract) {
          console.log('📦 Using localStorage fallback data');
          
          let metadata: any = deployedContract.metadata;
          if (!metadata && deployedContract.metadataUri) {
            metadata = await fetchIPFSMetadata(deployedContract.metadataUri);
          }
          
          const imageUri = metadata?.image || metadata?.image_url;
          
          return {
            contractId,
            image: imageUri,
            eventName: metadata?.name || deployedContract.eventName || 'Event',
            description: metadata?.description || deployedContract.description,
            eventDate: deployedContract.eventDate || metadata?.properties?.event_date,
            venue: metadata?.properties?.venue,
            venueAddress: deployedContract.venueAddress,
            ticketType: metadata?.properties?.ticket_type,
            category: metadata?.properties?.category,
            price: deployedContract.ticketPrice || 100000,
            priceFormatted: formatMicroSTX(deployedContract.ticketPrice || 100000),
            totalSupply: deployedContract.totalSupply || 0,
            available: deployedContract.totalSupply || 0,
            minted: 0,
            isCancelled: false,
            isActive: true,
            tokenUri: deployedContract.metadataUri,
            metadata,
          };
        }
      } catch (storageError) {
        console.warn(`⚠️ Could not read from localStorage:`, storageError);
      }
      
      return null;
    }

    console.log('✅ [getEventDataFromContract] Got Stacks data:', stacksData);

    // Fetch metadata from IPFS if available
    let metadata: any = null;
    let imageUri: string | null = stacksData.imageUri || null;
    
    if (stacksData.metadataUri) {
      try {
        metadata = await fetchIPFSMetadata(stacksData.metadataUri);
        if (metadata) {
          imageUri = metadata.image || metadata.image_url || imageUri;
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch metadata from IPFS:', err);
      }
    }
    
    // FALLBACK: If no metadata from chain, try localStorage
    if (!metadata && !imageUri) {
      try {
        const deployedContracts = JSON.parse(
          localStorage.getItem(`deployed-contracts-${contractAddress}`) || '[]'
        );
        
        const deployedContract = deployedContracts.find((c: any) => 
          c.contractAddress === contractId || 
          c.contractName === contractName
        );
        
        if (deployedContract && deployedContract.metadataUri) {
          metadata = await fetchIPFSMetadata(deployedContract.metadataUri);
          if (metadata) {
            imageUri = metadata.image || metadata.image_url;
          }
        }
      } catch (storageError) {
        console.warn(`⚠️ Could not read metadata from localStorage:`, storageError);
      }
    }

    // Format price
    const priceFormatted = stacksData.mintPrice ? formatMicroSTX(stacksData.mintPrice) : '0';

    const eventData = {
      contractId,
      
      // From get-event-details (on-chain)
      image: imageUri,
      eventName: stacksData.eventName || metadata?.name || contractName,
      description: metadata?.description || 'NFT Event Ticket',
      eventDate: stacksData.eventDate || null,
      venue: stacksData.venue || metadata?.properties?.venue,
      venueAddress: stacksData.venueAddress || null,
      venueCoordinates: stacksData.venueCoordinates || null,
      
      // Metadata fallback
      ticketType: metadata?.properties?.ticket_type,
      category: metadata?.properties?.category || 'event',
      
      // From contract read-only functions
      price: stacksData.mintPrice || '0',
      priceFormatted,
      totalSupply: stacksData.maxSupply || 0,
      available: stacksData.remainingSupply ?? 0,
      minted: stacksData.mintedCount ?? 0,
      
      // Status
      isCancelled: stacksData.eventCancelled || false,
      isActive: !stacksData.eventCancelled,
      
      // Additional info
      paymentCurrency: stacksData.paymentCurrency || 'STX',
      pricingMode: stacksData.pricingMode || 'fixed',
      
      // Metadata
      tokenUri: stacksData.metadataUri,
      metadata,
    };
    
    console.log('📊 [getEventDataFromContract] Final event data:', eventData);
    return eventData;

  } catch (error) {
    console.error(`❌ Error fetching event data from contract:`, error);
    return null;
  }
};

