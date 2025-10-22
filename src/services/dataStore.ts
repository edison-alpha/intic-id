/**
 * Centralized Data Store
 * Single source of truth untuk semua data dari blockchain
 * Mengelompokkan data per entity dan reuse data yang sama
 */

// ============================================================================
// INTERFACES - Struktur data yang dibutuhkan FE
// ============================================================================

export interface NormalizedEvent {
  id: string; // contractAddress.contractName
  contractAddress: string;
  contractName: string;
  
  // Event Details
  eventName: string;
  eventDate: number | null; // timestamp
  eventTime: string;
  venue: string;
  venueAddress: string;
  location: string;
  description: string;
  category: string;
  
  // Images
  image: string;
  imageUri: string;
  
  // Pricing
  price: string; // microSTX
  priceFormatted: string; // STX
  
  // Supply
  totalSupply: number;
  minted: number;
  available: number;
  remaining: number;
  
  // Status
  isActive: boolean;
  isCancelled: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  
  // Metadata
  metadataUri?: string;
  tokenUri?: string;
  
  // Registry Info
  eventId?: number;
  organizer?: string;
  registeredAt?: number;
}

export interface NormalizedTicket {
  id: string; // contractId-tokenId
  contractId: string;
  tokenId: number;
  
  // Owner Info
  owner: string;
  
  // Event Reference (reuse dari events store)
  eventId: string; // sama dengan NormalizedEvent.id
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  
  // Ticket Details
  ticketNumber: string;
  category: string;
  price: string;
  status: 'active' | 'used' | 'expired';
  
  // Images
  image: string;
  
  // Mint Info
  mintTxId?: string;
  mintedAt?: number;
}

export interface NormalizedProfile {
  address: string;
  username: string;
  email?: string;
  bio?: string;
  avatar: string;
  
  // Cached data
  cachedAt: number;
}

// ============================================================================
// DATA STORE
// ============================================================================

class DataStore {
  // Normalized stores
  private events = new Map<string, NormalizedEvent>();
  private tickets = new Map<string, NormalizedTicket>();
  private profiles = new Map<string, NormalizedProfile>();
  
  // Index untuk quick lookup
  private ticketsByOwner = new Map<string, Set<string>>(); // owner -> Set<ticketId>
  private ticketsByEvent = new Map<string, Set<string>>(); // eventId -> Set<ticketId>
  
  // Cache metadata
  private cacheTimestamps = new Map<string, number>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  // ============================================================================
  // EVENTS
  // ============================================================================
  
  /**
   * Set event data (upsert)
   */
  setEvent(event: NormalizedEvent): void {
    const key = event.id;
    this.events.set(key, event);
    this.cacheTimestamps.set(`event:${key}`, Date.now());
    

  }
  
  /**
   * Set multiple events (bulk)
   */
  setEvents(events: NormalizedEvent[]): void {
    events.forEach(event => this.setEvent(event));

  }
  
  /**
   * Get event by ID
   */
  getEvent(eventId: string): NormalizedEvent | null {
    if (!this.isCacheValid(`event:${eventId}`)) {
      this.events.delete(eventId);
      return null;
    }
    return this.events.get(eventId) || null;
  }
  
  /**
   * Get all events
   */
  getAllEvents(): NormalizedEvent[] {
    return Array.from(this.events.values()).filter(event => 
      this.isCacheValid(`event:${event.id}`)
    );
  }
  
  /**
   * Get active events only
   */
  getActiveEvents(): NormalizedEvent[] {
    return this.getAllEvents().filter(e => e.isActive && !e.isCancelled);
  }
  
  /**
   * Get featured events
   */
  getFeaturedEvents(): NormalizedEvent[] {
    return this.getActiveEvents().filter(e => e.isFeatured);
  }
  
  // ============================================================================
  // TICKETS
  // ============================================================================
  
  /**
   * Set ticket data (upsert)
   */
  setTicket(ticket: NormalizedTicket): void {
    const key = ticket.id;
    this.tickets.set(key, ticket);
    this.cacheTimestamps.set(`ticket:${key}`, Date.now());
    
    // Update indexes
    if (!this.ticketsByOwner.has(ticket.owner)) {
      this.ticketsByOwner.set(ticket.owner, new Set());
    }
    this.ticketsByOwner.get(ticket.owner)!.add(key);
    
    if (!this.ticketsByEvent.has(ticket.eventId)) {
      this.ticketsByEvent.set(ticket.eventId, new Set());
    }
    this.ticketsByEvent.get(ticket.eventId)!.add(key);
    

  }
  
  /**
   * Set multiple tickets (bulk)
   */
  setTickets(tickets: NormalizedTicket[]): void {
    tickets.forEach(ticket => this.setTicket(ticket));

  }
  
  /**
   * Get ticket by ID
   */
  getTicket(ticketId: string): NormalizedTicket | null {
    if (!this.isCacheValid(`ticket:${ticketId}`)) {
      this.tickets.delete(ticketId);
      return null;
    }
    return this.tickets.get(ticketId) || null;
  }
  
  /**
   * Get tickets by owner
   */
  getTicketsByOwner(owner: string): NormalizedTicket[] {
    const ticketIds = this.ticketsByOwner.get(owner);
    if (!ticketIds) return [];
    
    return Array.from(ticketIds)
      .map(id => this.getTicket(id))
      .filter(Boolean) as NormalizedTicket[];
  }
  
  /**
   * Get tickets by event
   */
  getTicketsByEvent(eventId: string): NormalizedTicket[] {
    const ticketIds = this.ticketsByEvent.get(eventId);
    if (!ticketIds) return [];
    
    return Array.from(ticketIds)
      .map(id => this.getTicket(id))
      .filter(Boolean) as NormalizedTicket[];
  }
  
  // ============================================================================
  // PROFILES
  // ============================================================================
  
  /**
   * Set profile data
   */
  setProfile(profile: NormalizedProfile): void {
    const key = profile.address;
    this.profiles.set(key, { ...profile, cachedAt: Date.now() });
    this.cacheTimestamps.set(`profile:${key}`, Date.now());
    

  }
  
  /**
   * Get profile
   */
  getProfile(address: string): NormalizedProfile | null {
    if (!this.isCacheValid(`profile:${address}`)) {
      this.profiles.delete(address);
      return null;
    }
    return this.profiles.get(address) || null;
  }
  
  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================
  
  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string, ttl: number = this.DEFAULT_TTL): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < ttl;
  }
  
  /**
   * Clear all cache
   */
  clearAll(): void {
    this.events.clear();
    this.tickets.clear();
    this.profiles.clear();
    this.ticketsByOwner.clear();
    this.ticketsByEvent.clear();
    this.cacheTimestamps.clear();
    

  }
  
  /**
   * Clear specific cache
   */
  clearEvents(): void {
    this.events.clear();

  }
  
  clearTickets(owner?: string): void {
    if (owner) {
      const ticketIds = this.ticketsByOwner.get(owner);
      if (ticketIds) {
        ticketIds.forEach(id => {
          this.tickets.delete(id);
          this.cacheTimestamps.delete(`ticket:${id}`);
        });
        this.ticketsByOwner.delete(owner);
      }

    } else {
      this.tickets.clear();
      this.ticketsByOwner.clear();
      this.ticketsByEvent.clear();

    }
  }
  
  clearProfile(address: string): void {
    this.profiles.delete(address);
    this.cacheTimestamps.delete(`profile:${address}`);

  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      events: this.events.size,
      tickets: this.tickets.size,
      profiles: this.profiles.size,
      owners: this.ticketsByOwner.size,
      totalCached: this.cacheTimestamps.size,
    };
  }
  
  /**
   * Prefetch data for a user (load semua data yang mungkin dibutuhkan)
   */
  async prefetchUserData(userAddress: string): Promise<void> {

    
    // Implementation akan ditambahkan nanti
    // Akan load: profile, tickets, events dari tickets tersebut
  }
}

// Export singleton instance
export const dataStore = new DataStore();

// Export helper functions
export const getEventFromStore = (eventId: string) => dataStore.getEvent(eventId);
export const getTicketsForUser = (userAddress: string) => dataStore.getTicketsByOwner(userAddress);
export const getAllEventsFromStore = () => dataStore.getAllEvents();
export const getActiveEventsFromStore = () => dataStore.getActiveEvents();
