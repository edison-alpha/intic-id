/**
 * User Tickets Service
 * Fetches user's NFT tickets from registered events
 * Optimized for fast loading
 */

import { getAllRegistryEvents } from './registryService';
import { getEventDataFromContract } from './nftIndexer';
import { callReadOnlyFunction, cvToValue, uintCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const network = new StacksTestnet();

// Cache for ticket data
const ticketCache = new Map<string, { data: any[]; timestamp: number }>();
const TICKET_CACHE_TTL = 120000; // 2 minutes cache

export interface UserTicket {
  id: string;
  tokenId: number;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  image: string;
  ticketNumber: string;
  contractAddress: string;
  contractName: string;
  contractId: string;
  status: 'active' | 'used' | 'expired';
  quantity: number;
  category?: string;
  price?: string;
}

/**
 * Get user's owned NFT tickets from all registered events
 * Optimized with caching and parallel processing
 */
export async function getUserNFTTickets(
  userAddress: string
): Promise<UserTicket[]> {
  try {
    console.log('🎫 [UserTickets] Fetching tickets for:', userAddress);

    // Check cache first
    const cached = ticketCache.get(userAddress);
    if (cached && Date.now() - cached.timestamp < TICKET_CACHE_TTL) {
      console.log('💾 Using cached ticket data');
      return cached.data;
    }

    // Get all registered events from blockchain registry
    console.log('🔍 Calling getAllRegistryEvents()...');
    const registryEvents = await getAllRegistryEvents();
    console.log(`📦 Found ${registryEvents.length} registered events from registry`);

    if (registryEvents.length > 0) {
      console.log('📋 Registry events:', registryEvents.map(e => ({
        id: e.eventId,
        contract: `${e.contractAddress}.${e.contractName}`,
        organizer: e.organizer,
        active: e.isActive
      })));
    }

    if (registryEvents.length === 0) {
      console.warn('⚠️ No contracts found in registry');
      console.warn('💡 Make sure events are registered in the event-registry contract');
      return [];
    }

    const userTickets: UserTicket[] = [];

    // Process contracts in parallel (batches of 3)
    const batchSize = 3;
    for (let i = 0; i < registryEvents.length; i += batchSize) {
      const batch = registryEvents.slice(i, Math.min(i + batchSize, registryEvents.length));

      const batchPromises = batch.map(async (event) => {
        try {
          // Parse contract ID
          let contractId = event.contractAddress;
          if (!contractId.includes('.')) {
            contractId = `${event.contractAddress}.${event.contractName}`;
          }

          const [address, name] = contractId.split('.');

          // Check if user owns any tokens from this contract
          console.log(`  🔍 Checking ownership for ${contractId}...`);
          const ownedTokens = await getUserOwnedTokens(address, name, userAddress);

          if (ownedTokens.length === 0) {
            console.log(`  ❌ User does not own any tickets from ${name}`);
            return [];
          }

          console.log(`  ✅ User owns ${ownedTokens.length} ticket(s) from ${name}:`, ownedTokens);

          // Fetch event data for this contract
          const eventData = await getEventDataFromContract(contractId);

          // Convert owned tokens to tickets
          return ownedTokens.map((tokenId) => {
            const ticket: UserTicket = {
              id: `${contractId}-${tokenId}`,
              tokenId,
              eventName: eventData?.eventName || name,
              eventDate: eventData?.eventDate
                ? new Date(eventData.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'TBA',
              eventTime: eventData?.eventDate
                ? new Date(eventData.eventDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'TBA',
              location: eventData?.venue || 'TBA',
              image: eventData?.image || '/background-section1.png',
              ticketNumber: `#TKT-${tokenId.toString().padStart(6, '0')}`,
              contractAddress: address,
              contractName: name,
              contractId,
              status: determineTicketStatus(eventData?.eventDate),
              quantity: 1,
              category: eventData?.category || 'General',
              price: eventData?.priceFormatted || '0',
            };

            return ticket;
          });

        } catch (err) {
          console.warn(`⚠️ Error fetching tickets from ${event.contractName}:`, err);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((tickets: UserTicket[]) => {
        userTickets.push(...tickets);
      });
    }

    // Sort by event date (soonest first)
    userTickets.sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateA - dateB;
    });

    console.log(`✅ [UserTickets] Total tickets found: ${userTickets.length}`);

    // Cache the results
    ticketCache.set(userAddress, { data: userTickets, timestamp: Date.now() });

    return userTickets;

  } catch (error) {
    console.error('❌ [UserTickets] Error fetching user tickets:', error);
    return [];
  }
}

/**
 * Get token IDs owned by user for a specific contract
 */
async function getUserOwnedTokens(
  contractAddress: string,
  contractName: string,
  userAddress: string
): Promise<number[]> {
  try {
    console.log(`    📊 Getting last token ID from ${contractAddress}.${contractName}...`);

    // Get last token ID to know range
    const lastTokenIdResponse = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-last-token-id',
      functionArgs: [],
      senderAddress: contractAddress,
      network,
    });

    const lastTokenId = Number(cvToValue(lastTokenIdResponse).value);
    console.log(`    📊 Last token ID: ${lastTokenId}`);

    if (lastTokenId === 0) {
      console.log(`    ⚠️ No tokens minted yet`);
      return [];
    }

    // Check ownership for each token (parallel)
    console.log(`    🔍 Checking ownership for tokens 1-${lastTokenId} for user ${userAddress}...`);
    const ownershipChecks = [];
    for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
      ownershipChecks.push(
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-owner',
          functionArgs: [uintCV(tokenId)],
          senderAddress: contractAddress,
          network,
        })
          .then((result) => {
            try {
              const ownerResult = cvToValue(result);
              const owner = ownerResult?.value;
              console.log(`      Token #${tokenId} owner: ${owner}`);

              // Check if this is the user's token
              if (owner === userAddress) {
                console.log(`      ✅ Token #${tokenId} belongs to user!`);
                return tokenId;
              }
            } catch (err) {
              console.warn(`      ⚠️ Error parsing token #${tokenId}:`, err);
            }
            return null;
          })
          .catch((err) => {
            console.warn(`      ❌ Error getting owner of token #${tokenId}:`, err);
            return null;
          })
      );
    }

    const results = await Promise.all(ownershipChecks);
    const ownedTokens = results.filter((id): id is number => id !== null);

    console.log(`    ✅ User owns ${ownedTokens.length} token(s):`, ownedTokens);
    return ownedTokens;

  } catch (error) {
    console.error(`    ❌ Error checking token ownership for ${contractAddress}.${contractName}:`, error);
    return [];
  }
}

/**
 * Determine ticket status based on event date
 */
function determineTicketStatus(eventDate: string | null | undefined): 'active' | 'used' | 'expired' {
  if (!eventDate) {
    return 'active'; // Unknown date, assume active
  }

  try {
    const eventDateTime = new Date(eventDate).getTime();
    const now = Date.now();

    if (eventDateTime > now) {
      return 'active'; // Future event
    } else {
      return 'used'; // Past event
    }
  } catch {
    return 'active'; // If date parsing fails, assume active
  }
}

/**
 * Clear ticket cache (useful after purchasing new tickets)
 */
export function clearTicketCache(userAddress?: string): void {
  if (userAddress) {
    ticketCache.delete(userAddress);
  } else {
    ticketCache.clear();
  }
}

