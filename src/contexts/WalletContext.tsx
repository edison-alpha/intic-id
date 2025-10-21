import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { PostConditionMode } from '@stacks/transactions';
import { showConnect, openContractCall, openSTXTransfer, openContractDeploy } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

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
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.log('🔍 Starting wallet connection...');
        console.log('Available providers:', {
          XverseProviders: !!window.XverseProviders,
          StacksProvider: !!window.XverseProviders?.StacksProvider,
          LeatherProvider: !!window.LeatherProvider,
          HiroWalletProvider: !!window.HiroWalletProvider,
          btc: !!window.btc,
        });

        // Try Xverse Provider (mobile & desktop extension)
        if (window.XverseProviders?.StacksProvider) {
          try {
            console.log('🔄 Trying Xverse StacksProvider...');
            const response = await window.XverseProviders.StacksProvider.request('getAddresses', {
              purposes: ['payment'],
            });

            console.log('✅ Xverse response:', response);

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
                console.log('✅ Wallet connected via Xverse:', walletData);
                resolve();
                return;
              }
            }
          } catch (xverseError) {
            console.error('❌ Xverse provider error:', xverseError);
            // Continue to try other methods
          }
        }

        // Try Leather Provider
        if (window.LeatherProvider) {
          try {
            console.log('🔄 Trying Leather provider...');
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
                console.log('✅ Wallet connected via Leather:', walletData);
                resolve();
                return;
              }
            }
          } catch (leatherError) {
            console.error('❌ Leather provider error:', leatherError);
            // Continue to try other methods
          }
        }

        // Try Hiro Wallet Provider
        if (window.HiroWalletProvider) {
          try {
            console.log('🔄 Trying Hiro Wallet provider...');
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
                console.log('✅ Wallet connected via Hiro:', walletData);
                resolve();
                return;
              }
            }
          } catch (hiroError) {
            console.error('❌ Hiro provider error:', hiroError);
            // Continue to try @stacks/connect
          }
        }

        // Last resort: try @stacks/connect (may not work on all mobile browsers)
        console.log('🔄 Trying @stacks/connect as fallback...');
        try {
          showConnect({
            appDetails: {
              name: 'Intic',
              icon: window.location.origin + '/logo.png',
            },
            redirectTo: '/',
            onFinish: (data: any) => {
              console.log('✅ @stacks/connect response:', data);

              if (data.userSession && data.userSession.loadUserData) {
                const userData = data.userSession.loadUserData();
                const walletData = {
                  address: userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet,
                  publicKey: userData.profile.stxAddress.publicKey
                };

                setWallet(walletData);
                setIsWalletConnected(true);
                localStorage.setItem('wallet-address', JSON.stringify(walletData));
                console.log('✅ Wallet connected via @stacks/connect:', walletData);
                resolve();
              } else if (data.addresses) {
                const stxAddress = data.addresses.find((addr: any) => addr.symbol === 'STX');
                if (stxAddress) {
                  const walletData = {
                    address: stxAddress.address,
                    publicKey: stxAddress.publicKey
                  };

                  setWallet(walletData);
                  setIsWalletConnected(true);
                  localStorage.setItem('wallet-address', JSON.stringify(walletData));
                  console.log('✅ Wallet connected via @stacks/connect:', walletData);
                  resolve();
                }
              } else {
                reject(new Error('Unable to extract wallet address'));
              }
            },
            onCancel: () => {
              console.log('❌ User cancelled wallet connection');
              reject(new Error('User cancelled wallet connection'));
            },
          });
        } catch (connectError) {
          console.error('❌ @stacks/connect error:', connectError);
          reject(new Error('Failed to connect wallet. Please make sure you are using a Stacks wallet browser or have a wallet extension installed.'));
        }
      } catch (error) {
        console.error('❌ Fatal error in connectWallet:', error);
        reject(error);
      }
    });
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

    return new Promise<string>((resolve, reject) => {
      try {
        const amountInMicroSTX = Math.floor(amount * 1000000);

        openSTXTransfer({
          recipient,
          amount: amountInMicroSTX.toString(),
          memo: 'Transfer from Intic',
          network: new StacksTestnet(),
          appDetails: {
            name: 'Intic',
            icon: window.location.origin + '/logo.png',
          },
          onFinish: (data: any) => {
            console.log('✅ STX transfer successful:', data);
            const txId = data.txId || data.txid || 'Transaction submitted';
            resolve(txId);
          },
          onCancel: () => {
            console.log('❌ STX transfer cancelled');
            reject(new Error('User cancelled the transaction'));
          },
        });
      } catch (error: any) {
        console.error('❌ Error sending STX:', error);
        reject(error);
      }
    });
  };

  const deployContract = async (contractName: string, code: string): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected');
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

    return new Promise<string>((resolve, reject) => {
      try {
        openContractDeploy({
          contractName,
          codeBody: code,
          network: new StacksTestnet(),
          postConditionMode: PostConditionMode.Allow,
          appDetails: {
            name: 'Intic',
            icon: window.location.origin + '/logo.png',
          },
          onFinish: (data: any) => {
            console.log('✅ Contract deployment successful:', data);
            const txId = data.txId || data.txid || 'pending';
            resolve(txId);
          },
          onCancel: () => {
            console.log('❌ Contract deployment cancelled');
            reject(new Error('User cancelled contract deployment'));
          },
        });
      } catch (error: any) {
        console.error('❌ Error deploying contract:', error);

        // Better error messages
        let errorMessage = error?.message || 'Failed to deploy contract';

        if (errorMessage.includes('insufficient')) {
          errorMessage = 'Insufficient STX balance for deployment fees (~0.3 STX required). Get testnet STX: https://explorer.hiro.so/sandbox/faucet?chain=testnet';
        } else if (errorMessage.includes('nonce')) {
          errorMessage = 'Previous transaction still pending. Wait 1-2 minutes and try again.';
        }

        reject(new Error(errorMessage));
      }
    });
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

    return new Promise<any>((resolve, reject) => {
      try {
        console.log('🔍 Calling contract function:', {
          contract: `${params.contractAddress}.${params.contractName}`,
          function: params.functionName,
          args: params.functionArgs
        });

        openContractCall({
          contractAddress: params.contractAddress,
          contractName: params.contractName,
          functionName: params.functionName,
          functionArgs: params.functionArgs,
          network: new StacksTestnet(),
          postConditionMode: PostConditionMode.Allow,
          appDetails: {
            name: 'Intic',
            icon: window.location.origin + '/logo.png',
          },
          onFinish: (data: any) => {
            console.log('✅ Contract call successful:', data);

            // Call the custom onFinish callback if provided
            if (params.onFinish) {
              params.onFinish(data);
            }

            resolve(data);
          },
          onCancel: () => {
            console.log('❌ Contract call cancelled');
            reject(new Error('User cancelled the transaction'));
          },
        });
      } catch (error: any) {
        console.error('❌ Error calling contract function:', error);
        reject(error);
      }
    });
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