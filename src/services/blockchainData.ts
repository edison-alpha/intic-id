/**
 * Blockchain Data Service (Updated to use Express Server)
 * Fetches real data from Stacks blockchain via server optimization
 */

import {
  callReadOnlyFunction,
  cvToValue,
  uintCV,
  standardPrincipalCV
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { cachedFetch, requestManager } from '@/utils/requestManager';

const TESTNET = StacksTestnet;
const MAINNET = StacksMainnet;
const SERVER_BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8000';

// Contract metadata storage (localStorage for now, can be replaced with backend)
export interface DeployedContract {
  contractAddress: string;
  contractName: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  description?: string;
  category: string;
  image?: string;
  ticketCategories: Array<{
    id: string;
    name: string;
    price: string;
    supply: string;
  }>;
  deployedAt: number;
  deployer: string;
  txId: string;
}

/**
 * Save deployed contract to localStorage
 */
export const saveDeployedContract = (contract: DeployedContract): void => {
  try {
    const existingContracts = getDeployedContracts();
    existingContracts.push(contract);
    localStorage.setItem('deployed_contracts', JSON.stringify(existingContracts));
  } catch (error) {
    console.error('❌ Failed to save contract:', error);
  }
};

/**
 * Get all deployed contracts from storage
 */
export const getDeployedContracts = (): DeployedContract[] => {
  try {
    const stored = localStorage.getItem('deployed_contracts');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Failed to load contracts:', error);
    return [];
  }
};

/**
 * Get single contract by address and name
 */
export const getContractById = (contractAddress: string, contractName: string): DeployedContract | null => {
  const contracts = getDeployedContracts();
  return contracts.find(c => 
    c.contractAddress === contractAddress && c.contractName === contractName
  ) || null;
};

/**
 * Fetch contract data from blockchain
 */
export const fetchContractData = async (
  contractAddress: string,
  contractName: string,
  isTestnet: boolean = true
): Promise<any> => {
  const network = isTestnet ? TESTNET : MAINNET;
  
  try {
    // Read contract variables
    const [
      eventNameResult,
      eventDateResult,
      ticketPriceResult,
      maxSupplyResult,
      lastTokenIdResult,
      isSaleActiveResult
    ] = await Promise.all([
      callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-event-name',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      }).catch(() => null),
      
      callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-event-date',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      }).catch(() => null),
      
      callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-ticket-price',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      }).catch(() => null),
      
      callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-max-supply',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      }).catch(() => null),
      
      callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-last-token-id',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      }).catch(() => null),
      
      callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'is-sale-active',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      }).catch(() => null),
    ]);

    return {
      eventName: eventNameResult ? cvToValue(eventNameResult) : 'Unknown Event',
      eventDate: eventDateResult ? cvToValue(eventDateResult) : 'TBA',
      ticketPrice: ticketPriceResult ? Number(cvToValue(ticketPriceResult)) / 1000000 : 0,
      maxSupply: maxSupplyResult ? Number(cvToValue(maxSupplyResult)) : 0,
      sold: lastTokenIdResult ? Number(cvToValue(lastTokenIdResult)) : 0,
      isSaleActive: isSaleActiveResult ? cvToValue(isSaleActiveResult) : false,
      available: maxSupplyResult && lastTokenIdResult 
        ? Number(cvToValue(maxSupplyResult)) - Number(cvToValue(lastTokenIdResult))
        : 0
    };
  } catch (error) {
    console.error('❌ Failed to fetch contract data:', error);
    throw error;
  }
};

/**
 * Fetch user's NFT tickets from blockchain
 */
export const fetchUserNFTs = async (
  userAddress: string,
  contractAddress: string,
  contractName: string,
  isTestnet: boolean = true
): Promise<number[]> => {
  const network = isTestnet ? TESTNET : MAINNET;
  
  try {
    // Query contract for owned tokens
    // This assumes contract has get-owner function
    // We'll need to check multiple token IDs
    const contractData = await fetchContractData(contractAddress, contractName, isTestnet);
    const maxTokenId = contractData.sold;
    
    // Check ownership for each token ID
    const ownershipChecks = [];
    for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
      ownershipChecks.push(
        callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-owner',
          functionArgs: [uintCV(tokenId)],
          network,
          senderAddress: contractAddress,
        }).then(result => {
          try {
            const owner = cvToValue(result);
            // Check if owner matches userAddress
            if (owner?.value === userAddress) {
              return tokenId;
            }
          } catch (err) {
            // Token might not exist yet
          }
          return null;
        }).catch(() => null)
      );
    }
    
    const results = await Promise.all(ownershipChecks);
    return results.filter(id => id !== null) as number[];
  } catch (error) {
    console.error('❌ Failed to fetch user NFTs:', error);
    return [];
  }
};

/**
 * Fetch user's transaction history
 */
export const fetchUserTransactions = async (
  userAddress: string,
  isTestnet: boolean = true
): Promise<any[]> => {
  try {
    // Try using the server endpoint first
    const url = `${SERVER_BASE}/api/hiro/address/${userAddress}/transactions?limit=50`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.results || [];
    } else {
      console.log(`Server endpoint failed (${response.status}), falling back to direct API call`);
    }
  } catch (serverError) {
    console.log('Server endpoint failed, falling back to direct API call:', serverError);
  }

  // Fallback to direct API call
  const apiUrl = isTestnet
    ? 'https://api.testnet.hiro.so'
    : 'https://api.hiro.so';

  try {
    const data = await cachedFetch<any>(
      `${apiUrl}/extended/v1/address/${userAddress}/transactions?limit=50`,
      {},
      30000 // 30s cache for user transactions
    );
    return data.results || [];
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error);
    return [];
  }
};

/**
 * Fetch STX balance
 */
export const fetchSTXBalance = async (
  address: string,
  isTestnet: boolean = true
): Promise<number> => {
  try {
    // Try using the server endpoint first
    const url = `${SERVER_BASE}/api/stacks/address/${address}/balance`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.stx.balance_formatted || 0; // Return formatted balance from server
    } else {
      console.log(`Server endpoint failed (${response.status}), falling back to direct API call`);
    }
  } catch (serverError) {
    console.log('Server endpoint failed, falling back to direct API call:', serverError);
  }

  // Fallback to direct API call
  const apiUrl = isTestnet
    ? 'https://api.testnet.hiro.so'
    : 'https://api.hiro.so';

  try {
    const data = await cachedFetch<any>(
      `${apiUrl}/extended/v1/address/${address}/balances`,
      {},
      15000 // 15s cache for balance
    );
    return Number(data.stx.balance) / 1000000; // Convert microSTX to STX
  } catch (error) {
    console.error('❌ Failed to fetch STX balance:', error);
    return 0;
  }
};

/**
 * Fetch sBTC balance (assuming sBTC is a SIP-010 token)
 */
export const fetchSBTCBalance = async (
  address: string,
  sbtcContractAddress: string,
  sbtcContractName: string,
  isTestnet: boolean = true
): Promise<number> => {
  const network = isTestnet ? TESTNET : MAINNET;
  
  try {
    const result = await callReadOnlyFunction({
      contractAddress: sbtcContractAddress,
      contractName: sbtcContractName,
      functionName: 'get-balance',
      functionArgs: [standardPrincipalCV(address)],
      network,
      senderAddress: address,
    });
    
    const balance = cvToValue(result);
    return Number(balance) / 100000000; // Convert sats to BTC
  } catch (error) {
    console.error('❌ Failed to fetch sBTC balance:', error);
    return 0;
  }
};

/**
 * Get all events (deployed contracts + metadata)
 */
export const getAllEvents = async (isTestnet: boolean = true): Promise<any[]> => {
  const deployedContracts = getDeployedContracts();
  
  // Fetch on-chain data for each contract
  const eventsWithData = await Promise.all(
    deployedContracts.map(async (contract) => {
      try {
        const onChainData = await fetchContractData(
          contract.contractAddress,
          contract.contractName,
          isTestnet
        );
        
        return {
          id: `${contract.contractAddress}.${contract.contractName}`,
          title: contract.eventName,
          date: contract.eventDate,
          time: contract.eventTime || 'TBA',
          location: contract.venue || 'TBA',
          category: contract.category,
          price: onChainData.ticketPrice,
          available: onChainData.available,
          total: onChainData.maxSupply,
          image: contract.image || '/placeholder.svg',
          contractAddress: contract.contractAddress,
          contractName: contract.contractName,
          description: contract.description,
          ticketCategories: contract.ticketCategories,
          isSaleActive: onChainData.isSaleActive,
          deployer: contract.deployer,
          deployedAt: contract.deployedAt,
          txId: contract.txId
        };
      } catch (error) {
        console.error(`Failed to fetch data for ${contract.contractName}:`, error);
        // Return with stored data only
        return {
          id: `${contract.contractAddress}.${contract.contractName}`,
          title: contract.eventName,
          date: contract.eventDate,
          time: contract.eventTime || 'TBA',
          location: contract.venue || 'TBA',
          category: contract.category,
          price: 0.001,
          available: 0,
          total: 0,
          image: contract.image || '/placeholder.svg',
          contractAddress: contract.contractAddress,
          contractName: contract.contractName,
          error: true
        };
      }
    })
  );
  
  return eventsWithData;
};

/**
 * Get user's tickets (owned NFTs with metadata)
 */
export const getUserTickets = async (
  userAddress: string,
  isTestnet: boolean = true
): Promise<any[]> => {
  const deployedContracts = getDeployedContracts();
  const userTickets: any[] = [];
  
  // Check each contract for owned NFTs
  for (const contract of deployedContracts) {
    try {
      const ownedTokenIds = await fetchUserNFTs(
        userAddress,
        contract.contractAddress,
        contract.contractName,
        isTestnet
      );
      
      if (ownedTokenIds.length > 0) {
        // Add each owned token as a ticket
        ownedTokenIds.forEach(tokenId => {
          userTickets.push({
            id: tokenId,
            eventName: contract.eventName,
            eventDate: contract.eventDate,
            eventTime: contract.eventTime || 'TBA',
            location: contract.venue || 'TBA',
            image: contract.image || '/placeholder.svg',
            ticketNumber: `#NFT-${tokenId.toString().padStart(6, '0')}`,
            contractAddress: contract.contractAddress,
            contractName: contract.contractName,
            status: 'active', // Can be extended with usage tracking
            quantity: 1,
            purchaseDate: 'On-chain' // Can fetch from transaction history
          });
        });
      }
    } catch (error) {
      // Silently handle errors for individual contracts
    }
  }
  
  return userTickets;
};

/**
 * Fetch user's rewards from proof-of-fandom contract
 */
export const fetchUserRewards = async (
  userAddress: string,
  fandomContractAddress: string,
  fandomContractName: string,
  isTestnet: boolean = true
): Promise<{
  totalBadges: number;
  totalExperience: number;
  tierLevel: number;
  achievements: string[];
}> => {
  const network = isTestnet ? TESTNET : MAINNET;

  try {
    // Query proof-of-fandom contract for user's badge count and experience
    // This will work once the contract is deployed
    const badgeCountResult = await callReadOnlyFunction({
      contractAddress: fandomContractAddress,
      contractName: fandomContractName,
      functionName: 'get-last-token-id',
      functionArgs: [],
      network,
      senderAddress: fandomContractAddress,
    }).catch(() => null);

    const totalBadges = badgeCountResult ? Number(cvToValue(badgeCountResult)) : 0;

    // For now, return calculated rewards based on user's activity
    // In production, this would query the actual contract
    return {
      totalBadges,
      totalExperience: totalBadges * 100, // 100 XP per badge
      tierLevel: Math.min(Math.floor(totalBadges / 5) + 1, 5), // Tier based on badges
      achievements: totalBadges > 0 ? ['First Event', 'Early Supporter'] : []
    };
  } catch (error) {
    console.error('❌ Failed to fetch user rewards:', error);
    return {
      totalBadges: 0,
      totalExperience: 0,
      tierLevel: 1,
      achievements: []
    };
  }
};

/**
 * Get user's governance voting power
 */
export const fetchUserVotingPower = async (
  userAddress: string,
  governanceContractAddress: string,
  governanceContractName: string,
  isTestnet: boolean = true
): Promise<number> => {
  const network = isTestnet ? TESTNET : MAINNET;

  try {
    // Query governance contract for user's voting power
    const result = await callReadOnlyFunction({
      contractAddress: governanceContractAddress,
      contractName: governanceContractName,
      functionName: 'get-voting-power',
      functionArgs: [standardPrincipalCV(userAddress)],
      network,
      senderAddress: governanceContractAddress,
    });

    return Number(cvToValue(result)) / 1000000; // Convert microSTX to STX
  } catch (error) {
    console.error('❌ Failed to fetch voting power:', error);
    return 0;
  }
};

export default {
  saveDeployedContract,
  getDeployedContracts,
  getContractById,
  fetchContractData,
  fetchUserNFTs,
  fetchUserTransactions,
  fetchSTXBalance,
  fetchSBTCBalance,
  getAllEvents,
  getUserTickets,
};
