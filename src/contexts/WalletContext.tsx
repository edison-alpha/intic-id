import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { serializeCV } from '@stacks/transactions';

// Declare wallet provider types
declare global {
  interface Window {
    LeatherProvider?: any;
    HiroWalletProvider?: any;
    btc?: any;
    XverseProviders?: {
      StacksProvider?: any;
      BitcoinProvider?: any;
    };
  }
}

interface WalletContextType {
  wallet: { address: string; publicKey?: string } | null;
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransaction: (transaction: unknown) => Promise<unknown>;
  sendSTX: (recipient: string, amount: number) => Promise<string>;
  deployContract: (contractName: string, code: string) => Promise<string>;
  getBalance: () => Promise<number>;
  callContractFunction: (params: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: any[];
    onFinish?: (data: any) => void;
  }) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<{ address: string; publicKey?: string } | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    // Check for stored wallet connection
    const storedWallet = localStorage.getItem('wallet-address');
    if (storedWallet) {
      try {
        const walletData = JSON.parse(storedWallet);
        setWallet(walletData);
        setIsWalletConnected(true);
      } catch (error) {
        console.error('Error loading stored wallet:', error);
        localStorage.removeItem('wallet-address');
      }
    }
  }, []);

  const connectWallet = async () => {
    try {
      // Try Xverse Wallet first (Mobile & Desktop support)
      if (typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        try {
          const response = await window.XverseProviders.StacksProvider.request('getAddresses', {
            purposes: ['payment'],
          });

          if (response && response.result && response.result.addresses) {
            const addresses = response.result.addresses;
            const stxAddress = addresses.find((addr: any) => addr.symbol === 'STX');

            if (stxAddress) {
              const walletData = {
                address: stxAddress.address,
                publicKey: stxAddress.publicKey
              };

              setWallet(walletData);
              setIsWalletConnected(true);
              localStorage.setItem('wallet-address', JSON.stringify(walletData));
              localStorage.setItem('wallet-type', 'xverse');
              return;
            }
          }
        } catch (xverseError) {
          console.error('Xverse connection error:', xverseError);
          // Continue to try other wallets
        }
      }

      // Try LeatherProvider (Desktop)
      if (typeof window !== 'undefined' && window.LeatherProvider) {
        const response = await window.LeatherProvider.request('getAddresses');

        if (response && response.result && response.result.addresses) {
          const addresses = response.result.addresses;
          const stxAddress = addresses.find((addr: any) => addr.symbol === 'STX');

          if (stxAddress) {
            const walletData = {
              address: stxAddress.address,
              publicKey: stxAddress.publicKey
            };

            setWallet(walletData);
            setIsWalletConnected(true);
            localStorage.setItem('wallet-address', JSON.stringify(walletData));
            localStorage.setItem('wallet-type', 'leather');
            return;
          }
        }
      }

      // Try Hiro Wallet (Desktop)
      if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        const response = await window.HiroWalletProvider.request('getAddresses');

        if (response && response.result && response.result.addresses) {
          const addresses = response.result.addresses;
          const stxAddress = addresses.find((addr: any) => addr.symbol === 'STX');

          if (stxAddress) {
            const walletData = {
              address: stxAddress.address,
              publicKey: stxAddress.publicKey
            };

            setWallet(walletData);
            setIsWalletConnected(true);
            localStorage.setItem('wallet-address', JSON.stringify(walletData));
            localStorage.setItem('wallet-type', 'hiro');
            return;
          }
        }
      }

      // Fallback: Show instruction to install wallet
      throw new Error(
        'Please install a Stacks wallet.\n\n' +
        'Download from:\n' +
        '• Xverse (Mobile & Desktop): https://xverse.app\n' +
        '• Hiro Wallet (Desktop): https://wallet.hiro.so/wallet/install-web\n' +
        '• Leather (Desktop): https://leather.io/install-extension'
      );
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    setWallet(null);
    setIsWalletConnected(false);
    localStorage.removeItem('wallet-address');
  };

  const signTransaction = async (transaction: unknown) => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }
    console.warn('Generic transaction signing not yet implemented');
    return transaction;
  };

  const sendSTX = async (recipient: string, amount: number): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    // Check if user has sufficient balance
    const balance = await getBalance();
    if (balance < amount) {
      throw new Error(`Insufficient balance. Have: ${balance} STX, need: ${amount} STX`);
    }

    try {
      let provider = null;
      const walletType = localStorage.getItem('wallet-type');

      // Try Xverse first if it was the connected wallet
      if (walletType === 'xverse' && typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        provider = window.XverseProviders.StacksProvider;
      } else if (typeof window !== 'undefined' && window.LeatherProvider) {
        provider = window.LeatherProvider;
      } else if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        provider = window.HiroWalletProvider;
      } else if (typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        provider = window.XverseProviders.StacksProvider;
      }

      if (!provider) {
        throw new Error('Wallet extension not found. Please make sure your wallet is installed and unlocked.');
      }

      // Use stx_transferStx method
      // Amount should be in microSTX as a string
      const amountInMicroSTX = (amount * 1000000).toString();

      const requestParams = {
        recipient: recipient,
        amount: amountInMicroSTX,
        memo: 'Transfer from Pulse Robot',
      };

      const response = await provider.request('stx_transferStx', requestParams);

      // Check if there's an error in the response
      if (response && response.error) {
        console.error('Transfer error:', response.error);
        const errorMsg = response.error.message || 'Transaction failed';
        throw new Error(errorMsg);
      }

      // Check for successful transaction ID
      if (response && response.result) {
        if (typeof response.result === 'string') {
          return response.result;
        } else if (response.result.txid) {
          return response.result.txid;
        } else if (response.result.txId) {
          return response.result.txId;
        }
      }

      return 'Transaction initiated successfully';
    } catch (error: any) {
      console.error('Error sending STX:', error);

      // Better error messages
      if (error.message) {
        throw new Error(error.message);
      } else if (error.error && error.error.message) {
        throw new Error(error.error.message);
      } else {
        throw new Error('Failed to send STX. Please check your wallet and try again.');
      }
    }
  };

  const deployContract = async (contractName: string, code: string): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    try {
      let provider = null;
      const walletType = localStorage.getItem('wallet-type');

      // Try to use the wallet that was connected
      if (walletType === 'xverse' && typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        provider = window.XverseProviders.StacksProvider;
      } else if (typeof window !== 'undefined' && window.LeatherProvider) {
        provider = window.LeatherProvider;
      } else if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        provider = window.HiroWalletProvider;
      } else if (typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        provider = window.XverseProviders.StacksProvider;
      }

      if (!provider) {
        throw new Error('Wallet extension not found. Please make sure your wallet is installed and unlocked.');
      }



      // Validate contract name
      if (!/^[a-z][a-z0-9-]*$/.test(contractName)) {
        throw new Error(`Invalid contract name: ${contractName}. Must start with lowercase letter and contain only lowercase letters, numbers, and hyphens.`);
      }

      if (contractName.length > 128) {
        throw new Error(`Contract name too long: ${contractName.length} chars (max 128)`);
      }

      // Validate code size (max ~100KB for testnet)
      if (code.length > 100000) {
        throw new Error(`Contract code too large: ${code.length} bytes (max ~100KB)`);
      }

      // Use stx_deployContract method with correct format
      // CRITICAL: Always specify testnet explicitly to avoid mainnet accidents
      const requestParams = {
        name: contractName,
        clarityCode: code,
        network: 'testnet' as const, // Explicitly specify testnet
        // Optional but recommended: specify anchor mode
        postConditionMode: 'allow', // Allow the contract to make transfers
      };



      let response;
      try {
        response = await provider.request('stx_deployContract', requestParams);

      } catch (providerError: any) {
        console.error('❌ Provider request failed:', providerError);
        console.error('Error type:', typeof providerError);
        console.error('Error keys:', providerError ? Object.keys(providerError) : 'null');
        console.error('Error message:', providerError?.message);
        console.error('Error stack:', providerError?.stack);

        // Parse specific error types
        let errorMessage = providerError?.message || 'Unknown deployment error';

        // Check for specific blockchain errors
        if (errorMessage.includes('unable to parse') || errorMessage.includes('parse node response') || errorMessage.includes('failed to broadcast')) {
          errorMessage = '❌ Contract Deployment Failed - Blockchain Node Error\n\n' +
                        'The blockchain node could not process your contract. Common causes:\n' +
                        '• Invalid characters in event name/description (emojis, special symbols)\n' +
                        '• Network connectivity issues\n' +
                        '• Blockchain node temporarily unavailable\n\n' +
                        '✅ Solutions:\n' +
                        '1. Remove emojis and special characters from event name/description\n' +
                        '2. Use only ASCII characters (A-Z, 0-9, basic punctuation)\n' +
                        '3. Wait 30 seconds and try again\n' +
                        '4. Check your internet connection\n\n' +
                        'If the error persists, your event details may contain unsupported characters.\n\n' +
                        'Technical error: ' + providerError?.message;
        } else if (errorMessage.includes('broadcast')) {
          errorMessage = '❌ Transaction Broadcast Failed\n\n' +
                        'Failed to broadcast transaction to blockchain. Possible causes:\n' +
                        '• Insufficient STX balance for fees (~0.3 STX required)\n' +
                        '• Network connectivity issues\n' +
                        '• Blockchain node temporarily unavailable\n\n' +
                        '✅ Solutions:\n' +
                        '1. Check your wallet STX balance\n' +
                        '2. Get testnet STX: https://explorer.hiro.so/sandbox/faucet?chain=testnet\n' +
                        '3. Wait a moment and try again\n' +
                        '4. Check your internet connection\n\n' +
                        'Technical error: ' + providerError?.message;
        } else if (errorMessage.includes('insufficient')) {
          errorMessage = '❌ Insufficient Balance\n\n' +
                        'You don\'t have enough STX for deployment fees.\n\n' +
                        '✅ Get testnet STX:\n' +
                        'Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet\n' +
                        'Paste your wallet address and request STX\n\n' +
                        'Required: ~0.3 STX for contract deployment';
        } else if (errorMessage.includes('nonce')) {
          errorMessage = '❌ Transaction Nonce Error\n\n' +
                        'Previous transaction still pending.\n\n' +
                        '✅ Solution:\n' +
                        'Wait 1-2 minutes for the previous transaction to confirm, then try again.';
        }

        throw new Error(errorMessage);
      }

      // Handle various response formats
      if (response) {
        // Check for error
        if (response.error) {
          console.error('Deployment error:', response.error);

          // Parse error message for common issues
          let errorMsg = response.error.message || JSON.stringify(response.error);

          if (errorMsg.includes('unable to parse') || errorMsg.includes('parse node response')) {
            errorMsg = 'Contract deployment failed - the blockchain node could not process the contract. This might be due to:\n' +
                      '• Invalid Clarity syntax in the generated contract\n' +
                      '• Contract code contains unsupported characters\n' +
                      '• Network connectivity issues\n\n' +
                      'Original error: ' + errorMsg;
          } else if (errorMsg.includes('broadcast')) {
            errorMsg = 'Failed to broadcast transaction - please check:\n' +
                      '• Your wallet has sufficient STX for fees (~0.3 STX)\n' +
                      '• You are connected to the testnet network\n' +
                      '• The blockchain node is accessible\n\n' +
                      'Original error: ' + errorMsg;
          }

          throw new Error(errorMsg);
        }

        // Extract transaction ID from various formats
        let txId = null;
        
        if (typeof response === 'string') {
          txId = response;
        } else if (response.result) {
          if (typeof response.result === 'string') {
            txId = response.result;
          } else if (response.result.txid) {
            txId = response.result.txid;
          } else if (response.result.txId) {
            txId = response.result.txId;
          }
        } else if (response.txid) {
          txId = response.txid;
        } else if (response.txId) {
          txId = response.txId;
        }

        if (txId) {
  
          return txId;
        }
      }

      // If we reach here, deployment was initiated but no txId

      return 'pending';
    } catch (error: any) {
      console.error('Error deploying contract:', error);

      // Better error messages
      if (error.message) {
        throw new Error(error.message);
      } else if (error.error && error.error.message) {
        throw new Error(error.error.message);
      } else {
        throw new Error('Failed to deploy contract. Please check your wallet and try again.');
      }
    }
  };

  const getBalance = async (): Promise<number> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    try {
      // Use Stacks API to get account balance
      const response = await fetch(`https://api.testnet.hiro.so/v2/accounts/${wallet.address}`);

      if (!response.ok) {
        console.error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
        return 0;
      }

      const accountData = await response.json();

      // Check for both balance and locked properties
      const balance = accountData.balance || accountData.stx?.balance || '0';

      if (balance) {
        // Balance is in microSTX, convert to STX
        const stxBalance = parseInt(balance) / 1000000;
        return stxBalance;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  };

  const callContractFunction = async (params: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: any[];
    onFinish?: (data: any) => void;
  }): Promise<any> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    try {


      // Get wallet provider
      let provider = null;
      const walletType = localStorage.getItem('wallet-type');

      // Try to use the wallet that was connected
      if (walletType === 'xverse' && typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        provider = window.XverseProviders.StacksProvider;
      } else if (typeof window !== 'undefined' && window.LeatherProvider) {
        provider = window.LeatherProvider;
      } else if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        provider = window.HiroWalletProvider;
      } else if (typeof window !== 'undefined' && window.XverseProviders?.StacksProvider) {
        provider = window.XverseProviders.StacksProvider;
      }

      if (!provider) {
        throw new Error('Wallet extension not found');
      }

      // Serialize Clarity values to hex strings (EXACT same as UpdateEventDetails)
      const serializedArgs = params.functionArgs.map(arg => {
        const serialized = serializeCV(arg);
        return `0x${Buffer.from(serialized).toString('hex')}`;
      });



      // Use EXACT same format as MintNFTButton and UpdateEventDetails
      const response = await provider.request('stx_callContract', {
        contract: `${params.contractAddress}.${params.contractName}`, // ✅ Combined string!
        functionName: params.functionName,
        functionArgs: serializedArgs, // ✅ Hex strings, not CV objects!
        network: 'testnet',
        postConditionMode: 'allow', // Allow any transfers
      });



      // Extract txId (same as MintNFTButton)
      let txId = null;
      if (typeof response === 'string') {
        txId = response;
      } else if (response?.result) {
        txId = typeof response.result === 'string' 
          ? response.result 
          : (response.result.txid || response.result.txId);
      } else if (response?.txid || response?.txId) {
        txId = response.txid || response.txId;
      }

      if (txId && params.onFinish) {
        params.onFinish({ txId });
      }

      return response;
    } catch (error: any) {
      console.error('❌ Error calling contract function:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    wallet,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    signTransaction,
    sendSTX,
    deployContract,
    getBalance,
    callContractFunction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};