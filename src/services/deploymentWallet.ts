/**
 * Deployment Wallet Service
 * 
 * Manages platform's deployment wallet for contract deployment.
 * User wallets (Turnkey) are used for contract interactions only.
 * 
 * Setup:
 * 1. Generate deployment wallet (one-time)
 * 2. Add credentials to .env
 * 3. Fund the wallet from testnet faucet
 */

import { getAddressFromPrivateKey } from '@stacks/transactions';

export interface DeploymentWallet {
  privateKey: string;
  address: string;
}

/**
 * Get deployment wallet credentials from environment
 * 
 * To generate a new deployment wallet, run:
 * ```bash
 * node -e "const {makeRandomPrivKey,getAddressFromPrivateKey}=require('@stacks/transactions');const k=makeRandomPrivKey();console.log('VITE_DEPLOYMENT_PRIVATE_KEY='+k);console.log('VITE_DEPLOYMENT_ADDRESS='+getAddressFromPrivateKey(k,'testnet'));"
 * ```
 */
export const getDeploymentWallet = (): DeploymentWallet => {
  const privateKey = import.meta.env.VITE_DEPLOYMENT_PRIVATE_KEY;
  const address = import.meta.env.VITE_DEPLOYMENT_ADDRESS;
  
  if (!privateKey || !address) {
    console.error('❌ Deployment wallet not configured!');
    console.error('Please add to .env file:');
    console.error('VITE_DEPLOYMENT_PRIVATE_KEY=your_private_key_here');
    console.error('VITE_DEPLOYMENT_ADDRESS=your_address_here');
    console.error('');
    console.error('To generate, run:');
    console.error('node -e "const {makeRandomPrivKey,getAddressFromPrivateKey}=require(\'@stacks/transactions\');const k=makeRandomPrivKey();console.log(\'VITE_DEPLOYMENT_PRIVATE_KEY=\'+k);console.log(\'VITE_DEPLOYMENT_ADDRESS=\'+getAddressFromPrivateKey(k,\'testnet\'));"');
    
    throw new Error('Deployment wallet not configured. Check console for instructions.');
  }
  
  // Verify address matches private key
  const derivedAddress = getAddressFromPrivateKey(privateKey, 'testnet');
  if (derivedAddress !== address) {
    console.error('❌ Address mismatch!');
    console.error('Expected:', address);
    console.error('Derived from key:', derivedAddress);
    throw new Error('Deployment wallet configuration error: address mismatch');
  }
  
  return { privateKey, address };
};

/**
 * Check deployment wallet balance
 */
export const checkDeploymentWalletBalance = async (): Promise<{
  balance: number;
  sufficient: boolean;
  minimumRequired: number;
}> => {
  try {
    const { address } = getDeploymentWallet();
    
    const response = await fetch(
      `https://api.testnet.hiro.so/v2/accounts/${address}?proof=0`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    
    const data = await response.json();
    const balanceMicroSTX = parseInt(data.balance, 16);
    const balanceSTX = balanceMicroSTX / 1_000_000;
    
    const minimumRequired = 0.5; // Need at least 0.5 STX for deployments
    const sufficient = balanceSTX >= minimumRequired;
    
    if (!sufficient) {
      console.warn('⚠️ Deployment wallet balance low:', balanceSTX, 'STX');
      console.warn('Please fund from faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet');
    }
    
    return {
      balance: balanceSTX,
      sufficient,
      minimumRequired,
    };
  } catch (error: any) {
    console.error('Error checking deployment wallet balance:', error);
    throw error;
  }
};
