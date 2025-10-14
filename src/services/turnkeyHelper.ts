/**
 * Turnkey Wallet Helper
 * Get private key for Stacks transactions
 */

import { makeRandomPrivKey, getAddressFromPrivateKey } from '@stacks/transactions';

/**
 * For demo/hackathon: Get or create a private key for the user
 * In production, this should use Turnkey's secure signing API
 * 
 * WARNING: Storing private keys in localStorage is NOT secure for production!
 * This is only for hackathon/demo purposes.
 */
export const getOrCreatePrivateKey = (address: string): string => {
  const storageKey = `pulse_private_key_${address}`;
  
  // Check if we already have a key for this address
  let privateKey = localStorage.getItem(storageKey);
  
  if (!privateKey) {
    // CRITICAL: Ask user to import their private key
    // Because generating random key won't match their Turnkey address
    console.error('❌ CRITICAL: No private key found for address:', address);
    console.error('🔑 You need to import your private key from Turnkey wallet');
    console.error('📝 For now, using a temporary key - THIS WILL NOT WORK!');
    
    // For testing ONLY - this creates a DIFFERENT address
    privateKey = makeRandomPrivKey();
    
    // Verify what address this key generates
    const generatedAddress = getAddressFromPrivateKey(privateKey, 'testnet' as any);
    console.warn('⚠️  Generated address:', generatedAddress);
    console.warn('⚠️  Your wallet address:', address);
    console.warn('❌ THESE DO NOT MATCH! Transaction will fail or send from wrong address!');
    
    // Store it (again, NOT secure for production!)
    localStorage.setItem(storageKey, privateKey);
  } else {
    // Verify the stored key matches the address
    const derivedAddress = getAddressFromPrivateKey(privateKey, 'testnet' as any);
    if (derivedAddress !== address) {
      console.error('❌ MISMATCH: Stored private key does not match wallet address!');
      console.error('Expected:', address);
      console.error('Got:', derivedAddress);
      throw new Error('Private key mismatch! Please clear localStorage and import correct key.');
    }
  }
  
  return privateKey;
};

/**
 * Manually set private key for an address
 * Use this to import private key from Turnkey or other wallet
 */
export const setPrivateKeyForAddress = (address: string, privateKey: string): void => {
  const storageKey = `pulse_private_key_${address}`;
  
  // Verify the private key matches the address
  const derivedAddress = getAddressFromPrivateKey(privateKey, 'testnet' as any);
  
  if (derivedAddress !== address) {
    throw new Error(
      `Private key mismatch!\nExpected address: ${address}\nDerived address: ${derivedAddress}`
    );
  }
  
  localStorage.setItem(storageKey, privateKey);
  console.log('✅ Private key set for address:', address);
};

/**
 * Check if user has sufficient balance for contract deployment
 */
export const checkDeploymentBalance = async (
  address: string,
  requiredSTX: number = 0.5
): Promise<{ sufficient: boolean; balance: number; required: number }> => {
  try {
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/balances`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }

    const data = await response.json();
    const balanceInSTX = parseInt(data.stx.balance) / 1_000_000;

    return {
      sufficient: balanceInSTX >= requiredSTX,
      balance: balanceInSTX,
      required: requiredSTX,
    };
  } catch (error) {
    console.error('Error checking balance:', error);
    throw error;
  }
};
