import { useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Simple fetch helper
 */
async function fetchApi(endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Hook: Get all events
 * Cache: 2 minutes
 */
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => fetchApi('/api/optimized/events'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get specific event details
 * Cache: 90 seconds
 */
export function useEvent(contractId: string | undefined) {
  return useQuery({
    queryKey: ['event', contractId],
    queryFn: () => fetchApi(`/api/optimized/event/${contractId}`),
    enabled: !!contractId,
    staleTime: 90 * 1000, // 90 seconds
  });
}

/**
 * Hook: Get user's tickets
 * Cache: 30 seconds, auto-refresh every 60 seconds
 */
export function useUserTickets(userAddress: string | undefined) {
  return useQuery({
    queryKey: ['userTickets', userAddress],
    queryFn: () => fetchApi(`/api/optimized/user/${userAddress}/tickets`),
    enabled: !!userAddress,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  });
}

/**
 * Hook: Get user's balance
 * Cache: 15 seconds, auto-refresh every 30 seconds
 * Returns: balance_formatted (in STX) as number
 */
export function useBalance(address: string | undefined) {
  return useQuery({
    queryKey: ['balance', address],
    queryFn: async () => {
      const result = await fetchApi(`/api/stacks/address/${address}/balance`);
      // Return formatted balance (in STX, not microSTX)
      return result.stx?.balance_formatted || 0;
    },
    enabled: !!address,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook: Get user's tokens in a contract
 * Cache: 1 minute
 */
export function useUserTokens(contractId: string | undefined, userAddress: string | undefined) {
  return useQuery({
    queryKey: ['userTokens', contractId, userAddress],
    queryFn: () => fetchApi(`/api/optimized/contract/${contractId}/user/${userAddress}/tokens`),
    enabled: !!contractId && !!userAddress,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook: Get contract analytics
 * Cache: 5 minutes
 */
export function useContractAnalytics(contractId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', contractId],
    queryFn: () => fetchApi(`/api/optimized/contract/${contractId}/analytics`),
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Invalidate cache (use after transactions)
 */
export function useInvalidateCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate after purchase
    invalidateAfterPurchase: (contractId: string, userAddress: string) => {
      queryClient.invalidateQueries({ queryKey: ['balance', userAddress] });
      queryClient.invalidateQueries({ queryKey: ['userTickets', userAddress] });
      queryClient.invalidateQueries({ queryKey: ['event', contractId] });
      queryClient.invalidateQueries({ queryKey: ['userTokens', contractId, userAddress] });
    },

    // Invalidate after transfer
    invalidateAfterTransfer: (contractId: string, fromAddress: string, toAddress: string) => {
      queryClient.invalidateQueries({ queryKey: ['userTickets', fromAddress] });
      queryClient.invalidateQueries({ queryKey: ['userTickets', toAddress] });
      queryClient.invalidateQueries({ queryKey: ['userTokens', contractId, fromAddress] });
      queryClient.invalidateQueries({ queryKey: ['userTokens', contractId, toAddress] });
    },

    // Invalidate everything
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

/**
 * Hook: Get cache stats (for monitoring)
 */
export function useCacheStats() {
  return useQuery({
    queryKey: ['cacheStats'],
    queryFn: () => fetchApi('/cache/stats'),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook: Get events with full details
 * First gets list, then fetches details for each event
 * Cache: 2 minutes
 */
export function useEventsWithDetails() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['eventsWithDetails'],
    queryFn: async () => {
      // Step 1: Get event list
      const eventsData = await fetchApi('/api/optimized/events');
      
      if (!eventsData?.events || eventsData.events.length === 0) {
        return { events: [], total: 0 };
      }

      // Step 2: Fetch details for each event (will use cache if available)
      const eventsWithDetails = await Promise.all(
        eventsData.events.map(async (event: any) => {
          const contractId = `${event.contractAddress}.${event.contractName}`;
          
          // Check if details already in cache
          const cachedDetails = queryClient.getQueryData(['event', contractId]);
          
          if (cachedDetails) {
            return cachedDetails;
          }
          
          // Fetch details if not cached
          try {
            const details = await fetchApi(`/api/optimized/event/${contractId}`);
            // Cache the details
            queryClient.setQueryData(['event', contractId], details);
            return details;
          } catch (error) {
            console.warn(`Failed to load details for ${contractId}:`, error);
            // Return minimal event data if details fail
            return {
              contractId,
              eventName: event.contractName,
              isActive: event.isActive,
              isFeatured: event.isFeatured,
              isVerified: event.isVerified,
            };
          }
        })
      );

      return {
        events: eventsWithDetails.filter(e => e.isActive !== false),
        total: eventsWithDetails.length
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
