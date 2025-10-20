/**
 * Stacks.js Contract Reader
 * More reliable alternative to Hiro API for reading contract data
 */

import { 
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
  ClarityValue
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const NETWORK = new StacksTestnet();

/**
 * Call read-only contract function using Stacks.js
 */
export const callReadOnlyContractFunction = async (
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress?: string
): Promise<any> => {
  try {
    const options = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      network: NETWORK,
      senderAddress: senderAddress || contractAddress,
    };

    const result = await callReadOnlyFunction(options);
    const jsonResult = cvToJSON(result);
    
    return {
      success: true,
      result: result,
      json: jsonResult
    };

  } catch (error: any) {
    console.error(`❌ [Stacks.js] Error calling ${contractName}.${functionName}:`, error.message);
    return {
      success: false,
      error: error.message,
      result: null
    };
  }
};

/**
 * Parse Clarity response - handles (ok ...) and (err ...) responses
 */
export const parseClarityResponse = (clarityValue: any): any => {
  if (!clarityValue) return null;

  const json = cvToJSON(clarityValue);
  
  // Handle response types (ok/err) - check for 'success' property OR type starting with '(response'
  const isResponseType = json.type?.startsWith('(response') || 'success' in json;
  
  if (isResponseType) {
    if (json.success) {
      return parseClarityValue(json.value);
    } else {
      console.warn('Contract returned error response:', json.value);
      return null;
    }
  }
  
  // Direct parse
  return parseClarityValue(json);
};

/**
 * Parse Clarity value to JavaScript type
 */
export const parseClarityValue = (json: any): any => {
  if (!json) return null;
  
  const typeStr = json.type || '';

  // Check if it's a tuple (type string starts with "(tuple")
  if (typeStr.startsWith('(tuple')) {
    const tupleObj: any = {};
    if (json.value && typeof json.value === 'object') {
      for (const [key, value] of Object.entries(json.value)) {
        tupleObj[key] = parseClarityValue(value);
      }
    }
    return tupleObj;
  }

  switch (typeStr) {
    case 'uint':
    case 'int':
      return typeof json.value === 'string' ? BigInt(json.value) : BigInt(json.value);
    
    case 'bool':
      return json.value;
    
    case 'string-ascii':
    case 'string-utf8':
      return json.value;
    
    case 'principal':
      return json.value;
    
    case 'optional':
      return json.value ? parseClarityValue(json.value) : null;
    
    case 'list':
      return json.value.map((item: any) => parseClarityValue(item));
    
    default:
      return json.value;
  }
};

/**
 * Get NFT ticket event info using Stacks.js
 */
export const getEventInfo = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-event-info',
    []
  );
  
  if (!result.success || !result.result) {
    return null;
  }
  
  return parseClarityResponse(result.result);
};

/**
 * Get total supply
 */
export const getTotalSupply = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-total-supply',
    []
  );
  
  if (result.success && result.result) {
    const value = parseClarityResponse(result.result);
    return value ? Number(value) : null;
  }
  
  return null;
};

/**
 * Get last token ID (minted count)
 */
export const getLastTokenId = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-last-token-id',
    []
  );
  
  if (result.success && result.result) {
    const value = parseClarityResponse(result.result);
    return value ? Number(value) : null;
  }
  
  return null;
};

/**
 * Get tickets remaining
 */
export const getTicketsRemaining = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-tickets-remaining',
    []
  );
  
  if (result.success && result.result) {
    const value = parseClarityResponse(result.result);
    return value ? Number(value) : null;
  }
  
  return null;
};

/**
 * Get ticket price
 */
export const getTicketPrice = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-ticket-price',
    []
  );
  
  if (result.success && result.result) {
    const value = parseClarityResponse(result.result);
    return value ? value.toString() : null;
  }
  
  return null;
};

/**
 * Check if event is cancelled
 */
export const isEventCancelled = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'is-event-cancelled',
    []
  );
  
  if (result.success && result.result) {
    return parseClarityResponse(result.result) === true;
  }
  
  return false;
};

/**
 * Get token URI
 */
export const getTokenUri = async (contractId: string, tokenId: number = 1) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-token-uri',
    [uintCV(tokenId)]
  );
  
  if (result.success && result.result) {
    return parseClarityResponse(result.result);
  }
  
  return null;
};

/**
 * Get event details using get-event-details function (NEW CONTRACT FUNCTION)
 * Returns complete tuple with all event information
 */
export const getEventDetails = async (contractId: string) => {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  
  const contractAddress = parts[0];
  const contractName = parts[1];
  
  const result = await callReadOnlyContractFunction(
    contractAddress,
    contractName,
    'get-event-details',
    []
  );
  
  if (!result.success || !result.result) {
    console.warn('⚠️ get-event-details not available, falling back to get-event-info');
    return null;
  }
  
  return parseClarityResponse(result.result);
};

/**
 * Get complete NFT ticket data using Stacks.js
 * More reliable than Hiro API calls
 */
export const getNFTTicketDataWithStacks = async (contractId: string) => {
  try {
    // PRIORITY 1: Try get-event-details (NEW - returns full tuple)
    const eventDetails = await getEventDetails(contractId);
    
    if (eventDetails) {
      console.log('✅ [Stacks.js] Got event details:', eventDetails);
      
      // Parse kebab-case fields from Clarity tuple
      const totalSupply = eventDetails['total-supply'] || eventDetails.totalSupply;
      const ticketsSold = eventDetails['tickets-sold'] || eventDetails.ticketsSold;
      const ticketsRemaining = eventDetails['tickets-remaining'] || eventDetails.ticketsRemaining;
      const price = eventDetails.price;
      const cancelled = eventDetails.cancelled;
      const eventDate = eventDetails['event-date'] || eventDetails.eventDate;
      const eventName = eventDetails.name;
      const venue = eventDetails.venue;
      const venueAddress = eventDetails['venue-address'] || eventDetails.venueAddress;
      const venueCoordinates = eventDetails['venue-coordinates'] || eventDetails.venueCoordinates;
      const imageUri = eventDetails['image-uri'] || eventDetails.imageUri;
      const metadataUri = eventDetails['metadata-uri'] || eventDetails.metadataUri;
      const paymentCurrency = eventDetails['payment-currency'] || eventDetails.paymentCurrency;
      const pricingMode = eventDetails['pricing-mode'] || eventDetails.pricingMode;
      
      return {
        maxSupply: totalSupply ? Number(totalSupply) : null,
        mintedCount: ticketsSold ? Number(ticketsSold) : null,
        remainingSupply: ticketsRemaining ? Number(ticketsRemaining) : null,
        mintPrice: price ? price.toString() : null,
        eventCancelled: cancelled === true,
        eventDate: eventDate ? Number(eventDate) : null,
        royaltyPercentage: null,
        // Additional fields from get-event-details
        eventName: eventName || null,
        venue: venue || null,
        venueAddress: venueAddress || null,
        venueCoordinates: venueCoordinates || null,
        imageUri: imageUri || null,
        metadataUri: metadataUri || null,
        paymentCurrency: paymentCurrency || null,
        pricingMode: pricingMode || null,
      };
    }
    
    // PRIORITY 2: Try get-event-info (OLD - partial data)
    const eventInfo = await getEventInfo(contractId);
    
    if (eventInfo) {
      console.log('⚠️ [Stacks.js] Using fallback get-event-info:', eventInfo);
      
      // Safe access for kebab-case fields (Clarity style)
      const totalSupply = eventInfo['total-supply'] || eventInfo.totalSupply;
      const sold = eventInfo.sold;
      const remaining = eventInfo.remaining;
      const price = eventInfo.price;
      const cancelled = eventInfo.cancelled;
      const eventDate = eventInfo['event-date'] || eventInfo.eventDate;
      const royaltyPercent = eventInfo['royalty-percent'] || eventInfo.royaltyPercent;
      
      return {
        maxSupply: totalSupply ? Number(totalSupply) : null,
        mintedCount: sold ? Number(sold) : null,
        remainingSupply: remaining ? Number(remaining) : null,
        mintPrice: price ? price.toString() : null,
        eventCancelled: cancelled === true,
        eventDate: eventDate ? Number(eventDate) : null,
        royaltyPercentage: royaltyPercent ? Number(royaltyPercent) : null,
      };
    }
    
    // Fallback: Call individual functions
    const [
      maxSupply,
      lastTokenId,
      remaining,
      price,
      cancelled
    ] = await Promise.all([
      getTotalSupply(contractId),
      getLastTokenId(contractId),
      getTicketsRemaining(contractId),
      getTicketPrice(contractId),
      isEventCancelled(contractId),
    ]);
    
    return {
      maxSupply,
      mintedCount: lastTokenId,
      remainingSupply: remaining,
      mintPrice: price,
      eventCancelled: cancelled,
      eventDate: null,
      royaltyPercentage: null,
    };
    
  } catch (error) {
    console.error('❌ [Stacks.js] Error fetching NFT data:', error);
    return null;
  }
};
