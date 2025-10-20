/**
 * useStacks Hook (Stackout Pattern) - DISABLED
 * Handles wallet creation and Stacks transactions
 */

import { toast } from 'sonner';

export const useStacks = () => {
  /**
   * Create Stacks wallet - DISABLED
   */
  const createWallet = async () => {
    toast.info('Wallet creation is currently disabled');
    throw new Error('Wallet creation is not available');
  };

  /**
   * Get current wallet info - DISABLED
   */
  const getWallet = async (walletId: string) => {
    toast.info('Wallet retrieval is currently disabled');
    throw new Error('Wallet retrieval is not available');
  };

  return {
    createWallet,
    getWallet,
  };
};

export type UseStacksResult = ReturnType<typeof useStacks>;
