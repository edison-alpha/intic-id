import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { serializeCV } from '@stacks/transactions';

// Declare wallet provider types
declare global {
  interface Window {
    LeatherProvider?: any;
    HiroWalletProvider?: any;
    XverseProvider?: any;
    btc?: any;
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
  isMobile: boolean;
  connectMobileWallet: (walletType: 'xverse' | 'leather-mobile') => Promise<void>;
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
  const [isMobile, setIsMobile] = useState(false);
  // Handle mobile wallet callback
  useEffect(() => {
    const handleMobileWalletCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const address = urlParams.get('address');
      const publicKey = urlParams.get('publicKey');

      if (address) {
        const walletData: { address: string; publicKey?: string } = {
          address
        };

        if (publicKey) {
          walletData.publicKey = publicKey;
        }

        setWallet(walletData);
        setIsWalletConnected(true);
        localStorage.setItem('wallet-address', JSON.stringify(walletData));

        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        console.log('✅ Mobile wallet connected:', walletData);
      }
    };

    handleMobileWalletCallback();
  }, []);

  // Detect mobile device and Xverse
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Check for Xverse in-app browser
  useEffect(() => {
    const checkXverseInApp = () => {
      // Check if we're in Xverse's webview
      const isXverseWebview = navigator.userAgent.includes('Xverse') ||
                             window.location.search.includes('xverse') ||
                             (window as any).webkit?.messageHandlers?.xverse;

      if (isXverseWebview) {
        console.log('📱 Detected Xverse in-app browser');

        // Try to inject Xverse provider if not already available
        if (typeof window !== 'undefined' && !(window as any).XverseProvider) {
          (window as any).XverseProvider = {
            request: async (method: string, params?: any) => {
              return new Promise((resolve, reject) => {
                // Use Xverse's postMessage API
                const messageId = Date.now().toString();

                const message = {
                  id: messageId,
                  method,
                  params: params || {}
                };

                const handleResponse = (event: MessageEvent) => {
                  if (event.data && event.data.id === messageId) {
                    window.removeEventListener('message', handleResponse);
                    if (event.data.error) {
                      reject(new Error(event.data.error));
                    } else {
                      resolve(event.data.result);
                    }
                  }
                };

                window.addEventListener('message', handleResponse);

                // Send message to Xverse
                if ((window as any).webkit?.messageHandlers?.xverse) {
                  (window as any).webkit.messageHandlers.xverse.postMessage(message);
                } else {
                  window.parent.postMessage(message, '*');
                }

                // Timeout after 30 seconds
                setTimeout(() => {
                  window.removeEventListener('message', handleResponse);
                  reject(new Error('Xverse connection timeout'));
                }, 30000);
              });
            }
          };
        }
      }
    };

    checkXverseInApp();
  }, []);

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
      // Check if we're on mobile first
      if (isMobile) {
        // On mobile, try Xverse in-app browser API first
        if (typeof window !== 'undefined' && window.XverseProvider) {
          try {
            const response = await window.XverseProvider.request('getAddresses');
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
                return;
              }
            }
          } catch (error) {
            console.log('Xverse in-app API not available, trying other methods');
          }
        }

        // Check if we're in Xverse webview (when accessed via explore)
        const isXverseWebview = navigator.userAgent.includes('Xverse') ||
                               window.location.search.includes('xverse') ||
                               (window as any).webkit?.messageHandlers?.xverse;

        if (isXverseWebview) {
          console.log('📱 Detected Xverse webview, trying direct connection...');
          try {
            // Try using the injected XverseProvider first
            if ((window as any).XverseProvider) {
              const response = await (window as any).XverseProvider.request('getAddresses');
              console.log('📱 Xverse provider response:', response);

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
                  console.log('✅ Connected via Xverse webview');
                  return;
                }
              }
            }

            // Try direct postMessage to Xverse
            const response = await new Promise((resolve, reject) => {
              const messageId = 'xverse_connect_' + Date.now();

              const message = {
                id: messageId,
                method: 'getAddresses',
                params: {}
              };

              const handleResponse = (event: MessageEvent) => {
                if (event.data && event.data.id === messageId) {
                  window.removeEventListener('message', handleResponse);
                  resolve(event.data);
                }
              };

              window.addEventListener('message', handleResponse);

              // Send to Xverse
              if ((window as any).webkit?.messageHandlers?.xverse) {
                (window as any).webkit.messageHandlers.xverse.postMessage(message);
              } else {
                window.parent.postMessage(message, '*');
              }

              setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                reject(new Error('Xverse connection timeout'));
              }, 10000);
            });

            console.log('📱 Xverse direct response:', response);

            // Process the response similar to extension
            const responseData = response as any;
            if (responseData && responseData.result && responseData.result.addresses) {
              const addresses = responseData.result.addresses;
              const stxAddress = addresses.find((addr: any) => addr.symbol === 'STX');

              if (stxAddress) {
                const walletData = {
                  address: stxAddress.address,
                  publicKey: stxAddress.publicKey
                };

                setWallet(walletData);
                setIsWalletConnected(true);
                localStorage.setItem('wallet-address', JSON.stringify(walletData));
                console.log('✅ Connected via Xverse webview');
                return;
              }
            }
          } catch (error) {
            console.log('❌ Xverse webview connection failed:', error);
          }
        }

        // If Xverse in-app API fails, show mobile wallet options
        throw new Error('MOBILE_WALLET_REQUIRED');
      }

      // Desktop: Try LeatherProvider first (new API)
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
            return;
          }
        }
      }

      // Try Hiro Wallet
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
            return;
          }
        }
      }

      // Fallback: Show instruction to install wallet
      throw new Error(
        'Please install Hiro Wallet or Leather wallet extension.\n\n' +
        'Download from:\n' +
        '• Hiro Wallet: https://wallet.hiro.so/wallet/install-web\n' +
        '• Leather: https://leather.io/install-extension'
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

      // Try XverseProvider first (for mobile)
      if (typeof window !== 'undefined' && window.XverseProvider) {
        provider = window.XverseProvider;
      } else if (typeof window !== 'undefined' && window.LeatherProvider) {
        provider = window.LeatherProvider;
      } else if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        provider = window.HiroWalletProvider;
      }

      if (!provider) {
        throw new Error('Wallet extension not found. Please make sure Hiro Wallet, Leather, or Xverse is installed and unlocked.');
      }

      // Use stx_transferStx method (correct Leather API)
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

      // Try XverseProvider first (for mobile)
      if (typeof window !== 'undefined' && window.XverseProvider) {
        provider = window.XverseProvider;
      } else if (typeof window !== 'undefined' && window.LeatherProvider) {
        provider = window.LeatherProvider;
      } else if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        provider = window.HiroWalletProvider;
      }

      if (!provider) {
        throw new Error('Wallet extension not found. Please make sure Hiro Wallet or Leather is installed and unlocked.');
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


      // Get wallet provider (same as MintNFTButton)
      let provider = null;
      if (typeof window !== 'undefined' && window.XverseProvider) {
        provider = window.XverseProvider;
      } else if (typeof window !== 'undefined' && window.LeatherProvider) {
        provider = window.LeatherProvider;
      } else if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        provider = window.HiroWalletProvider;
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

  const connectMobileWallet = async (walletType: 'xverse' | 'leather-mobile') => {
    try {
      const callbackUrl = encodeURIComponent(`${window.location.origin}?wallet=${walletType}`);

      if (walletType === 'xverse') {
        // Xverse deep linking with callback
        const xverseUrl = `xverse://connect?callback=${callbackUrl}&network=testnet&dapp=intic`;
        console.log('🔗 Opening Xverse:', xverseUrl);

        // Try deep linking first
        window.location.href = xverseUrl;

        // Show instructions for manual connection
        setTimeout(() => {
          if (!isWalletConnected) {
            alert(`Xverse tidak terdeteksi. Silakan:\n\n1. Install Xverse dari App Store/Play Store\n2. Buka Xverse dan scan QR code\n3. Atau buka link ini di Xverse: ${xverseUrl}`);
          }
        }, 3000);

      } else if (walletType === 'leather-mobile') {
        // Leather mobile deep linking
        const leatherUrl = `leather://connect?callback=${callbackUrl}&network=testnet`;
        console.log('🔗 Opening Leather:', leatherUrl);

        window.location.href = leatherUrl;

        setTimeout(() => {
          if (!isWalletConnected) {
            alert(`Leather mobile tidak terdeteksi. Silakan:\n\n1. Install Leather dari App Store/Play Store\n2. Buka Leather dan scan QR code\n3. Atau buka link ini di Leather: ${leatherUrl}`);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Mobile wallet connection failed:', error);
      throw new Error('Gagal menghubungkan wallet mobile. Silakan coba lagi.');
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
    isMobile,
    connectMobileWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};