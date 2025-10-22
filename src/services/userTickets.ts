/**
 * User Tickets Service (Updated to use Express Server)
 * Fetches user's NFT tickets from registered events using server optimization
 */

import { getAllRegistryEvents } from './registryService';
import { getEventDataFromContract } from './nftIndexer';
import { callReadOnlyFunction, cvToValue, uintCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const network = new StacksTestnet();
const SERVER_BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8000';

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
 * Uses optimized server endpoint for better performance
 */
export async function getUserNFTTickets(
  userAddress: string
): Promise<UserTicket[]> {
  try {


    // Check cache first
    const cached = ticketCache.get(userAddress);
    if (cached && Date.now() - cached.timestamp < TICKET_CACHE_TTL) {

      return cached.data;
    }

    // Try using the optimized server endpoint first
    try {
      const url = `${SERVER_BASE}/api/optimized/user/${userAddress}/tickets`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const serverData = await response.json();
        
        // Transform server data to match expected UserTicket format
        const userTickets = serverData.tickets.map((ticket: any) => ({
          id: ticket.id || `${ticket.contractId}-${ticket.tokenId}`,
          tokenId: ticket.tokenId,
          eventName: ticket.eventName,
          eventDate: ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'TBA',
          eventTime: ticket.eventDate ? new Date(ticket.eventDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }) : 'TBA',
          location: ticket.location || ticket.venue,
          image: ticket.image || ticket.imageUri || '/background-section1.png',
          ticketNumber: ticket.ticketNumber || `#TKT-${ticket.tokenId.toString().padStart(6, '0')}`,
          contractAddress: ticket.contractAddress,
          contractName: ticket.contractName,
          contractId: ticket.contractId,
          status: ticket.status || determineTicketStatus(ticket.eventDate),
          quantity: ticket.quantity || 1,
          category: ticket.category || 'General',
          price: ticket.priceFormatted || ticket.price || '0',
        }));

        // Cache the results
        ticketCache.set(userAddress, { data: userTickets, timestamp: Date.now() });
        

        return userTickets;
      } else {
        console.warn(`Server endpoint failed (${response.status}), falling back to original method`);
      }
    } catch (serverError) {
      console.warn('Server endpoint failed, falling back to original method:', serverError);
    }

    // Fallback to the original method if server endpoint fails
    // Get all registered events from blockchain registry

    const registryEvents = await getAllRegistryEvents();


    if (registryEvents.length > 0) {

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

          const ownedTokens = await getUserOwnedTokens(address, name, userAddress);

          if (ownedTokens.length === 0) {

            return [];
          }



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
    // Try using the optimized server endpoint first
    const contractId = `${contractAddress}.${contractName}`;
    try {
      const url = `${SERVER_BASE}/api/optimized/contract/${contractId}/user/${userAddress}/tokens`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const ownedTokens = await response.json();

        return ownedTokens;
      } else {

      }
    } catch (serverError) {

    }

    // Fallback to direct calls


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


    if (lastTokenId === 0) {

      return [];
    }

    // Check ownership for each token (parallel)

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


              // Check if this is the user's token
              if (owner === userAddress) {

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

