/**
 * Event Registry Service
 * Handles interaction with event-registry.clar contract
 */

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  stringUtf8Cv,
  stringAsciiCv,
  uintCv,
  principalCv,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { getRegistryContract, NETWORK } from '@/config/contracts';

const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

export interface EventRegistryData {
  contractAddress: string;
  contractName: string;
  eventName: string;
  category: string;
  eventDate: number;
  totalSupply: number;
  ticketPrice: number;
  currency: 'STX' | 'sBTC';
  metadataUri: string;
}

/**
 * Register a newly deployed event contract to the registry
 */
export async function registerEventToRegistry(
  data: EventRegistryData,
  senderKey: string
): Promise<string> {
  const registryContract = getRegistryContract();

  if (!registryContract.address) {
    throw new Error('Event Registry contract not configured. Please deploy event-registry.clar first.');
  }

  const [contractAddress, contractName] = registryContract.address.split('.');

  try {
    const txOptions = {
      contractAddress,
      contractName,
      functionName: 'register-event',
      functionArgs: [
        principalCv(data.contractAddress), // contract-address
        stringAsciiCv(data.contractName), // contract-name
        stringUtf8Cv(data.eventName), // event-name
        stringUtf8Cv(data.category), // category
        uintCv(data.eventDate), // event-date (timestamp)
        uintCv(data.totalSupply), // total-supply
        uintCv(data.ticketPrice), // ticket-price (in microSTX)
        stringAsciiCv(data.currency), // currency
        stringAsciiCv(data.metadataUri), // metadata-uri
      ],
      senderKey,
      network,
      anchorMode: AnchorMode.Any,
      fee: 10000, // 0.01 STX for registration
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      throw new Error(`Registration failed: ${broadcastResponse.error}`);
    }

    return broadcastResponse.txid;
  } catch (error: any) {
    console.error('Error registering event:', error);
    throw new Error(error.message || 'Failed to register event to registry');
  }
}

/**
 * Get event details from registry by event ID
 */
export async function getEventFromRegistry(eventId: number): Promise<any> {
  const registryContract = getRegistryContract();

  if (!registryContract.address) {
    throw new Error('Event Registry contract not configured');
  }

  // Use Stacks API to read contract data
  const [contractAddress, contractName] = registryContract.address.split('.');
  const apiUrl = NETWORK === 'mainnet'
    ? 'https://api.mainnet.hiro.so'
    : 'https://api.testnet.hiro.so';

  try {
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/get-event`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [uintCv(eventId).serialize().toString('hex')],
        }),
      }
    );

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching event from registry:', error);
    throw error;
  }
}

/**
 * Get all events by organizer
 */
export async function getOrganizerEvents(organizerAddress: string): Promise<number[]> {
  const registryContract = getRegistryContract();

  if (!registryContract.address) {
    throw new Error('Event Registry contract not configured');
  }

  const [contractAddress, contractName] = registryContract.address.split('.');
  const apiUrl = NETWORK === 'mainnet'
    ? 'https://api.mainnet.hiro.so'
    : 'https://api.testnet.hiro.so';

  try {
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/get-organizer-events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [principalCv(organizerAddress).serialize().toString('hex')],
        }),
      }
    );

    const data = await response.json();
    // Parse the response to get event IDs
    return data.result || [];
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    throw error;
  }
}

/**
 * Check if Event Registry is deployed and accessible
 */
export async function isRegistryDeployed(): Promise<boolean> {
  const registryContract = getRegistryContract();

  if (!registryContract.address) {
    return false;
  }

  const [contractAddress, contractName] = registryContract.address.split('.');
  const apiUrl = NETWORK === 'mainnet'
    ? 'https://api.mainnet.hiro.so'
    : 'https://api.testnet.hiro.so';

  try {
    const response = await fetch(
      `${apiUrl}/v2/contracts/interface/${contractAddress}/${contractName}`
    );

    return response.ok;
  } catch (error) {
    console.error('Error checking registry deployment:', error);
    return false;
  }
}
