/**
 * useStacks Hook (Stackout Pattern)
 * Handles wallet creation and Stacks transactions
 */

import { useTurnkey } from '@turnkey/react-wallet-kit';
import { useQueryClient } from '@tanstack/react-query';
import { getStacksWallet, type Network } from '@/lib/stacks';
import { getOrCreateUser } from '@/lib/userStorage';
import { getAddressFromPublicKey } from '@stacks/transactions';
import { toast } from 'sonner';

export const useStacks = (network: Network = 'testnet') => {
  const {
    user: turnkeyUser,
    createWallet: createWalletTurnkey,
    httpClient,
  } = useTurnkey();
  const queryClient = useQueryClient();

  /**
   * Create Stacks wallet with SECP256K1 curve
   * Following Stackout's implementation
   */
  const createWallet = async () => {
    try {
      if (!turnkeyUser?.userId) {
        toast.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      toast.loading('Creating Stacks wallet...');
      const userId = turnkeyUser.userId;

      // Create wallet with SECP256K1 curve and Stacks derivation path
      const walletId = await createWalletTurnkey({
        walletName: `Stacks Wallet ${Date.now()}`,
        accounts: [
          {
            curve: 'CURVE_SECP256K1',
            pathFormat: 'PATH_FORMAT_BIP32',
            path: "m/44'/5757'/0'/0/0", // Stacks derivation path
            addressFormat: 'ADDRESS_FORMAT_UNCOMPRESSED',
          },
        ],
      });

      if (!walletId) {
        toast.dismiss();
        toast.error('Failed to create wallet');
        throw new Error('Failed to create wallet');
      }

      // Get wallet account to extract public key
      const walletAccount = await httpClient?.getWalletAccount({ walletId });
      if (!walletAccount) {
        toast.dismiss();
        toast.error('Failed to get wallet account');
        throw new Error('Failed to get wallet account');
      }

      const publicKey = walletAccount.account.publicKey;
      if (!publicKey) {
        toast.dismiss();
        toast.error('No public key found');
        throw new Error('No public key found');
      }

      // Get Stacks address from public key
      const address = getAddressFromPublicKey(publicKey, network);

      console.log('✅ Wallet created:', {
        walletId,
        address,
        network,
      });

      // Store user data in localStorage
      await getOrCreateUser(userId, walletId, address);

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      await queryClient.invalidateQueries({ queryKey: ['balances'] });

      toast.dismiss();
      toast.success('Wallet created successfully!');

      return { walletId, address, publicKey };
    } catch (error) {
      toast.dismiss();
      console.error('Error creating wallet:', error);
      toast.error('Failed to create wallet');
      throw error;
    }
  };

  /**
   * Get current wallet info
   */
  const getWallet = async (walletId: string) => {
    if (!httpClient) {
      throw new Error('HTTP client not initialized');
    }

    const walletAccount = await httpClient.getWalletAccount({ walletId });
    const publicKey = walletAccount.account.publicKey;

    if (!publicKey) {
      throw new Error('No public key found');
    }

    return getStacksWallet(publicKey, network);
  };

  return {
    createWallet,
    getWallet,
  };
};

export type UseStacksResult = ReturnType<typeof useStacks>;
