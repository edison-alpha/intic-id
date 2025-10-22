/**
 * Data Transformer
 * Transform raw blockchain data ke normalized structure
 * Menghindari duplikasi dan memastikan konsistensi data
 */

import { dataStore, NormalizedEvent, NormalizedTicket, NormalizedProfile } from './dataStore';
import type { RegistryEvent } from './registryService';

// ============================================================================
// EVENT TRANSFORMERS
// ============================================================================

/**
 * Transform registry event + contract data ke NormalizedEvent
 */
export function transformToNormalizedEvent(
  registryEvent: RegistryEvent,
  contractData: any
): NormalizedEvent {
  const contractId = `${registryEvent.contractAddress}.${registryEvent.contractName}`;
  
  // Parse event date
  const eventDate = contractData?.eventDate || contractData?.['event-date'] || 0;
  let formattedTime = 'TBA';
  
  if (eventDate && eventDate > 0) {
    try {
      const date = new Date(Number(eventDate));
      formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.warn('Error parsing date:', e);
    }
  }
  
  // Parse price with safe guards
  const priceInMicroSTX = Number(contractData?.price || 0);
  const priceInSTX = priceInMicroSTX / 1000000;
  // Use priceFormatted from contractData if available, otherwise calculate with null check
  const priceFormatted = contractData?.priceFormatted || 
    (isNaN(priceInSTX) || priceInSTX === null || priceInSTX === undefined 
      ? '0' 
      : priceInSTX.toFixed(6).replace(/\.?0+$/, ''));
  
  // Parse supply
  const totalSupply = Number(contractData?.totalSupply || contractData?.['total-supply'] || 0);
  const minted = Number(contractData?.minted || contractData?.['tickets-sold'] || 0);
  const remaining = Number(contractData?.available || contractData?.remaining || contractData?.['tickets-remaining'] || 0);
  
  // Venue info
  const venue = contractData?.venue || 
                contractData?.venueAddress || 
                contractData?.['venue-address'] || 
                'Venue TBA';
  
  // Image
  const image = contractData?.image || 
                contractData?.imageUri || 
                contractData?.['image-uri'] || 
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';
  
  // Event name
  const eventName = contractData?.name || 
                    contractData?.eventName ||
                    registryEvent.contractName
                      .split('-')
                      .slice(0, -1)
                      .join(' ')
                      .replace(/\b\w/g, l => l.toUpperCase());
  
  // Status
  const isCancelled = contractData?.cancelled || contractData?.isCancelled || false;
  const now = Date.now();
  const isEventInFuture = eventDate === 0 || Number(eventDate) > now;
  const hasTickets = remaining > 0;
  const isActive = registryEvent.isActive && !isCancelled && hasTickets && isEventInFuture;
  
  const normalized: NormalizedEvent = {
    id: contractId,
    contractAddress: registryEvent.contractAddress,
    contractName: registryEvent.contractName,
    
    // Event Details
    eventName,
    eventDate: eventDate > 0 ? Number(eventDate) : null,
    eventTime: formattedTime,
    venue,
    venueAddress: venue,
    location: venue,
    description: contractData?.description || 'NFT Event Ticket',
    category: contractData?.category || 'event',
    
    // Images
    image,
    imageUri: image,
    
    // Pricing
    price: priceInMicroSTX.toString(),
    priceFormatted,
    
    // Supply
    totalSupply,
    minted,
    available: remaining,
    remaining,
    
    // Status
    isActive,
    isCancelled,
    isFeatured: registryEvent.isFeatured,
    isVerified: registryEvent.isVerified,
    
    // Metadata
    metadataUri: contractData?.metadataUri,
    tokenUri: contractData?.tokenUri,
    
    // Registry Info
    eventId: registryEvent.eventId,
    organizer: registryEvent.organizer,
    registeredAt: registryEvent.registeredAt,
  };
  
  return normalized;
}

/**
 * Batch transform events
 */
export function transformAndStoreEvents(
  registryEvents: RegistryEvent[],
  contractDataMap: Map<string, any>
): NormalizedEvent[] {
  const normalized: NormalizedEvent[] = [];
  
  for (const regEvent of registryEvents) {
    const contractId = `${regEvent.contractAddress}.${regEvent.contractName}`;
    const contractData = contractDataMap.get(contractId);
    
    if (!contractData) {
      console.warn(`⚠️ No contract data for ${contractId}, skipping`);
      continue;
    }
    
    try {
      const event = transformToNormalizedEvent(regEvent, contractData);
      normalized.push(event);
      
      // Store in dataStore untuk reuse
      dataStore.setEvent(event);
    } catch (error) {
      console.error(`❌ Error transforming event ${contractId}:`, error);
    }
  }
  
  return normalized;
}

// ============================================================================
// TICKET TRANSFORMERS
// ============================================================================

/**
 * Transform NFT data ke NormalizedTicket
 */
export function transformToNormalizedTicket(
  contractId: string,
  tokenId: number,
  owner: string,
  metadata?: any
): NormalizedTicket {
  // Try to get event from store (reuse existing data)
  const event = dataStore.getEvent(contractId);
  
  // If not in store, create minimal event data
  if (!event) {
    console.warn(`⚠️ Event ${contractId} not in store, using minimal data`);
    const [addr, name] = contractId.split('.');
    const minimalEvent: NormalizedEvent = {
      id: contractId,
      contractAddress: addr || '',
      contractName: name || '',
      eventName: (name || '').replace(/-/g, ' '),
      eventDate: null,
      eventTime: 'TBA',
      venue: 'Venue TBA',
      venueAddress: 'TBA',
      location: 'TBA',
      description: '',
      category: 'event',
      image: '',
      imageUri: '',
      price: '0',
      priceFormatted: '0',
      totalSupply: 0,
      minted: 0,
      available: 0,
      remaining: 0,
      isActive: true,
      isCancelled: false,
      isFeatured: false,
      isVerified: false,
    };
    
    // Use minimal event for transformation
    return transformTicketWithEvent(contractId, tokenId, owner, minimalEvent, metadata);
  }
  
  return transformTicketWithEvent(contractId, tokenId, owner, event, metadata);
}

/**
 * Helper to transform ticket with known event
 */
function transformTicketWithEvent(
  contractId: string,
  tokenId: number,
  owner: string,
  event: NormalizedEvent,
  metadata?: any
): NormalizedTicket {
  const ticketId = `${contractId}-${tokenId}`;
  
  // Format date
  let formattedDate = 'TBA';
  let formattedTime = 'TBA';
  
  if (event.eventDate) {
    try {
      const date = new Date(event.eventDate);
      formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      // Keep TBA
    }
  }
  
  // Determine status
  let status: 'active' | 'used' | 'expired' = 'active';
  
  if (metadata?.isUsed || metadata?.['is-used']) {
    status = 'used';
  } else if (event.eventDate && event.eventDate < Date.now()) {
    status = 'expired';
  }
  
  const normalized: NormalizedTicket = {
    id: ticketId,
    contractId,
    tokenId,
    
    // Owner
    owner,
    
    // Event Reference (REUSE dari event store)
    eventId: event.id,
    eventName: event.eventName,
    eventDate: formattedDate,
    eventTime: formattedTime,
    location: event.location,
    
    // Ticket Details
    ticketNumber: `#TKT-${tokenId.toString().padStart(6, '0')}`,
    category: event.category,
    price: event.priceFormatted,
    status,
    
    // Images (REUSE dari event)
    image: event.image,
    
    // Mint Info
    mintTxId: metadata?.mintTxId,
    mintedAt: metadata?.mintedAt,
  };
  
  return normalized;
}

/**
 * Batch transform tickets
 */
export function transformAndStoreTickets(
  nftHoldings: Array<{
    contractId: string;
    tokenId: number;
    owner: string;
  }>,
  metadataMap?: Map<string, any>
): NormalizedTicket[] {
  const normalized: NormalizedTicket[] = [];
  
  for (const nft of nftHoldings) {
    const ticketId = `${nft.contractId}-${nft.tokenId}`;
    const metadata = metadataMap?.get(ticketId);
    
    try {
      const ticket = transformToNormalizedTicket(
        nft.contractId,
        nft.tokenId,
        nft.owner,
        metadata
      );
      
      normalized.push(ticket);
      
      // Store in dataStore untuk reuse
      dataStore.setTicket(ticket);
    } catch (error) {
      console.error(`❌ Error transforming ticket ${ticketId}:`, error);
    }
  }
  
  return normalized;
}

// ============================================================================
// PROFILE TRANSFORMERS
// ============================================================================

/**
 * Transform profile data
 */
export function transformToNormalizedProfile(
  address: string,
  profileData: any
): NormalizedProfile {
  const normalized: NormalizedProfile = {
    address,
    username: profileData?.username || `User ${address.slice(0, 6)}`,
    email: profileData?.email,
    bio: profileData?.bio,
    avatar: profileData?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=FE5C02`,
    cachedAt: Date.now(),
  };
  
  // Store in dataStore
  dataStore.setProfile(normalized);
  
  return normalized;
}

// ============================================================================
// BULK LOADERS (untuk initial load yang efisien)
// ============================================================================

/**
 * Load dan transform events dalam batch
 * Menggunakan Map untuk lookup O(1) dan menghindari duplikasi
 */
export async function bulkLoadEvents(
  registryEvents: RegistryEvent[],
  contractDataFetcher: (contractId: string) => Promise<any>
): Promise<NormalizedEvent[]> {
  // Check store first - reuse yang sudah ada
  const contractDataMap = new Map<string, any>();
  const eventsToFetch: RegistryEvent[] = [];
  
  for (const regEvent of registryEvents) {
    const contractId = `${regEvent.contractAddress}.${regEvent.contractName}`;
    
    // Check if already in store
    const cached = dataStore.getEvent(contractId);
    if (cached) {
      continue;
    }
    
    eventsToFetch.push(regEvent);
  }
  
  // Fetch missing data in small batches with delay to avoid rate limiting
  // IMPORTANT: Hiro API has strict rate limits - use VERY conservative settings
  const BATCH_SIZE = 1; // Only 1 request at a time to avoid 429 errors
  const BATCH_DELAY = 2500; // 2.5s delay between requests
  
  for (let i = 0; i < eventsToFetch.length; i += BATCH_SIZE) {
    const batch = eventsToFetch.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (regEvent) => {
      const contractId = `${regEvent.contractAddress}.${regEvent.contractName}`;
      try {
        const data = await contractDataFetcher(contractId);
        contractDataMap.set(contractId, data);
      } catch (error) {
        console.error(`    ❌ Error fetching ${contractId}:`, error);
      }
    });
    
    await Promise.allSettled(batchPromises);
    
    // Add delay between batches (except for last batch)
    if (i + BATCH_SIZE < eventsToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  // Transform and store
  transformAndStoreEvents(eventsToFetch, contractDataMap);
  
  // Return all events (cached + newly fetched)
  return dataStore.getAllEvents();
}
