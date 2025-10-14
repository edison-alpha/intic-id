import React, { createContext, useContext, ReactNode, useState } from 'react';
import { 
  TurnkeyProvider, 
  useTurnkey, 
  AuthState,
  TurnkeyProviderConfig 
} from '@turnkey/react-wallet-kit';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { useStacks } from '@/hooks/useStacks';
import { stacksDeploymentService, type ContractData } from '@/services/stacksDeployment';
import { deployContractWithTurnkey } from '@/services/turnkeyStacksSigner-v2';
import { TurnkeyAuthModal } from '@/components/TurnkeyAuthModal';

/**
 * Turnkey Wallet Context for Stacks Testnet
 * Completely refactored to match Stackout pattern
 * 
 * Architecture:
 * - useUser hook: React Query for wallet/balances (replaces useState)
 * - useStacks hook: Wallet creation and transactions
 * - localStorage: User management (replaces Redis)
 * - Context: Wrapper to provide unified API
 * - Auth Modal: Integrated in context for easy access
 */

interface TurnkeyWalletContextType {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Wallet data
  address: string | null;
  publicKey: string | null;
  
  // Balances (formatted strings for display)
  sbtcBalance: string;
  stxBalance: string;
  
  // Modal state
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  
  // Actions
  connectWallet: () => Promise<void>;
  createStacksWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Contract deployment (kept for backward compatibility)
  deployNFTContract: (contractName: string, royaltyPercent: number) => Promise<ContractData | null>;
}

const TurnkeyWalletContext = createContext<TurnkeyWalletContextType | undefined>(undefined);

export const useTurnkeyWallet = () => {
  const context = useContext(TurnkeyWalletContext);
  if (!context) {
    throw new Error('useTurnkeyWallet must be used within TurnkeyWalletProvider');
  }
  return context;
};

interface TurnkeyWalletProviderProps {
  children: ReactNode;
}

const TurnkeyWalletContextProvider: React.FC<TurnkeyWalletProviderProps> = ({ children }) => {
  const { authState, logout: turnkeyLogout, httpClient } = useTurnkey();
  
  // Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Use our custom hooks (Stackout pattern)
  const { wallet, walletId, userOrgId, balances, isLoading: userLoading, refresh } = useUser('testnet');
  const { createWallet } = useStacks('testnet');

  // Derived state
  const isConnected = authState === AuthState.Authenticated && !!wallet;
  const address = wallet?.address || null;
  const publicKey = wallet?.publicKey || null;
  
  // Format balances for display
  const stxBalance = balances?.stx.formatted || '0.00';
  const sbtcBalance = balances?.sbtc.formatted || '0.0000';
  
  // Combined loading state
  const isLoading = userLoading;
  
  // Combined error (simplified)
  const error = null;

  /**
   * Connect wallet - open auth modal
   */
  const connectWallet = async () => {
    setIsAuthModalOpen(true);
  };

  /**
   * Create new Stacks wallet
   */
  const createStacksWallet = async () => {
    try {
      await createWallet();
      toast.success('Stacks wallet created successfully!');
    } catch (err: any) {
      console.error('Error creating Stacks wallet:', err);
      toast.error(`Failed to create Stacks wallet: ${err.message}`);
    }
  };

  /**
   * Refresh balance
   */
  const refreshBalance = async () => {
    await refresh();
    toast.success('Balance refreshed');
  };

  /**
   * Logout
   */
  const logout = async () => {
    await turnkeyLogout();
    toast.info('Logged out successfully');
  };

  /**
   * Deploy NFT Contract using Turnkey signing
   * NO private key export needed - uses Turnkey's signing API
   */
  const deployNFTContract = async (
    contractName: string,
    royaltyPercent: number
  ): Promise<ContractData | null> => {
    if (!isConnected || !address || !publicKey) {
      toast.error('Wallet not connected');
      throw new Error('Wallet not connected');
    }

    if (!httpClient) {
      toast.error('Turnkey client not initialized');
      throw new Error('Turnkey client not initialized');
    }

    try {
      toast.loading('Deploying NFT contract with Turnkey signing...');
      console.log('🔐 Deploying NFT contract using Turnkey wallet:', { 
        contractName, 
        royaltyPercent,
        address,
        publicKey: publicKey.substring(0, 20) + '...'
      });

      // Create contract data matching ContractData interface
      const contractData: ContractData = {
        eventName: contractName || 'Event Name',
        eventDate: new Date().toISOString(),
        category: 'general',
        royaltyPercentage: royaltyPercent.toString(),
        ticketCategories: [
          {
            id: '1',
            name: 'General Admission',
            price: '100000', // 0.1 STX in microSTX
            supply: '1000',
            description: 'General admission ticket',
          },
        ],
        totalSupply: 1000,
        totalRevenue: 0,
        deployer: address,
        totalCost: 0,
        template: 'nft-ticket',
      };

      // Generate contract code
      const contractCode = stacksDeploymentService.generateContractCode(contractData);

      // Generate unique contract name (shorter to avoid length limits)
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 6);
      const finalContractName = `pulse-${timestamp}-${random}`;

      console.log('📝 Generated contract name:', finalContractName);
      console.log('📏 Contract code size:', contractCode.length, 'characters');
      
      // Get organization ID from wallet
      let finalOrgId = userOrgId;
      
      // If userOrgId is not available, fetch it from wallet details
      if (!finalOrgId && walletId && httpClient) {
        try {
          console.log('🔍 Fetching organization ID from wallet...');
          const walletDetails = await httpClient.getWallet({ walletId });
          finalOrgId = (walletDetails as any)?.organizationId || 
                      (walletDetails.wallet as any)?.organizationId;
          console.log('   Fetched Org ID:', finalOrgId);
        } catch (fetchError) {
          console.warn('⚠️  Could not fetch org ID from wallet:', fetchError);
        }
      }
      
      // Debug: Log organization IDs
      console.log('🔍 Debug - Organization IDs:');
      console.log('   Parent Org ID (from env):', import.meta.env.VITE_TURNKEY_ORGANIZATION_ID);
      console.log('   User Sub-Org ID (from hook):', userOrgId);
      console.log('   Final Org ID (to be used):', finalOrgId);
      console.log('   Wallet ID:', walletId);

      // Deploy using Turnkey signing
      // IMPORTANT: Use user's organization ID (sub-org), not parent org ID
      const result = await deployContractWithTurnkey({
        contractName: finalContractName,
        contractCode,
        publicKey,
        network: 'testnet',
        httpClient,
        walletId, // Pass walletId for export
        organizationId: finalOrgId, // Use user's sub-organization ID, NOT parent org ID!
      });

      console.log('✅ Contract deployment result:', result);

      // Store deployment info
      const deploymentInfo = {
        txId: result.txId,
        contractName: result.contractName,
        contractAddress: result.contractAddress,
        deployer: address,
        timestamp: Date.now(),
        network: 'testnet',
        explorerUrl: result.explorerUrl,
      };

      const existingDeployments = JSON.parse(
        localStorage.getItem('nft_deployments') || '[]'
      );
      existingDeployments.push(deploymentInfo);
      localStorage.setItem('nft_deployments', JSON.stringify(existingDeployments));

      toast.dismiss();
      toast.success('NFT contract deployed successfully! 🎉');
      
      console.log('🔍 View transaction on Explorer:', result.explorerUrl);
      
      return contractData;
    } catch (err: any) {
      toast.dismiss();
      console.error('❌ Contract deployment error:', err);
      toast.error(`Failed to deploy contract: ${err.message}`);
      return null;
    }
  };

  const value: TurnkeyWalletContextType = {
    isConnected,
    address,
    publicKey,
    sbtcBalance,
    stxBalance,
    isLoading,
    error,
    isAuthModalOpen,
    setIsAuthModalOpen,
    connectWallet,
    createStacksWallet,
    refreshBalance,
    logout,
    deployNFTContract,
  };

  return (
    <TurnkeyWalletContext.Provider value={value}>
      {children}
      
      {/* Auth Modal */}
      <TurnkeyAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </TurnkeyWalletContext.Provider>
  );
};

/**
 * Main Provider Component
 * Wraps app with TurnkeyProvider and our Context
 */
export const TurnkeyWalletProvider: React.FC<TurnkeyWalletProviderProps> = ({ children }) => {
  const config: TurnkeyProviderConfig = {
    organizationId: import.meta.env.VITE_TURNKEY_ORGANIZATION_ID,
    authProxyConfigId: import.meta.env.VITE_TURNKEY_AUTH_PROXY_CONFIG_ID,
    apiBaseUrl: import.meta.env.VITE_TURNKEY_API_URL || 'https://api.turnkey.com',
  };

  return (
    <TurnkeyProvider config={config}>
      <TurnkeyWalletContextProvider>
        {children}
      </TurnkeyWalletContextProvider>
    </TurnkeyProvider>
  );
};
