/**
 * Ticket Check-In Service
 * Handles ticket validation and check-in process
 */

import {
  makeContractCall,
  callReadOnlyFunction,
  cvToValue,
  uintCV,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import type { StacksNetwork } from '@stacks/network';

const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'testnet';
const network: StacksNetwork = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

export { NETWORK };

export interface CheckInData {
  contractAddress: string;
  contractName: string;
  tokenId: number;
  eventDate: string; // ISO date string
  eventTime: string;
}

export interface CheckInResult {
  success: boolean;
  txId?: string;
  message: string;
  status?: 'used' | 'expired' | 'invalid';
}

export interface TicketValidation {
  isValid: boolean;
  isUsed: boolean;
  isExpired: boolean;
  owner: string;
  eventDate: Date;
  message: string;
}

/**
 * Parse check-in QR data from Event Organizer
 * Format: "checkin:CONTRACT_ADDRESS.CONTRACT_NAME:EVENT_ID"
 * This QR is displayed by EO at the event entrance
 */
export interface CheckInPointData {
  contractAddress: string;
  contractName: string;
}

export function parseCheckInPointQR(qrData: string): CheckInPointData | null {
  try {
    // Sanitize input: remove URL prefixes that scanners might add
    let cleanData = qrData.trim();
    cleanData = cleanData.replace(/^(https?:\/\/|http:\/\/)/, '');

    console.log('🔍 [Parser] Original:', qrData);
    console.log('🔍 [Parser] Cleaned:', cleanData);

    if (!cleanData.startsWith('checkin:')) {
      console.log('❌ [Parser] Does not start with checkin:');
      return null;
    }

    // Remove "checkin:" prefix
    const afterPrefix = cleanData.substring(8);

    // Split by ':' and take only first part (ignore any trailing :undefined)
    const contractId = afterPrefix.split(':')[0];

    console.log('🔍 [Parser] Contract ID:', contractId);

    const [contractAddress, contractName] = contractId.split('.');

    if (!contractAddress || !contractName) {
      console.log('❌ [Parser] Invalid format:', { contractAddress, contractName });
      return null;
    }

    console.log('✅ [Parser] Success:', { contractAddress, contractName });

    return {
      contractAddress,
      contractName,
    };
  } catch (error) {
    console.error('❌ [Parser] Error:', error);
    return null;
  }
}

/**
 * Generate check-in point QR data (for Event Organizer)
 * Format: checkin:CONTRACT_ADDRESS.CONTRACT_NAME
 */
export function generateCheckInPointQR(
  contractAddress: string,
  contractName: string
): string {
  return `checkin:${contractAddress}.${contractName}`;
}

/**
 * Parse check-in QR data (legacy - for backward compatibility)
 * Format: "checkin:CONTRACT_ADDRESS.CONTRACT_NAME:TOKEN_ID:EVENT_DATE:EVENT_TIME"
 */
export function parseCheckInQRData(qrData: string): CheckInData | null {
  try {
    if (!qrData.startsWith('checkin:')) {
      return null;
    }

    const parts = qrData.substring(8).split(':');
    if (parts.length !== 4) {
      return null;
    }

    const [contractId, tokenIdStr, eventDate, eventTime] = parts;
    if (!contractId || !tokenIdStr || !eventDate || !eventTime) {
      return null;
    }

    const [contractAddress, contractName] = contractId.split('.');

    if (!contractAddress || !contractName) {
      return null;
    }

    const tokenId = parseInt(tokenIdStr);
    if (isNaN(tokenId)) {
      return null;
    }

    return {
      contractAddress,
      contractName,
      tokenId,
      eventDate,
      eventTime,
    };
  } catch (error) {
    console.error('❌ Error parsing check-in QR data:', error);
    return null;
  }
}

/**
 * Generate check-in QR data
 */
export function generateCheckInQRData(checkInData: CheckInData): string {
  const { contractAddress, contractName, tokenId, eventDate, eventTime } = checkInData;
  return `checkin:${contractAddress}.${contractName}:${tokenId}:${eventDate}:${eventTime}`;
}

/**
 * Validate ticket before check-in
 */
export async function validateTicket(
  contractAddress: string,
  contractName: string,
  tokenId: number,
  eventDate: string,
  eventTime: string
): Promise<TicketValidation> {
  try {
    console.log('🔍 [CheckIn] Validating ticket:', { contractAddress, contractName, tokenId });

    // 1. Check if ticket exists and get details
    const ticketResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-ticket',
      functionArgs: [uintCV(tokenId)],
      senderAddress: contractAddress,
      network,
    });

    const ticketData = cvToValue(ticketResult);

    if (!ticketData || !ticketData.value) {
      return {
        isValid: false,
        isUsed: false,
        isExpired: false,
        owner: '',
        eventDate: new Date(),
        message: 'Ticket not found',
      };
    }

    const ticket = ticketData.value;

    // 2. Check if already used
    const isUsed = ticket['is-used']?.value || false;
    if (isUsed) {
      return {
        isValid: false,
        isUsed: true,
        isExpired: false,
        owner: ticket.owner?.value || '',
        eventDate: new Date(),
        message: 'Ticket already used',
      };
    }

    // 3. Check if expired (event time has passed + grace period)
    const eventDateTime = new Date(`${eventDate} ${eventTime}`);
    const now = new Date();
    const gracePeriodHours = 2; // Allow check-in up to 2 hours after event start
    const expiryTime = new Date(eventDateTime.getTime() + (gracePeriodHours * 60 * 60 * 1000));

    const isExpired = now > expiryTime;
    if (isExpired) {
      return {
        isValid: false,
        isUsed: false,
        isExpired: true,
        owner: ticket.owner?.value || '',
        eventDate: eventDateTime,
        message: 'Ticket expired - event time has passed',
      };
    }

    // 4. Check if too early (more than 24 hours before event)
    const earlyCheckInHours = 24;
    const earliestCheckIn = new Date(eventDateTime.getTime() - (earlyCheckInHours * 60 * 60 * 1000));

    if (now < earliestCheckIn) {
      return {
        isValid: false,
        isUsed: false,
        isExpired: false,
        owner: ticket.owner?.value || '',
        eventDate: eventDateTime,
        message: 'Too early - check-in opens 24 hours before event',
      };
    }

    // Ticket is valid
    return {
      isValid: true,
      isUsed: false,
      isExpired: false,
      owner: ticket.owner?.value || '',
      eventDate: eventDateTime,
      message: 'Ticket valid for check-in',
    };

  } catch (error) {
    console.error('❌ [CheckIn] Error validating ticket:', error);
    return {
      isValid: false,
      isUsed: false,
      isExpired: false,
      owner: '',
      eventDate: new Date(),
      message: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Get user's tickets for a specific event
 */
export async function getUserTicketsForEvent(
  _contractAddress: string,
  _contractName: string,
  _eventId: number,
  _userAddress: string
): Promise<number[]> {
  try {
    // This is a simplified version - in reality you'd need to query all user's NFTs
    // and filter by event ID
    // For now, we'll return an empty array and let the user select their ticket manually
    console.log('📋 [CheckIn] Getting tickets for event:', _eventId);
    return [];
  } catch (error) {
    console.error('❌ Error getting user tickets:', error);
    return [];
  }
}

/**
 * Check-in ticket (mark as used) - User initiates this after scanning EO's QR
 * Uses browser wallet extension (Hiro/Xverse) to sign transaction
 */
export async function checkInTicket(
  contractAddress: string,
  contractName: string,
  tokenId: number
): Promise<CheckInResult> {
  try {
    console.log('✅ [CheckIn] Processing check-in:', { contractAddress, contractName, tokenId });

    return new Promise((resolve, reject) => {
      openContractCall({
        contractAddress,
        contractName,
        functionName: 'use-ticket',
        functionArgs: [uintCV(tokenId)],
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('✅ [CheckIn] Transaction submitted:', data.txId);
          resolve({
            success: true,
            txId: data.txId,
            message: 'Check-in successful! Ticket marked as used.',
            status: 'used',
          });
        },
        onCancel: () => {
          console.log('⚠️ [CheckIn] User cancelled transaction');
          reject(new Error('Transaction cancelled by user'));
        },
      });
    });

  } catch (error: any) {
    console.error('❌ [CheckIn] Error during check-in:', error);

    let message = 'Check-in failed';
    if (error.message?.includes('cancelled')) {
      message = 'Transaction cancelled';
    } else if (error.message?.includes('already used')) {
      message = 'Ticket already used';
    } else if (error.message?.includes('not authorized')) {
      message = 'Not authorized to use this ticket';
    } else if (error.message) {
      message = error.message;
    }

    return {
      success: false,
      message,
      status: 'invalid',
    };
  }
}

/**
 * Get ticket status
 */
export async function getTicketStatus(
  contractAddress: string,
  contractName: string,
  tokenId: number
): Promise<'active' | 'used' | 'expired' | 'unknown'> {
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

    if (!ticketData || !ticketData.value) {
      return 'unknown';
    }

    const ticket = ticketData.value;
    const isUsed = ticket['is-used']?.value || false;

    if (isUsed) {
      return 'used';
    }

    // Check expiration based on event date
    // This would need event data to determine if expired
    return 'active';

  } catch (error) {
    console.error('❌ Error getting ticket status:', error);
    return 'unknown';
  }
}

/**
 * Check if user is event organizer
 */
export async function isEventOrganizer(
  contractAddress: string,
  contractName: string,
  eventId: number,
  userAddress: string
): Promise<boolean> {
  try {
    const eventResult = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-event',
      functionArgs: [uintCV(eventId)],
      senderAddress: contractAddress,
      network,
    });

    const eventData = cvToValue(eventResult);

    if (!eventData || !eventData.value) {
      return false;
    }

    const organizer = eventData.value.organizer?.value || '';
    return organizer === userAddress;

  } catch (error) {
    console.error('❌ Error checking organizer:', error);
    return false;
  }
}
