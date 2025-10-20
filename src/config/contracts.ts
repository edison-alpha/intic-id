/**
 * Smart Contract Configuration
 * Contains all deployed contract addresses and ABIs
 */

export const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';

// Event Registry Contract V2 - Simplified (OpenSea-style)
export const EVENT_REGISTRY_CONTRACT = {
  testnet: {
    address: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.event-registry-v2',
    name: 'event-registry-v2',
  },
  mainnet: {
    address: '', // Update when deploying to mainnet
    name: 'event-registry-v2',
  },
};

// Helper to get current network config
export const getRegistryContract = () => {
  const config = NETWORK === 'mainnet'
    ? EVENT_REGISTRY_CONTRACT.mainnet
    : EVENT_REGISTRY_CONTRACT.testnet;

  if (!config.address) {
    console.warn('⚠️ Event Registry contract address not configured!');
    console.warn('Please deploy event-registry.clar and update VITE_REGISTRY_CONTRACT_ADDRESS');
  }

  return config;
};

// Contract Templates Version
export const CONTRACT_TEMPLATE_VERSION = '1.0.0';

// Platform Fee (basis points, e.g., 250 = 2.5%)
export const PLATFORM_FEE_BPS = 250;

// Deployment Costs
export const DEPLOYMENT_COSTS = {
  eventContract: 0.25, // STX
  registryFee: 0.01, // STX (registration fee - must match REGISTRATION-FEE in contract)
};

// SIP-009 NFT Standard Trait
export const SIP009_TRAIT = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait';
