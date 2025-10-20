/**
 * Event Registry V2 Service
 * Fetches registered contract addresses from registry
 * Details are then fetched from individual contracts via indexer
 */

import { cvToJSON, hexToCV, uintCV, serializeCV } from '@stacks/transactions';
import { getRegistryContract } from '@/config/contracts';

const NETWORK_URL = 'https://api.testnet.hiro.so';

/**
 * Registry Event Entry (minimal data from V2)
 */
export interface RegistryEvent {
  eventId: number;
  contractAddress: string;
  contractName: string;
  organizer: string;
  registeredAt: number;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
}

/**
 * Call read-only function on registry contract
 */
async function callRegistryReadOnly(
  functionName: string,
  functionArgs: string[] = []
): Promise<any> {
  const registry = getRegistryContract();
  const [address, name] = registry.address.split('.');

  const url = `${NETWORK_URL}/v2/contracts/call-read/${address}/${name}/${functionName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: address,
      arguments: functionArgs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Registry call failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.okay) {
    throw new Error(`Registry returned error: ${data.cause}`);
  }

  return data.result;
}

/**
 * Parse Clarity value from hex
 */
function parseCV(hex: string): any {
  try {
    const cv = hexToCV(hex);
    return cvToJSON(cv);
  } catch (error) {
    console.error('Error parsing CV:', error);
    return null;
  }
}

/**
 * Get total events count
 */
export async function getTotalEvents(): Promise<number> {
  try {
    const result = await callRegistryReadOnly('get-total-events');
    const parsed = parseCV(result);
    return parsed?.value?.value || 0;
  } catch (error) {
    console.error('Error getting total events:', error);
    return 0;
  }
}

/**
 * Get single event by ID
 */
export async function getRegistryEvent(eventId: number): Promise<RegistryEvent | null> {
  try {
    // Serialize uint argument to hex
    const eventIdArg = `0x${Buffer.from(serializeCV(uintCV(eventId))).toString('hex')}`;

    const result = await callRegistryReadOnly('get-event', [eventIdArg]);
    const parsed = parseCV(result);

    if (!parsed?.value?.value) {
      return null;
    }

    const eventData = parsed.value.value;

    return {
      eventId: parseInt(eventData['event-id'].value),
      contractAddress: eventData['contract-address'].value,
      contractName: eventData['contract-name'].value,
      organizer: eventData.organizer.value,
      registeredAt: parseInt(eventData['registered-at'].value),
      isActive: eventData['is-active'].value,
      isVerified: eventData['is-verified'].value,
      isFeatured: eventData['is-featured'].value,
    };
  } catch (error) {
    console.error(`Error getting event ${eventId}:`, error);
    return null;
  }
}

/**
 * Get events in range (for pagination)
 * Returns: { start: uint, end: uint, events: (list 10 (optional event-data)) }
 */
export async function getRegistryEventsRange(
  startId: number,
  endId: number
): Promise<RegistryEvent[]> {
  try {
    // Serialize uint arguments to hex
    const startArg = `0x${Buffer.from(serializeCV(uintCV(startId))).toString('hex')}`;
    const endArg = `0x${Buffer.from(serializeCV(uintCV(endId))).toString('hex')}`;

    const result = await callRegistryReadOnly('get-events-range', [startArg, endArg]);
    const parsed = parseCV(result);

    console.log(`📦 get-events-range(${startId}, ${endId}) raw response:`, JSON.stringify(parsed, null, 2));

    // Response structure: { type: 'ok', value: { type: 'tuple', value: { start, end, events } } }
    if (!parsed?.value) {
      console.warn('No value in response');
      return [];
    }

    // Access the tuple's value property (not data)
    const tupleValue = parsed.value.value || parsed.value;
    console.log('Tuple value:', tupleValue);

    // Get the events field from tuple value
    const eventsField = tupleValue.events;
    if (!eventsField) {
      console.warn('No events field in tuple');
      return [];
    }

    // Events field has type and value, get the actual list
    const eventsList = eventsField.value;
    if (!Array.isArray(eventsList)) {
      console.warn('Events value is not an array:', eventsList);
      return [];
    }

    console.log(`Found ${eventsList.length} items in events list`);

    const events: RegistryEvent[] = [];

    // Each item in the list is: { type: '(optional ...)', value: {...} } or { type: '(optional none)', value: null }
    for (let i = 0; i < eventsList.length; i++) {
      const item = eventsList[i];

      // Check if it has a non-null value (is some, not none)
      if (item?.value !== null && item?.value !== undefined) {
        // item.value is another tuple with type and value
        const eventTuple = item.value;
        const eventData = eventTuple.value || eventTuple;
        console.log(`Event ${i} data:`, eventData);

        try {
          const event: RegistryEvent = {
            eventId: parseInt(eventData['event-id']?.value || '0'),
            contractAddress: eventData['contract-address']?.value || '',
            contractName: eventData['contract-name']?.value || '',
            organizer: eventData.organizer?.value || '',
            registeredAt: parseInt(eventData['registered-at']?.value || '0'),
            isActive: eventData['is-active']?.value === true,
            isVerified: eventData['is-verified']?.value === true,
            isFeatured: eventData['is-featured']?.value === true,
          };

          // Only add active events with valid contract address
          if (event.isActive && event.contractAddress) {
            events.push(event);
            console.log(`✅ Added event ${event.eventId}: ${event.contractAddress}.${event.contractName}`);
          }
        } catch (err) {
          console.warn(`Failed to parse event at index ${i}:`, err);
        }
      } else {
        console.log(`Item ${i} is none (no event at this ID)`);
      }
    }

    console.log(`✅ Parsed ${events.length} active events from range ${startId}-${endId}`);
    return events;
  } catch (error) {
    console.error(`Error getting events range ${startId}-${endId}:`, error);
    return [];
  }
}

/**
 * Get all registered events (using get-events-range for efficiency)
 */
export async function getAllRegistryEvents(): Promise<RegistryEvent[]> {
  try {
    const totalEvents = await getTotalEvents();
    
    if (totalEvents === 0) {
      return [];
    }

    console.log(`📊 Total events in registry: ${totalEvents}`);

    const allEvents: RegistryEvent[] = [];
    const batchSize = 10; // Contract returns 10 events per call

    // Fetch in batches of 10
    for (let startId = 1; startId <= totalEvents; startId += batchSize) {
      const endId = Math.min(startId + batchSize - 1, totalEvents);
      console.log(`Fetching events ${startId} to ${endId}...`);
      
      const batch = await getRegistryEventsRange(startId, endId);
      allEvents.push(...batch);
    }

    console.log(`✅ Fetched ${allEvents.length} active events from registry`);
    return allEvents;
  } catch (error) {
    console.error('Error getting all registry events:', error);
    return [];
  }
}

/**
 * Get organizer's events
 */
export async function getOrganizerEvents(organizer: string): Promise<number[]> {
  try {
    // Convert principal to hex
    const principalHex = `0x05${Buffer.from(organizer).toString('hex')}`;
    
    const result = await callRegistryReadOnly('get-organizer-events', [principalHex]);
    const parsed = parseCV(result);
    
    if (!parsed?.value?.value) {
      return [];
    }

    return parsed.value.value.map((id: any) => parseInt(id.value));
  } catch (error) {
    console.error(`Error getting organizer events for ${organizer}:`, error);
    return [];
  }
}

/**
 * Get featured events
 */
export async function getFeaturedEvents(): Promise<RegistryEvent[]> {
  try {
    const result = await callRegistryReadOnly('get-featured-events');
    const parsed = parseCV(result);
    
    if (!parsed?.value?.value) {
      return [];
    }

    const featuredIds = parsed.value.value
      .filter((id: any) => id?.value)
      .map((id: any) => parseInt(id.value));

    // Fetch full details for each featured event
    const events = await Promise.all(
      featuredIds.map((id: number) => getRegistryEvent(id))
    );

    return events.filter((e): e is RegistryEvent => e !== null);
  } catch (error) {
    console.error('Error getting featured events:', error);
    return [];
  }
}

/**
 * Check if organizer is verified
 */
export async function isOrganizerVerified(organizer: string): Promise<boolean> {
  try {
    const principalHex = `0x05${Buffer.from(organizer).toString('hex')}`;
    const result = await callRegistryReadOnly('is-organizer-verified', [principalHex]);
    const parsed = parseCV(result);
    return parsed?.value?.value || false;
  } catch (error) {
    console.error(`Error checking organizer verification for ${organizer}:`, error);
    return false;
  }
}

/**
 * Get platform stats
 */
export async function getPlatformStats() {
  try {
    const result = await callRegistryReadOnly('get-platform-stats');
    const parsed = parseCV(result);
    
    return {
      totalEvents: parseInt(parsed?.value?.['total-events']?.value || '0'),
      totalOrganizers: parseInt(parsed?.value?.['total-organizers']?.value || '0'),
      featuredCount: parseInt(parsed?.value?.['featured-count']?.value || '0'),
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    return {
      totalEvents: 0,
      totalOrganizers: 0,
      featuredCount: 0,
    };
  }
}
