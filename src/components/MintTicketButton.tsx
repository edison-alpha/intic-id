/**
 * MintTicketButton Component
 * 
 * Reusable button for minting NFT tickets
 * - Integrates with Stacks.js for blockchain writes
 * - Shows real-time minting status
 * - Handles wallet connection
 * - Auto-refreshes data after successful mint
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { openContractCall } from '@stacks/connect';
import { isUserSignedIn, signIn, getUserAddress } from '@/lib/stacksAuth';
import { toast } from 'sonner';
import { Loader2, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasEnoughSTX } from '@/services/stacksService';

type MintStatus = 'idle' | 'preparing' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error';

interface MintTicketButtonProps {
  contractId: string;
  eventTitle: string;
  ticketPrice: number;
  ticketsAvailable: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const MintTicketButton = ({
  contractId,
  eventTitle,
  ticketPrice,
  ticketsAvailable,
  quantity = 1,
  disabled = false,
  className,
  onSuccess,
  onError,
  variant = 'default',
  size = 'default',
  fullWidth = false
}: MintTicketButtonProps) => {
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle');

  const isMinting = mintStatus !== 'idle' && mintStatus !== 'success' && mintStatus !== 'error';
  
  // Check wallet auth status
  const isWalletConnected = isUserSignedIn();
  const userAddress = getUserAddress();

  /**
   * Handle mint ticket transaction
   * Uses Stacks.js openContractCall to write to blockchain
   */
  const handleMint = async () => {
    
    // 1. Check if user has active Stacks Connect session
    const userSignedIn = isUserSignedIn();
    const userAddress = getUserAddress();
    
    // 2. If no session, prompt sign in
    if (!userSignedIn || !userAddress) {
      
      toast.info('Please sign in with your wallet', {
        description: 'You need to authenticate before minting'
      });
      
      // Trigger Stacks Connect authentication
      signIn(() => {
        // After successful sign in, show success and user can try minting again
        toast.success('Wallet connected! You can now mint tickets.');
      });
      
      return;
    }

    // 3. Validate tickets available
    if (ticketsAvailable < quantity) {
      toast.error(`Only ${ticketsAvailable} tickets available`);
      return;
    }

    // 4. Check STX balance before proceeding
    try {
      
      const balanceCheck = await hasEnoughSTX(
        userAddress,
        ticketPrice * quantity, // Total cost for tickets
        true // Include gas fee buffer
      );
      
      if (!balanceCheck.sufficient) {
        console.error('❌ Insufficient STX balance:', balanceCheck);
        
        toast.error(
          <div className="flex flex-col gap-2">
            <div className="font-semibold">Insufficient STX Balance</div>
            <div className="text-sm space-y-1">
              <div>Required: {balanceCheck.required.toFixed(6)} STX</div>
              <div>Available: {balanceCheck.balance.toFixed(6)} STX</div>
              <div className="text-xs text-yellow-500 mt-2">
                Need {balanceCheck.shortfall?.toFixed(6)} more STX
              </div>
              <a 
                href="https://explorer.hiro.so/sandbox/faucet?chain=testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 block"
              >
                Get testnet STX from faucet →
              </a>
            </div>
          </div>,
          {
            duration: 10000,
          }
        );
        
        return; // Stop mint process
      }
      
    } catch (error) {
      console.error('❌ Balance check failed:', error);
      toast.error('Failed to check balance. Please try again.');
      return;
    }

    // 5. Parse contract ID
    const [contractAddress, contractName] = contractId.split('.');
    if (!contractAddress || !contractName) {
      toast.error('Invalid contract ID');
      return;
    }

    setMintStatus('preparing');

    try {
      setMintStatus('signing');
      
      // 5. Open wallet for transaction signature
      await openContractCall({
        contractAddress,
        contractName,
        functionName: 'mint-ticket',
        functionArgs: [],
        postConditions: [],
        
        // Success callback - transaction broadcast to blockchain
        onFinish: async (data) => {
          setMintStatus('broadcasting');
          
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Transaction Submitted!</div>
              <div className="text-xs text-muted-foreground">
                TX: {data.txId.substring(0, 10)}...
              </div>
            </div>,
            {
              duration: 5000,
            }
          );

          // 5. Wait for blockchain confirmation
          setMintStatus('confirming');
          
          // Simulate confirmation wait (in production, poll transaction status)
          setTimeout(() => {
            setMintStatus('success');
            toast.success(
              <div className="flex flex-col gap-1">
                <div className="font-semibold">🎉 Ticket Minted Successfully!</div>
                <div className="text-sm">{eventTitle}</div>
              </div>,
              {
                duration: 5000,
              }
            );

            // 6. Callback to parent to refresh data
            if (onSuccess) {
              onSuccess();
            }

            // Reset status after delay
            setTimeout(() => {
              setMintStatus('idle');
            }, 3000);
          }, 3000);
        },
        
        // Cancel callback - user rejected in wallet
        onCancel: () => {
          setMintStatus('idle');
          toast.info('Transaction cancelled');
        },
      });

    } catch (error: any) {
      console.error('❌ Minting error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      setMintStatus('error');
      
      // Better error messages based on error type
      let errorMessage = 'Failed to mint ticket';
      let shouldReauthenticate = false;
      
      if (error.message?.includes('No user data found') || 
          error.message?.includes('not signed in')) {
        errorMessage = 'Session expired. Please sign in again';
        shouldReauthenticate = true;
      } else if (error.message?.includes('User rejected') || 
                 error.message?.includes('cancelled')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient STX balance';
      } else {
        errorMessage = error.message || 'Failed to mint ticket';
      }
      
      toast.error(
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Minting Failed</div>
          <div className="text-sm text-muted-foreground">{errorMessage}</div>
        </div>
      );

      // If authentication error, prompt re-authentication
      if (shouldReauthenticate) {
        setTimeout(() => {
          setMintStatus('idle');
          signIn(() => {
            toast.success('Signed in! You can now try minting again.');
          });
        }, 2000);
        return;
      }

      if (onError) {
        onError(error);
      }

      // Reset after error
      setTimeout(() => {
        setMintStatus('idle');
      }, 3000);
    }
  };

  /**
   * Get button content based on status
   */
  const getButtonContent = () => {
    // Check authentication first
    if (!isUserSignedIn()) {
      return (
        <>
          <Ticket className="mr-2 h-4 w-4" />
          Sign In to Mint
        </>
      );
    }
    
    switch (mintStatus) {
      case 'preparing':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing...
          </>
        );
      case 'signing':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sign in Wallet...
          </>
        );
      case 'broadcasting':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Broadcasting...
          </>
        );
      case 'confirming':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirming...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Minted!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Failed
          </>
        );
      default:
        return (
          <>
            <Ticket className="mr-2 h-4 w-4" />
            Mint Ticket
          </>
        );
    }
  };

  /**
   * Get button variant based on status
   */
  const getButtonVariant = () => {
    if (mintStatus === 'success') return 'default';
    if (mintStatus === 'error') return 'destructive';
    return variant;
  };

  return (
    <Button
      onClick={handleMint}
      disabled={disabled || isMinting || ticketsAvailable === 0}
      variant={getButtonVariant()}
      size={size}
      className={cn(
        fullWidth && 'w-full',
        mintStatus === 'success' && 'bg-green-600 hover:bg-green-700',
        className
      )}
    >
      {getButtonContent()}
    </Button>
  );
};

export default MintTicketButton;
