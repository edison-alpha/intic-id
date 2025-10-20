/**
 * Event Registry Service
 * Handles registration of deployed events to the on-chain registry
 */

import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  principalCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { getRegistryContract, DEPLOYMENT_COSTS } from '../config/contracts';

export interface EventRegistrationParams {
  contractAddress: string;
  contractName: string;
  eventName: string;
  eventDescription: string;
  category: string;
  venue: string;
  venueAddress: string;
  venueCoordinates: string;
  eventDate: number; // Bitcoin block height
  ticketPrice: number; // in micro-STX
  totalSupply: number;
  imageUri: string;
  metadataUri: string;
  userAddress: string;
}

/**
 * Register event to on-chain registry
 * This makes the event discoverable platform-wide
 */
export const registerEventToRegistry = async (
  params: EventRegistrationParams
): Promise<{ txId: string }> => {
  const registryContract = getRegistryContract();
  
  if (!registryContract.address) {
    throw new Error('Event Registry contract not configured. Please deploy event-registry.clar first.');
  }

  const [contractOwner, contractNameOnly] = registryContract.address.split('.');
  
  if (!contractOwner || !contractNameOnly) {
    throw new Error('Invalid registry contract address format');
  }

  try {
    // Convert eventDate to Bitcoin block height if it's a timestamp
    const eventBlockHeight = params.eventDate > 1000000000 
      ? Math.floor(Date.now() / 1000 / 600) + Math.floor((params.eventDate - Date.now()) / 1000 / 600)
      : params.eventDate;

    // Prepare function arguments matching register-event function
    const functionArgs = [
      principalCV(params.contractAddress), // contract-address
      stringAsciiCV(params.contractName), // contract-name
      stringUtf8CV(params.eventName), // event-name
      stringUtf8CV(params.eventDescription), // event-description
      stringAsciiCV(params.category), // category
      stringUtf8CV(params.venue), // venue
      stringUtf8CV(params.venueAddress), // venue-address
      stringAsciiCV(params.venueCoordinates), // venue-coordinates
      uintCV(eventBlockHeight), // event-date (Bitcoin block height)
      uintCV(params.ticketPrice), // ticket-price (micro-STX)
      uintCV(params.totalSupply), // total-supply
      stringAsciiCV(params.imageUri), // image-uri
      stringAsciiCV(params.metadataUri), // metadata-uri
    ];

    // Post condition: User must pay registration fee (0.01 STX = 10,000 micro-STX)
    const registrationFeeMicroStx = DEPLOYMENT_COSTS.registryFee * 1_000_000;
    const postConditions = [
      makeStandardSTXPostCondition(
        params.userAddress,
        FungibleConditionCode.Equal,
        registrationFeeMicroStx
      ),
    ];

    // Call contract with user-friendly messages
    return new Promise((resolve, reject) => {
      openContractCall({
        contractAddress: contractOwner,
        contractName: contractNameOnly,
        functionName: 'register-event',
        functionArgs,
        postConditions,
        postConditionMode: PostConditionMode.Deny,
        network: new StacksTestnet(),
        appDetails: {
          name: 'INTIC - NFT Ticketing Platform',
          icon: window.location.origin + '/logo.png',
        },
        onFinish: (data: any) => {
          console.log('✅ Event registration transaction submitted!', data);
          console.log(`📝 Transaction ID: ${data.txId}`);
          console.log('⏳ Your event will be visible in the registry once the transaction is confirmed (~10 minutes)');
          resolve({ txId: data.txId });
        },
        onCancel: () => {
          console.log('❌ Event registration cancelled by user');
          reject(new Error('Registration cancelled. You can register your event anytime from the dashboard.'));
        },
      });
    });

  } catch (error) {
    console.error('Failed to register event to registry:', error);
    throw error;
  }
};

/**
 * Verify if event is registered in registry
 * Note: This is a simplified check - in production you might want to use Stacks.js client
 */
export const isEventRegistered = async (contractAddress: string): Promise<boolean> => {
  const registryContract = getRegistryContract();
  
  if (!registryContract.address) {
    return false;
  }

  try {
    // For now, return false and let the UI handle checking
    // You can implement proper read-only call with Stacks.js client library
    console.log('Registry check not implemented yet for:', contractAddress);
    return false;
    
  } catch (error) {
    console.error('Failed to check registration status:', error);
    return false;
  }
};

/**
 * Get current Bitcoin block height estimate
 * Used for converting dates to block heights
 */
export const getCurrentBlockHeight = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.testnet.hiro.so/v2/info');
    const data = await response.json();
    return data.burn_block_height || 0;
  } catch (error) {
    console.error('Failed to get block height:', error);
    // Fallback: Bitcoin mainnet is ~860000 blocks, testnet ~2.5M
    return 2500000; // Testnet estimate
  }
};

/**
 * Convert timestamp to Bitcoin block height
 * Bitcoin blocks ~10 minutes apart
 */
export const timestampToBlockHeight = async (timestamp: number): Promise<number> => {
  const currentBlockHeight = await getCurrentBlockHeight();
  const now = Date.now();
  const blocksInFuture = Math.floor((timestamp - now) / 1000 / 600); // 600s = 10min
  return currentBlockHeight + blocksInFuture;
};
