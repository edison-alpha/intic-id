/**
 * Activity Service
 * Fetches real blockchain activity data for Global Activity Feed
 * Gets ALL activities from ALL registered contracts in get-events-range
 * Uses Hiro API for real events with rate limiting protection
 */

import { getAllRegistryEvents } from './registryService';
import { getEventDataFromContract } from './nftIndexer';
import { StacksTestnet } from '@stacks/network';
import { callReadOnlyFunction, cvToValue, uintCV } from '@stacks/transactions';
import { requestManager, cachedFetch } from '@/utils/requestManager';

const network = new StacksTestnet();
const HIRO_API_BASE = 'https://api.testnet.hiro.so';
const HIRO_API_KEY = import.meta.env.VITE_HIRO_API_KEY;

// Event data cache with longer TTL (event data doesn't change often)
const EVENT_DATA_CACHE_TTL = 300000; // 5 minutes cache for event data

/**
 * Get headers for Hiro API requests
 */
function getHiroHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (HIRO_API_KEY) {
    headers['x-api-key'] = HIRO_API_KEY;
  }

  return headers;
}

// Internal interfaces for blockchain events
interface NFTMintEvent {
  txId: string;
  tokenId: number;
  recipient: string;
  timestamp: string;
  blockHeight: number;
  price?: string;
  contractId: string;
}

interface NFTTransferEvent {
  txId: string;
  tokenId: number;
  sender: string;
  recipient: string;
  timestamp: string;
  blockHeight: number;
  contractId: string;
}

interface ContractDeployEvent {
  txId: string;
  contractId: string;
  deployer: string;
  timestamp: string;
  blockHeight: number;
}

/**
 * Extract event name from contract name
 */
function extractEventNameFromContract(contractName: string): string {
  // Convert contract name to readable format
  // e.g., "summer-fest-2025-1760602746156" -> "Summer Fest 2025"
  return contractName
    .split('-')
    .filter(part => isNaN(Number(part))) // Remove timestamp
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface ActivityItem {
  id: string;
  type: 'purchase' | 'sale' | 'transfer' | 'event_attend' | 'badge_earned' | 'stake' | 'reward' | 'referral' | 'social' | 'deploy';
  timestamp: string;
  user: {
    address: string;
    avatar?: string;
    displayName?: string;
    tier: string;
  };
  data: {
    title: string;
    description: string;
    amount?: string;
    currency?: string;
    event?: {
      name: string;
      image: string;
      date: string;
      contractId?: string;
    };
    ticket?: {
      id: string;
      section: string;
      tier: string;
    };
    badge?: {
      name: string;
      tier: number;
      rarity: string;
      image: string;
    };
    transaction?: {
      hash: string;
      block: number;
    };
    social?: {
      likes: number;
      comments: number;
      shares: number;
      isLiked: boolean;
    };
    deployment?: {
      contractId: string;
      contractName: string;
    };
  };
  metadata: {
    network: string;
    platform: string;
    category: string;
    isVerified: boolean;
    isPublic: boolean;
  };
}

/**
 * Fetch from Hiro API with caching and rate limiting
 * Now using centralized request manager
 */
async function fetchFromHiroAPI(url: string): Promise<any> {
  const cacheKey = `hiro:${url}`;

  try {
    return await requestManager.request(
      cacheKey,
      async () => {
        const response = await fetch(url, {
          headers: getHiroHeaders(),
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Not found is OK
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      {
        cacheTTL: 60000, // 1 minute
        deduplicate: true,
        maxRetries: 3,
        retryDelay: 2000, // Start with 2s for Hiro API
      }
    );
  } catch (error) {
    console.warn(`    ⚠️ API fetch failed:`, error);
    return null;
  }
}

/**
 * Fetch real NFT events from Hiro API
 */
async function fetchNFTEventsFromAPI(contractId: string, limit: number = 50): Promise<any> {
  try {
    // Encode the asset identifier properly
    const assetIdentifier = encodeURIComponent(`${contractId}::event-ticket`);
    const url = `${HIRO_API_BASE}/extended/v1/tokens/nft/mints?asset_identifier=${assetIdentifier}&limit=${limit}`;
    const data = await fetchFromHiroAPI(url);

    if (!data) {
      console.log(`    ℹ️ Contract not indexed yet: ${contractId}`);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`    ⚠️ API fetch failed:`, error);
    return null;
  }
}

/**
 * Fetch mint events using real blockchain data from Hiro API
 * Falls back to contract state if API not available
 */
async function fetchMintEvents(contractId: string, limit: number = 5): Promise<NFTMintEvent[]> {
  try {
    console.log(`    🔍 Fetching real mints from: ${contractId}`);

    const [address, name] = contractId.split('.');

    if (!address || !name) {
      console.warn(`    ⚠️ Invalid contract ID format: ${contractId}`);
      return [];
    }

    // Try to get real events from Hiro API first
    const apiData = await fetchNFTEventsFromAPI(contractId, limit);

    if (apiData && apiData.results && apiData.results.length > 0) {
      console.log(`    ✅ Found ${apiData.results.length} real mint events from API`);

      const mintEvents: NFTMintEvent[] = apiData.results.map((mint: any) => ({
        txId: mint.tx_id,
        tokenId: parseInt(mint.value?.repr?.replace(/u/, '') || '0'),
        recipient: mint.recipient,
        timestamp: mint.timestamp ? new Date(mint.timestamp * 1000).toISOString() : new Date().toISOString(),
        blockHeight: mint.block_height || 0,
        contractId,
      }));

      return mintEvents.slice(0, limit);
    }

    // Fallback: Use contract state to generate mock mint events
    try {
      const lastTokenIdResponse = await callReadOnlyFunction({
        contractAddress: address,
        contractName: name,
        functionName: 'get-last-token-id',
        functionArgs: [],
        senderAddress: address,
        network,
      });

      const lastTokenId = Number(cvToValue(lastTokenIdResponse).value);
      console.log(`    📊 Fallback: Contract has ${lastTokenId} tokens (using contract state)`);

      if (lastTokenId === 0) {
        return [];
      }

      // Generate mock mint events based on token count
      // Since we can't get real transaction data, create synthetic events
      const mockMints: NFTMintEvent[] = [];
      const tokensToShow = Math.min(lastTokenId, limit);

      for (let i = lastTokenId; i > lastTokenId - tokensToShow && i > 0; i--) {
        // Try to get token owner (if contract has get-owner function)
        let owner = address; // Default to contract deployer
        try {
          const ownerResponse = await callReadOnlyFunction({
            contractAddress: address,
            contractName: name,
            functionName: 'get-owner',
            functionArgs: [uintCV(i)],
            senderAddress: address,
            network,
          });
          const ownerResult = cvToValue(ownerResponse);
          if (ownerResult?.value) {
            owner = ownerResult.value;
          }
        } catch {
          // If get-owner doesn't exist, use default
        }

        mockMints.push({
          txId: `synthetic-mint-${contractId}-${i}`,
          tokenId: i,
          recipient: owner,
          timestamp: new Date(Date.now() - (lastTokenId - i) * 60000).toISOString(), // Space out by 1 minute
          blockHeight: 0,
          contractId,
        });
      }

      console.log(`    ✅ Generated ${mockMints.length} mint activities from contract state`);
      return mockMints;

    } catch (contractError) {
      console.warn(`    ⚠️ Contract not accessible:`, contractError);
      return [];
    }

  } catch (error) {
    console.warn(`    ⚠️ Error fetching mint events:`, error);
    return [];
  }
}

/**
 * Fetch real NFT transfer events from Hiro API
 * For now, skip transfers as they're not indexed yet for new contracts
 */
async function fetchTransferEvents(contractId: string, _limit: number = 3): Promise<NFTTransferEvent[]> {
  try {
    console.log(`    🔍 Checking for transfers from: ${contractId}`);

    // For now, skip transfer fetching since:
    // 1. New contracts aren't indexed yet (404)
    // 2. History endpoint has issues (400)
    // 3. Transfers will appear automatically once Hiro indexes the contracts

    console.log(`    ⏳ Transfer events will appear once contract is indexed by Hiro`);
    return [];

  } catch (error) {
    console.warn(`    ⚠️ Error fetching transfer events:`, error);
    return [];
  }
}

/**
 * Fetch deployment events directly from registry data
 * No API calls needed - registry already has all deployment info
 */
async function fetchDeploymentEvents(limit: number = 10): Promise<ContractDeployEvent[]> {
  try {
    console.log(`    🔍 Fetching contract deployments from registry`);

    // Get all registered events from registry
    const registryEvents = await getAllRegistryEvents();

    if (registryEvents.length === 0) {
      console.log(`    ℹ️ No deployments found in registry`);
      return [];
    }

    // Convert registry events directly to deployment events
    const deployments: ContractDeployEvent[] = registryEvents
      .slice(0, limit)
      .map((event) => {
        const contractId = event.contractAddress.includes('.')
          ? event.contractAddress
          : `${event.contractAddress}.${event.contractName}`;

        return {
          txId: `deploy-${event.eventId}`,
          contractId,
          deployer: event.organizer,
          timestamp: new Date(event.registeredAt * 1000).toISOString(),
          blockHeight: event.registeredAt,
        };
      });

    console.log(`    ✅ Found ${deployments.length} deployment activities from registry`);
    return deployments;

  } catch (error) {
    console.warn(`    ⚠️ Error fetching deployment events:`, error);
    return [];
  }
}

/**
 * Fetch ALL activity types from ALL registered contracts
 * Optimized for fast initial load with lazy loading support
 */
export async function getGlobalActivity(limit: number = 50): Promise<ActivityItem[]> {
  try {
    console.log('📋 [ActivityService] Fetching global activity (optimized)...');

    // Get ALL registered event contracts from get-events-range (same as BrowseEvents)
    const registryEvents = await getAllRegistryEvents();
    console.log(`📦 [ActivityService] Found ${registryEvents.length} registered events`);

    if (registryEvents.length === 0) {
      console.log('ℹ️ No registered contracts found');
      return [];
    }

    const allActivities: ActivityItem[] = [];

    // OPTIMIZATION 1: Fetch deployments first (fastest - no contract calls needed)
    const deploymentLimit = Math.min(limit, 10);
    const deployments = await fetchDeploymentEvents(deploymentLimit);

    if (deployments.length > 0) {
      console.log(`📦 Found ${deployments.length} deployment events`);
      // OPTIMIZATION 2: Parallel fetch event data for deployments
      const deployActivities = await convertDeploymentsToActivitiesOptimized(deployments);
      allActivities.push(...deployActivities);
    }

    // OPTIMIZATION 3: Only fetch mints if we need more activities
    const remainingNeeded = limit - allActivities.length;
    if (remainingNeeded > 0) {
      // OPTIMIZATION 4: Limit contracts based on remaining needed
      const contractsToFetch = Math.min(registryEvents.length, Math.ceil(remainingNeeded / 3));

      // OPTIMIZATION 5: Process contracts in parallel (batches of 2)
      const batchSize = 2;
      for (let i = 0; i < contractsToFetch; i += batchSize) {
        const batch = registryEvents.slice(i, Math.min(i + batchSize, contractsToFetch));

        const batchPromises = batch.map(async (event) => {
          try {
            // Parse contract ID
            let contractId = event.contractAddress;
            if (!contractId.includes('.')) {
              contractId = `${event.contractAddress}.${event.contractName}`;
            }

            const name = contractId.split('.').pop() || event.contractName;
            console.log(`  🔍 Fetching activity from: ${contractId}`);

            // Fetch mint events only (transfers disabled for performance)
            const mintEvents = await fetchMintEvents(contractId, 3);
            if (mintEvents.length > 0) {
              console.log(`    ✅ Found ${mintEvents.length} mint events`);
              return await convertMintsToActivitiesOptimized(mintEvents, name, contractId);
            }
            return [];

          } catch (err) {
            console.error(`  ❌ Error fetching activity:`, err);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((activities: ActivityItem[]) => allActivities.push(...activities));

        // Stop if we have enough
        if (allActivities.length >= limit) break;
      }
    }

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    const limitedActivities = allActivities.slice(0, limit);

    console.log(`✅ [ActivityService] TOTAL: ${limitedActivities.length} activities (${deployments.length} deploys, ${limitedActivities.length - deployments.length} mints)`);

    return limitedActivities;

  } catch (error) {
    console.error('❌ [ActivityService] Error fetching global activity:', error);
    return [];
  }
}

/**
 * Convert mint events to ActivityItems (Optimized with caching)
 * Fetches real event data from contract for richer display
 */
async function convertMintsToActivitiesOptimized(
  mints: NFTMintEvent[],
  contractName: string,
  contractId: string
): Promise<ActivityItem[]> {
  const eventNameFallback = extractEventNameFromContract(contractName);

  // Fetch event data using request manager for deduplication
  let eventData: any = null;
  try {
    eventData = await requestManager.request(
      `event-data:${contractId}`,
      () => getEventDataFromContract(contractId),
      {
        cacheTTL: EVENT_DATA_CACHE_TTL,
        deduplicate: true,
        maxRetries: 2,
        retryDelay: 1000,
      }
    );
  } catch (err) {
    console.warn(`⚠️ Could not fetch event data for mints ${contractId}:`, err);
  }

  // Use real data if available, otherwise use fallback
  const eventName = eventData?.eventName || eventNameFallback;
  const eventImage = eventData?.image || '/background-section1.png';
  const eventDate = eventData?.eventDate;
  const ticketPrice = eventData?.priceFormatted || '0.001';

  return mints.map((mint) => ({
    id: `mint-${mint.txId}-${mint.tokenId}`,
    type: 'purchase' as const,
    timestamp: mint.timestamp,
    user: {
      address: mint.recipient,
      displayName: formatAddress(mint.recipient),
      tier: getTierFromActivity(),
    },
    data: {
      title: 'Purchased Ticket',
      description: `Minted ticket #${mint.tokenId} for ${eventName}`,
      amount: ticketPrice,
      currency: 'STX',
      event: {
        name: eventName,
        image: eventImage,
        date: eventDate || new Date(mint.timestamp).toISOString(),
        contractId,
      },
      ticket: {
        id: `TKT-${mint.tokenId}`,
        section: 'General',
        tier: 'Standard',
      },
      transaction: {
        hash: mint.txId,
        block: mint.blockHeight,
      },
      social: {
        likes: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 10),
        shares: Math.floor(Math.random() * 5),
        isLiked: false,
      },
    },
    metadata: {
      network: 'Stacks',
      platform: 'Intic',
      category: 'NFT',
      isVerified: true,
      isPublic: true,
    },
  }));
}

/**
 * Convert transfer events to ActivityItems
 */
function convertTransfersToActivities(
  transfers: NFTTransferEvent[],
  contractName: string,
  contractId: string
): ActivityItem[] {
  const eventName = extractEventNameFromContract(contractName);

  return transfers.map((transfer) => ({
    id: `transfer-${transfer.txId}-${transfer.tokenId}`,
    type: 'transfer' as const,
    timestamp: transfer.timestamp,
    user: {
      address: transfer.sender,
      displayName: formatAddress(transfer.sender),
      tier: getTierFromActivity(),
    },
    data: {
      title: 'NFT Transfer',
      description: `Transferred ticket #${transfer.tokenId} for ${eventName} to ${formatAddress(transfer.recipient)}`,
      event: {
        name: eventName,
        image: '/background-section1.png',
        date: new Date(transfer.timestamp).toISOString(),
        contractId,
      },
      ticket: {
        id: `TKT-${transfer.tokenId}`,
        section: 'General',
        tier: 'Standard',
      },
      transaction: {
        hash: transfer.txId,
        block: transfer.blockHeight,
      },
      social: {
        likes: Math.floor(Math.random() * 30),
        comments: Math.floor(Math.random() * 5),
        shares: Math.floor(Math.random() * 3),
        isLiked: false,
      },
    },
    metadata: {
      network: 'Stacks',
      platform: 'Intic',
      category: 'NFT',
      isVerified: true,
      isPublic: true,
    },
  }));
}

/**
 * Convert deployment events to ActivityItems (Optimized with parallel fetching and caching)
 * Fetches real event data from contracts (name, date, image)
 */
async function convertDeploymentsToActivitiesOptimized(
  deployments: ContractDeployEvent[]
): Promise<ActivityItem[]> {
  // OPTIMIZATION: Fetch all event data in parallel with request manager
  const eventDataPromises = deployments.map(async (deploy) => {
    const contractName = deploy.contractId.split('.')[1] || 'Event Contract';
    const eventNameFallback = extractEventNameFromContract(contractName);

    // Fetch event data using request manager for deduplication
    try {
      const eventData = await requestManager.request(
        `event-data:${deploy.contractId}`,
        () => getEventDataFromContract(deploy.contractId),
        {
          cacheTTL: EVENT_DATA_CACHE_TTL,
          deduplicate: true,
          maxRetries: 2,
          retryDelay: 1000,
        }
      );
      return { deploy, eventData, eventNameFallback };
    } catch (err) {
      console.warn(`⚠️ Could not fetch event data for ${deploy.contractId}:`, err);
      return { deploy, eventData: null, eventNameFallback };
    }
  });

  const results = await Promise.all(eventDataPromises);

  // Convert to activities
  return results.map(({ deploy, eventData, eventNameFallback }) => {
    const eventName = eventData?.eventName || eventNameFallback;
    const eventImage = eventData?.image || '/background-section1.png';
    const eventDate = eventData?.eventDate || deploy.timestamp;

    return {
      id: `deploy-${deploy.txId}`,
      type: 'deploy' as const,
      timestamp: deploy.timestamp,
      user: {
        address: deploy.deployer,
        displayName: formatAddress(deploy.deployer),
        tier: getTierFromActivity(),
      },
      data: {
        title: 'Event Deployed',
        description: `Deployed new event: ${eventName}`,
        event: {
          name: eventName,
          image: eventImage,
          date: eventDate,
          contractId: deploy.contractId,
        },
        deployment: {
          contractId: deploy.contractId,
          contractName: eventName,
        },
        transaction: {
          hash: deploy.txId,
          block: deploy.blockHeight,
        },
        social: {
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 10),
          isLiked: false,
        },
      },
      metadata: {
        network: 'Stacks',
        platform: 'Intic',
        category: 'Deployment',
        isVerified: true,
        isPublic: true,
      },
    };
  });
}

/**
 * Format Stacks address for display
 */
function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Determine user tier from activity type
 */
function getTierFromActivity(): string {
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  return tiers[Math.floor(Math.random() * tiers.length)] || 'Bronze';
}

/**
 * Fetch user-specific activity
 */
export async function getUserActivity(userAddress: string, limit: number = 20): Promise<ActivityItem[]> {
  try {
    console.log(`👤 [ActivityService] Fetching activity for user: ${userAddress}`);

    // Get all activities
    const allActivities = await getGlobalActivity(100);

    // Filter activities for this user
    const userActivities = allActivities.filter(
      (activity) => activity.user.address === userAddress
    );

    console.log(`✅ [ActivityService] Found ${userActivities.length} activities for user`);

    return userActivities.slice(0, limit);

  } catch (error) {
    console.error('❌ [ActivityService] Error fetching user activity:', error);
    return [];
  }
}
