/**
 * Hook to get public key from Turnkey wallet
 * This hook helps extract the public key from Turnkey's wallet accounts
 */

import { useEffect, useState } from 'react';
import { useTurnkey, AuthState } from '@turnkey/react-wallet-kit';

interface PublicKeyResult {
  publicKey: string | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useTurnkeyPublicKey = (): PublicKeyResult => {
  const { authState, wallets } = useTurnkey();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authState !== AuthState.Authenticated || !wallets || wallets.length === 0) {
      setPublicKey(null);
      setAddress(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    
    try {
      // Find wallet with SECP256K1 curve (Stacks compatible)
      const stacksWallet = wallets.find(w => 
        w.accounts?.some(acc => 
          acc.curve === 'CURVE_SECP256K1' && 
          (acc.addressFormat === 'ADDRESS_FORMAT_COMPRESSED' || 
           acc.addressFormat === 'ADDRESS_FORMAT_UNCOMPRESSED')
        )
      );

      if (!stacksWallet) {
        setError('No Stacks-compatible wallet found');
        setIsLoading(false);
        return;
      }

      const stacksAccount = stacksWallet.accounts?.find(
        acc => acc.curve === 'CURVE_SECP256K1'
      );

      if (stacksAccount) {
        // Try to extract public key from various possible properties
        const pubKey = 
          stacksAccount.publicKey || 
          (stacksAccount as any).public_key || 
          (stacksAccount as any).pubKey ||
          (stacksAccount as any).pub_key ||
          null;

        setPublicKey(pubKey);
        setAddress(stacksAccount.address || null);
        
        if (!pubKey && !stacksAccount.address) {
          setError('No public key or address found in wallet account');
        } else {
          setError(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error extracting public key');
      console.error('Error in useTurnkeyPublicKey:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authState, wallets]);

  return { publicKey, address, isLoading, error };
};
