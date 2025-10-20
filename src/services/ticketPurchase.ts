/**
 * Ticket Purchase Service
 * Handles sBTC ticket purchases using Turnkey signing
 */

import { makeContractCall, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { toast } from 'sonner';

export interface PurchaseParams {
  contractAddress: string;
  contractName: string;
  buyerAddress: string;
  quantity: number;
  ticketPrice: number; // in sBTC
  turnkeyClient: any;
  walletId: string;
  organizationId: string;
}

/**
 * Purchase NFT tickets with sBTC payment
 * Uses Turnkey for secure signing without private key exposure
 */
export const purchaseTicketWithSBTC = async (params: PurchaseParams): Promise<string> => {
  const {
    contractAddress,
    contractName,
    buyerAddress,
    quantity,
    ticketPrice,
    turnkeyClient,
    walletId,
    organizationId
  } = params;

  try {
    toast.loading('Processing sBTC ticket purchase...');

    // Calculate total payment in sBTC (convert to satoshis)
    const totalPayment = Math.floor(ticketPrice * quantity * 100000000); // Convert BTC to satoshis

    // Create contract call for minting NFT tickets
    const txOptions = {
      contractAddress,
      contractName,
      functionName: 'mint-ticket',
      functionArgs: [
        standardPrincipalCV(buyerAddress), // buyer
        uintCV(quantity), // quantity
        uintCV(totalPayment), // payment in satoshis
      ],
      network: new StacksTestnet(),
      senderAddress: buyerAddress,
    };

    // Prepare transaction with Turnkey signing

    // Use Turnkey's signing API (no private key export)
    const signedTx = await turnkeyClient.signTransaction({
      walletId,
      organizationId,
      transaction: txOptions,
    });

    // Transaction signed successfully

    // Broadcast the signed transaction
    const broadcastResponse = await fetch('https://api.testnet.hiro.so/v2/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: signedTx,
    });

    if (!broadcastResponse.ok) {
      throw new Error(`Broadcast failed: ${broadcastResponse.statusText}`);
    }

    const txResult = await broadcastResponse.json();
    const txId = txResult.txid;

    toast.dismiss();
    toast.success('Ticket purchase successful! 🎉');

    return txId;

  } catch (error: any) {
    toast.dismiss();
    toast.error(`Purchase failed: ${error.message}`);
    throw error;
  }
};

/**
 * Check if user has sufficient sBTC balance
 */
export const checkSBTCBalance = async (
  userAddress: string,
  requiredAmount: number,
  sbtcContractAddress: string = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  sbtcContractName: string = 'sbtc-token'
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${userAddress}/balances`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }

    const data = await response.json();
    const sbtcBalance = data.fungible_tokens?.[`${sbtcContractAddress}.${sbtcContractName}::sbtc`]?.balance || 0;

    // Convert satoshis to BTC for comparison
    const balanceBTC = Number(sbtcBalance) / 100000000;

    return balanceBTC >= requiredAmount;

  } catch (error) {
    return false;
  }
};

/**
 * Hook for ticket purchasing - DISABLED
 */
export const useTicketPurchase = () => {
  const purchase = async (
    contractAddress: string,
    contractName: string,
    quantity: number,
    ticketPrice: number
  ) => {
    toast.info('Ticket purchasing is currently disabled');
    throw new Error('Ticket purchasing is not available');
  };

  return { purchase };
};

export default {
  purchaseTicketWithSBTC,
  checkSBTCBalance,
  useTicketPurchase,
};