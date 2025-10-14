/**
 * Stacks Utilities (Stackout Pattern)
 * Based on: https://github.com/Envoy-VC/stackout
 */

import { getAddressFromPublicKey } from '@stacks/transactions';

export type Network = 'testnet' | 'mainnet';

const apiBaseUrl = {
  mainnet: 'https://api.hiro.so/extended/v1',
  testnet: 'https://api.testnet.hiro.so/extended/v1',
};

export type StacksWallet = {
  address: string;
  publicKey: string;
};

/**
 * Get Stacks wallet from public key
 * Same as Stackout implementation
 */
export const getStacksWallet = (
  publicKey: string,
  network: Network = 'testnet',
): StacksWallet => {
  const address = getAddressFromPublicKey(publicKey, network);
  return { address, publicKey };
};

/**
 * Account Balance Response Type
 */
export type AccountBalanceResponse = {
  stx: {
    balance: string;
    total_sent: string;
    total_received: string;
    locked: string;
  };
  fungible_tokens: {
    [key: string]: {
      balance: string;
      total_sent: string;
      total_received: string;
    };
  };
  non_fungible_tokens: {
    [key: string]: {
      count: string;
      total_sent: string;
      total_received: string;
    };
  };
};

/**
 * Get user balances from Stacks API
 */
export const getUserBalances = async (
  address: string,
  network: Network = 'testnet',
) => {
  const url = `${apiBaseUrl[network]}/address/${address}/balances`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }
    
    const data: AccountBalanceResponse = await response.json();
    
    // STX balance (6 decimals)
    const stxValue = BigInt(data.stx.balance);
    const stxDecimals = 6;
    const stxFormatted = (Number(stxValue) / Math.pow(10, stxDecimals)).toFixed(2);
    
    // sBTC balance (8 decimals)
    const sbtcTokenKey = Object.keys(data.fungible_tokens || {}).find(key =>
      key.includes('sbtc') || key.includes('sBTC')
    );
    
    let sbtcValue = 0n;
    let sbtcFormatted = '0.0000';
    
    if (sbtcTokenKey) {
      sbtcValue = BigInt(data.fungible_tokens[sbtcTokenKey].balance);
      const sbtcDecimals = 8;
      sbtcFormatted = (Number(sbtcValue) / Math.pow(10, sbtcDecimals)).toFixed(4);
    }
    
    return {
      stx: {
        value: stxValue,
        decimals: stxDecimals,
        formatted: stxFormatted,
      },
      sbtc: {
        value: sbtcValue,
        decimals: 8,
        formatted: sbtcFormatted,
      },
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    return {
      stx: { value: 0n, decimals: 6, formatted: '0.00' },
      sbtc: { value: 0n, decimals: 8, formatted: '0.0000' },
    };
  }
};

/**
 * Format balance for display
 */
export const formatBalance = (value: bigint, decimals: number): string => {
  return (Number(value) / Math.pow(10, decimals)).toFixed(decimals === 6 ? 2 : 4);
};
