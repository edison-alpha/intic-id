import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Loader2, Ticket } from 'lucide-react';
import {
  sendPurchaseConfirmation,
  getStoredEmail,
  storeEmail,
  promptForEmail
} from '@/services/ticketPurchaseNotification';

interface MintNFTButtonProps {
  contractId: string;
  price: number; // in microSTX
  onSuccess?: () => void;
  disabled?: boolean;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
}

export const MintNFTButton: React.FC<MintNFTButtonProps> = ({
  contractId,
  price,
  onSuccess,
  disabled = false,
  eventName = 'Event',
  eventDate = 'TBA',
  eventTime = 'TBA',
  location = 'Venue TBA'
}) => {
  const { wallet } = useWallet();
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    if (!wallet?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    toast.loading('Opening wallet to mint NFT ticket...', { id: 'mint-nft' });

    try {
      const parts = contractId.split('.');
      const contractAddress = parts[0];
      const contractName = parts[1];
      
      if (!contractAddress || !contractName) {
        throw new Error('Invalid contract ID format');
      }

      // Check if user is the contract owner (for free minting)
      let isOwner = false;
      try {
        // Try to call get-owner or similar function to check ownership
        // This is optional and won't break if the function doesn't exist
        const ownerCheck = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${contractAddress}/${contractName}/get-owner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: wallet.address,
            arguments: []
          })
        });
        
        if (ownerCheck.ok) {
          const ownerData = await ownerCheck.json();
          if (ownerData.result) {
            // Parse the result to check if current user is owner
            // This is a simplified check - in production you'd parse the Clarity value properly
            const ownerAddress = ownerData.result.replace('0x', '').slice(-42); // Extract address from hex
            isOwner = ownerAddress.toLowerCase() === wallet.address.toLowerCase();
          }
        }
      } catch (e) {
        // Ignore errors - contract might not have this function
      }

      // Use wallet provider to call contract
      let provider = null;
      if (typeof window !== 'undefined') {
        if (window.LeatherProvider) {
          provider = window.LeatherProvider;
        } else if (window.HiroWalletProvider) {
          provider = window.HiroWalletProvider;
        } else {
          throw new Error('Please install Leather or Hiro wallet extension');
        }
      }

      if (!provider) {
        throw new Error('Wallet provider not found');
      }

      
      if (isOwner) {
        toast.loading('Minting ticket as event organizer (free)...', { id: 'mint-nft' });
      }
      
      // Call contract with Allow mode to permit the STX transfer
      const response = await provider.request('stx_callContract', {
        contract: `${contractAddress}.${contractName}`,
        functionName: 'mint-ticket',
        functionArgs: [],
        network: 'testnet',
        postConditionMode: 'allow', // String format: allow the STX transfer
      });

      toast.dismiss('mint-nft');

      // Handle successful response
      if (response) {
        // Extract txId from various possible response formats
        let txId = null;
        
        if (typeof response === 'string') {
          txId = response;
        } else if (response.result) {
          txId = typeof response.result === 'string' 
            ? response.result 
            : response.result.txid || response.result.txId;
        } else if (response.txid || response.txId) {
          txId = response.txid || response.txId;
        }
        
        if (txId) {
          const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;

          toast.success('NFT Ticket transaction submitted!', {
            description: `TxID: ${txId.slice(0, 8)}...${txId.slice(-8)}\nWait for confirmation (~30s)`,
            duration: 10000,
            action: {
              label: 'View on Explorer',
              onClick: () => window.open(explorerUrl, '_blank')
            }
          });

          // Send purchase confirmation email
          setTimeout(async () => {
            let userEmail = getStoredEmail();

            if (!userEmail) {
              // Prompt for email if not stored
              userEmail = await promptForEmail();
              if (userEmail) {
                storeEmail(userEmail);
              }
            }

            if (userEmail) {
              const ticketNumber = `#TKT-${txId.slice(0, 8).toUpperCase()}`;
              const priceInSTX = (price / 1000000).toFixed(4);

              const emailResult = await sendPurchaseConfirmation({
                userEmail,
                eventName,
                eventDate,
                eventTime,
                location,
                ticketNumber,
                price: priceInSTX,
                transactionId: txId,
                contractId
              });

              if (emailResult.success) {
                toast.success('Confirmation email sent!', {
                  description: `Check ${userEmail} for ticket details`,
                  duration: 5000
                });
              }
            }
          }, 2000);

          if (onSuccess) {
            // Wait longer before refresh to allow transaction to confirm
            setTimeout(onSuccess, 5000);
          }
        } else {
          console.warn('⚠️ No txId in response, but transaction may still be pending');
          toast.success('NFT Ticket transaction submitted!', {
            description: 'Check your wallet for transaction status',
            duration: 5000
          });
          if (onSuccess) {
            setTimeout(onSuccess, 5000);
          }
        }
      } else {
        throw new Error('No response from wallet');
      }
    } catch (error: any) {
      console.error('❌ Error minting NFT:', error);
      console.error('📋 Error details:', {
        message: error?.message,
        error: error?.error,
        code: error?.code,
        data: error?.data
      });
      
      // Log the full error object for debugging
      if (error?.error) {
        console.error('🔍 Full error object:', JSON.stringify(error.error, null, 2));
      }
      
      toast.dismiss('mint-nft');
      
      // Better error message extraction
      let errorMessage = 'Please try again';
      
      try {
        if (error?.error?.message) {
          // RPC error format
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error) {
          errorMessage = 'Transaction failed - check console for details';
        }
        
        // Log the full error for debugging
        console.error('🔍 Full error object:', JSON.stringify(error, null, 2));
        console.error('🔍 Error type:', typeof error);
        console.error('🔍 Error keys:', error ? Object.keys(error) : 'null');
        
        // Check if it's a Clarity error
        if (errorMessage.includes('(err u') || errorMessage.includes('err u')) {
          console.error('🚨 Clarity contract error detected:', errorMessage);
          // Extract error code
          const match = errorMessage.match(/err u(\d+)/);
          if (match) {
            const errorCode = parseInt(match[1] || '0');
            console.error('🚨 Error code:', errorCode);
            
            // Map common error codes
            if (errorCode === 1) {
              errorMessage = 'Transaction failed: Insufficient balance or sold out';
            } else if (errorCode === 2) {
              errorMessage = 'Transaction failed: Invalid recipient or transfer error';
            } else if (errorCode === 102) {
              errorMessage = 'Event is sold out';
            } else if (errorCode === 105) {
              errorMessage = 'Event has been cancelled';
            } else if (errorCode === 106) {
              errorMessage = 'Insufficient payment amount';
            } else {
              errorMessage = `Contract error (code: ${errorCode}) - check contract documentation`;
            }
          }
        }
      } catch (e) {
        errorMessage = 'An error occurred while minting';
      }
      
      // Check for specific errors
      const errorStr = errorMessage.toLowerCase();
      
      // User cancelled
      if (errorStr.includes('cancel') || errorStr.includes('reject') || errorStr.includes('denied')) {
        toast.info('Minting cancelled by user');
        return;
      }
      
      // Insufficient balance
      if (errorStr.includes('insufficient') || errorStr.includes('balance')) {
        toast.error('Insufficient STX balance', {
          description: `Need ${(price / 1000000).toFixed(2)} STX + ~0.15 STX for fees`,
          duration: 8000
        });
        return;
      }
      
      // Sold out
      if (errorStr.includes('sold') || errorStr.includes('err-sold-out')) {
        toast.error('Event sold out', {
          description: 'All tickets have been minted'
        });
        return;
      }
      
      // Generic error
      toast.error('Failed to mint NFT ticket', {
        description: errorMessage,
        duration: 8000
      });
    } finally {
      setIsMinting(false);
    }
  };

  const priceInSTX = (price / 1000000).toFixed(4);

  return (
    <Button
      onClick={handleMint}
      disabled={disabled || isMinting || !wallet}
      size="lg"
      className="w-full bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
    >
      {isMinting ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Minting...
        </>
      ) : (
        <>
          <Ticket className="w-5 h-5 mr-2" />
          Mint Ticket - {priceInSTX} STX
        </>
      )}
    </Button>
  );
};

export default MintNFTButton;
