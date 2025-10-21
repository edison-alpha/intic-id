/**
 * Ticket Detail Service
 * Fetches detailed ticket information from blockchain
 */

import { callReadOnlyFunction, cvToValue, uintCV } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { getEventMetadataFromContract, fetchNFTMintTransaction } from './nftFetcher';

const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

export interface TicketDetail {
  // Basic Info
  id: string;
  tokenId: number;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  fullAddress: string;
  image: string;
  ticketNumber: string;

  // Contract Info
  contractAddress: string;
  contractName: string;
  contractId: string;

  // NFT Info
  owner: string;
  status: 'active' | 'used' | 'expired';
  mintTxId?: string; // Transaction hash for Hiro Explorer

  // Purchase Info
  purchasePrice: string;
  purchaseDate: string;
  category: string;
  quantity: number;
  seatInfo: string;

  // Metadata
  description?: string;
  metadataUri?: string;
}

/**
 * Helper to extract value from Clarity object
 */
const extractValue = (field: any): any => {
  if (!field) return null;
  if (typeof field === 'object' && 'value' in field) {
    // If it's a uint, convert to number
    if (field.type === 'uint') {
      return Number(field.value);
    }
    return field.value;
  }
  return field;
};

/**
 * Get ticket detail by ID
 * ID format: "CONTRACT_ADDRESS.CONTRACT_NAME-TOKEN_ID"
 */
export async function getTicketDetail(
  ticketId: string,
  userAddress: string
): Promise<TicketDetail | null> {
  try {
    console.log('🎫 [TicketDetail] Fetching ticket:', ticketId);

    // Parse ticket ID - format: "CONTRACT_ADDRESS.CONTRACT_NAME-TOKEN_ID"
    // Contract name may contain dashes, so split from the last dash
    const lastDashIndex = ticketId.lastIndexOf('-');
    if (lastDashIndex === -1) {
      console.error('❌ Invalid ticket ID format (no dash found):', ticketId);
      return null;
    }

    const contractPart = ticketId.substring(0, lastDashIndex);
    const tokenIdStr = ticketId.substring(lastDashIndex + 1);

    const dotIndex = contractPart.indexOf('.');
    if (dotIndex === -1) {
      console.error('❌ Invalid ticket ID format (no dot found):', ticketId);
      return null;
    }

    const contractAddress = contractPart.substring(0, dotIndex);
    const contractName = contractPart.substring(dotIndex + 1);
    const tokenId = parseInt(tokenIdStr);

    if (!contractAddress || !contractName || isNaN(tokenId)) {
      console.error('❌ Invalid ticket ID format:', ticketId);
      return null;
    }

    console.log(`  📍 Contract: ${contractAddress}.${contractName}`);
    console.log(`  🎟️ Token ID: ${tokenId}`);

    // Step 1: Verify ownership
    const ownerResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-owner',
      functionArgs: [uintCV(tokenId)],
      senderAddress: contractAddress,
      network,
    });

    const ownerData = cvToValue(ownerResult);
    const owner = extractValue(ownerData) || userAddress;
    console.log(`  👤 Owner: ${owner}`);

    if (owner !== userAddress) {
      console.warn('⚠️ User does not own this ticket');
      // Still continue to show data, but mark as not owned
    }

    // Step 2: Get event metadata
    const metadata = await getEventMetadataFromContract(contractAddress, contractName);

    if (!metadata) {
      console.error('❌ Could not get event metadata');
      return null;
    }

    // Step 3: Get token URI for metadata
    let metadataUri = null;
    try {
      const uriResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-token-uri',
        functionArgs: [uintCV(tokenId)],
        senderAddress: contractAddress,
        network,
      });

      const uriData = cvToValue(uriResult);
      // URI might be nested in { value: string } format
      if (uriData && typeof uriData === 'object' && 'value' in uriData) {
        metadataUri = extractValue(uriData.value) || extractValue(uriData) || null;
      } else {
        metadataUri = extractValue(uriData) || null;
      }
      console.log(`  🔗 Metadata URI: ${metadataUri}`);
    } catch (err) {
      console.warn('⚠️ Could not get token URI:', err);
    }

    // Step 4: Format date
    let formattedDate = 'TBA';
    let formattedTime = 'TBA';

    try {
      if (metadata.eventDate) {
        const date = new Date(metadata.eventDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Error formatting date:', err);
    }

    // Step 5: Determine status
    let status: 'active' | 'used' | 'expired' = 'active';

    if (metadata.eventDate) {
      const eventDate = new Date(metadata.eventDate);
      const now = new Date();
      const gracePeriodHours = 2; // Grace period after event starts
      const eventEndTime = new Date(eventDate.getTime() + (gracePeriodHours * 60 * 60 * 1000));

      if (now > eventEndTime) {
        // Event has passed (including grace period)
        status = 'expired';
      } else if (now > eventDate) {
        // Event is ongoing (within grace period)
        status = 'active';
      }
    }

    // Check if ticket was used via blockchain
    try {
      const ticketResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-ticket',
        functionArgs: [uintCV(tokenId)],
        senderAddress: contractAddress,
        network,
      });

      const ticketData = cvToValue(ticketResult);
      if (ticketData && ticketData.value) {
        const isUsed = ticketData.value['is-used']?.value || false;
        if (isUsed) {
          status = 'used';
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not check ticket usage status:', err);
    }

    // Step 6: Format purchase date
    const purchaseDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Step 7: Fetch mint transaction
    let mintTxId = '';
    try {
      const contractId = `${contractAddress}.${contractName}`;
      const txId = await fetchNFTMintTransaction(contractId, tokenId);
      mintTxId = txId || '';
      console.log(`  🔗 Mint TX: ${mintTxId || 'Not found'}`);
    } catch (err) {
      console.warn('⚠️ Could not fetch mint transaction:', err);
    }

    // Step 8: Build ticket detail
    const ticketDetail: TicketDetail = {
      id: ticketId,
      tokenId,
      eventName: metadata.eventName,
      eventDate: formattedDate,
      eventTime: formattedTime,
      location: metadata.venue || 'TBA',
      fullAddress: metadata.venue || 'Location TBA',
      image: metadata.image || '/background-section1.png',
      ticketNumber: `#TKT-${tokenId.toString().padStart(6, '0')}`,

      contractAddress,
      contractName,
      contractId: `${contractAddress}.${contractName}`,

      owner: owner || userAddress,
      status,
      mintTxId: mintTxId || undefined,

      purchasePrice: `${metadata.priceFormatted} STX`,
      purchaseDate,
      category: metadata.category || 'General',
      quantity: 1,
      seatInfo: metadata.category || 'General Admission',

      description: metadata.description,
      metadataUri: metadataUri || undefined,
    };

    console.log('✅ [TicketDetail] Ticket detail loaded:', ticketDetail);
    return ticketDetail;

  } catch (error) {
    console.error('❌ [TicketDetail] Error fetching ticket detail:', error);
    return null;
  }
}

/**
 * Get ticket transaction history
 */
export async function getTicketHistory(
  contractId: string,
  tokenId: number
): Promise<any[]> {
  try {
    const [contractAddress, contractName] = contractId.split('.');

    // Query Hiro API for NFT history
    const url = `https://api.testnet.hiro.so/extended/v1/tokens/nft/history?asset_identifier=${contractAddress}.${contractName}::nft-ticket&value=${tokenId}`;

    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.results || [];

  } catch (error) {
    console.error('❌ Error fetching ticket history:', error);
    return [];
  }
}
