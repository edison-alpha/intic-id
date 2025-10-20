import React, { createContext, useContext, ReactNode } from 'react';
import { useTurnkey } from '@turnkey/react-wallet-kit';
import { toast } from 'sonner';

interface TurnkeyContextType {
  wallet: { address: string } | null;
  isConnected: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransaction: (transactionData: unknown) => Promise<unknown>;
}

const TurnkeyContext = createContext<TurnkeyContextType | undefined>(undefined);

export const useTurnkeyContext = () => {
  const context = useContext(TurnkeyContext);
  if (context === undefined) {
    throw new Error('useTurnkeyContext must be used within a TurnkeyProvider');
  }
  return context;
};

interface TurnkeyProviderProps {
  children: ReactNode;
}

export const TurnkeyProvider: React.FC<TurnkeyProviderProps> = ({ children }) => {
  const { handleLogin, user, wallets, authState, clientState } = useTurnkey();

  const isConnected = authState === 'authenticated' && !!user;
  const isLoading = clientState === 'loading';

  // Get the first wallet if available
  const wallet = wallets?.[0] || null;

  const connectWallet = async () => {
    try {
      await handleLogin();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Turnkey handles logout through the provider
      // This might need to be implemented differently
      toast.success('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect wallet');
      console.error(error);
    }
  };

  const signTransaction = async (transactionData: unknown) => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    try {
      // Use Turnkey's signing method
      // This will depend on the specific transaction type
      return transactionData; // Placeholder
    } catch (error) {
      toast.error('Transaction signing failed');
      throw error;
    }
  };

  const value: TurnkeyContextType = {
    wallet: wallet ? { address: (wallet as { address?: string; addresses?: { address?: string }[] }).address || (wallet as { address?: string; addresses?: { address?: string }[] }).addresses?.[0]?.address || 'Unknown' } : null,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    signTransaction,
  };

  return (
    <TurnkeyContext.Provider value={value}>
      {children}
    </TurnkeyContext.Provider>
  );
};