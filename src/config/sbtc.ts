// sBTC Configuration for Stacks Testnet
export const SBTC_CONFIG = {
  network: {
    coreApiUrl: 'https://api.testnet.hiro.so',
    chainId: 2147483648, // Testnet chain ID
  },
  
  // sBTC Contract Address on Testnet
  // This is a placeholder - replace with actual testnet contract
  sbtcContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  sbtcContractName: 'sbtc-token',
  
  // Conversion rates (mock for demo)
  sbtcToUsd: 0.00003, // 1 sBTC = ~$30,000 USD (mock)
  stxToSbtc: 0.00001, // Conversion rate
  
  // Testnet explorer
  explorerUrl: 'https://explorer.hiro.so/txid',
};

// Helper functions
export const satsToBTC = (sats: number): number => {
  return sats / 100000000;
};

export const btcToSats = (btc: number): number => {
  return Math.floor(btc * 100000000);
};

export const sbtcToUsd = (sbtc: number): string => {
  return (sbtc * SBTC_CONFIG.sbtcToUsd * 100000000).toFixed(2);
};

export const formatSBTC = (sats: number): string => {
  return satsToBTC(sats).toFixed(8);
};
