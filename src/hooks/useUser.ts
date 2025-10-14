/**
 * useUser Hook (Stackout Pattern)
 * Manages wallet, balances, and user data with React Query
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTurnkey } from '@turnkey/react-wallet-kit';
import { getStacksWallet, getUserBalances, type Network } from '@/lib/stacks';
import { getOrCreateUser } from '@/lib/userStorage';

export const useUser = (network: Network = 'testnet') => {
  const { httpClient, user: turnkeyUser, wallets } = useTurnkey();
  const queryClient = useQueryClient();

  const userId = turnkeyUser?.userId;
  const userOrgId = (turnkeyUser as any)?.organizationId || (turnkeyUser as any)?.subOrganizationId; // Sub-organization ID
  
  // Debug: Log turnkeyUser to find correct property for org ID
  if (turnkeyUser && !userOrgId) {
    console.log('🔍 Debug - turnkeyUser properties:', turnkeyUser);
    console.log('   Available keys:', Object.keys(turnkeyUser));
  }
  
  // Find the first Stacks wallet (SECP256K1)
  const stacksWallet = wallets?.find(w => 
    w.accounts?.some(acc => acc.curve === 'CURVE_SECP256K1')
  );
  const walletId = stacksWallet?.walletId;

  // Query wallet account from Turnkey
  const walletQuery = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: async () => {
      if (!httpClient || !walletId) {
        throw new Error('No wallet or http client');
      }

      const walletAccount = await httpClient.getWalletAccount({ walletId });
      const publicKey = walletAccount.account.publicKey;

      if (!publicKey) {
        throw new Error('No public key found');
      }

      // Extract organization ID from wallet account
      const walletOrgId = (walletAccount as any)?.organizationId || 
                         (walletAccount.account as any)?.organizationId;
      
      console.log('🔍 Wallet Query - Organization ID from walletAccount:', walletOrgId);

      const stacksWallet = getStacksWallet(publicKey, network);
      
      return {
        ...stacksWallet,
        organizationId: walletOrgId, // Add org ID to wallet object
      };
    },
    enabled: !!httpClient && !!walletId,
    staleTime: Infinity, // Wallet info doesn't change
  });

  // Query user data (stored locally)
  const userQuery = useQuery({
    queryKey: ['user', userId, walletId],
    queryFn: async () => {
      if (!userId || !walletId || !walletQuery.data) {
        throw new Error('Missing user or wallet data');
      }

      const user = getOrCreateUser(
        userId,
        walletId,
        walletQuery.data.address,
      );
      return user;
    },
    enabled: !!userId && !!walletId && !!walletQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query balances from Stacks API
  const balancesQuery = useQuery({
    queryKey: ['balances', walletQuery.data?.address, network],
    queryFn: async () => {
      if (!walletQuery.data?.address) {
        throw new Error('No wallet address');
      }

      return getUserBalances(walletQuery.data.address, network);
    },
    enabled: !!walletQuery.data?.address,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['user'] }),
      queryClient.invalidateQueries({ queryKey: ['balances'] }),
    ]);
  };

  return {
    // Wallet info
    wallet: walletQuery.data,
    walletId, // Add walletId to return
    userOrgId: walletQuery.data?.organizationId || userOrgId, // Get from wallet data first, then fallback
    walletLoading: walletQuery.isLoading,
    walletError: walletQuery.error,

    // User info
    user: userQuery.data,
    userLoading: userQuery.isLoading,
    userError: userQuery.error,

    // Balances
    balances: balancesQuery.data,
    balancesLoading: balancesQuery.isLoading,
    balancesError: balancesQuery.error,

    // Combined loading state
    isLoading: walletQuery.isLoading || userQuery.isLoading || balancesQuery.isLoading,

    // Combined error state
    error: walletQuery.error || userQuery.error || balancesQuery.error,

    // Refresh function
    refresh,
  };
};

export type UseUserResult = ReturnType<typeof useUser>;
