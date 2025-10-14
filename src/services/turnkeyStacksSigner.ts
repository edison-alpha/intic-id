/**
 * Turnkey Stacks Transaction Signer
 *
 * This service signs Stacks transactions using Turnkey wallet.
 *
 * APPROACH: Export private key temporarily from Turnkey for signing,
 * then use standard Stacks transaction signing flow.
 *
 * This is secure because:
 * - Key is only in memory (never persisted)
 * - Encrypted during export
 * - Only used for single transaction
 * - Immediately discarded after use
 */

import {
  makeSTXTokenTransfer,
  makeContractDeploy,
  broadcastTransaction,
  TransactionSigner,
  createMessageSignature,
  getAddressFromPublicKey,
  makeRandomPrivKey,
  publicKeyFromBuffer,
  AddressHashMode,
  MessageSignature,
  emptyMessageSignature,
} from '@stacks/transactions';
import { sigHashPreSign } from '@stacks/transactions';
import type { SingleSigSpendingCondition } from '@stacks/transactions';

export interface DeployContractWithTurnkeyParams {
  contractName: string;
  contractCode: string;
  publicKey: string;
  network: 'testnet' | 'mainnet';
  httpClient: any; // TurnkeyHttpClient type from useTurnkey()
  privateKeyId?: string; // Optional: if available from Turnkey
}

/**
 * Deploy contract using Turnkey signing
 * 
 * IMPORTANT: This approach creates a transaction template first,
 * then replaces the signature with one from Turnkey.
 * 
 * The challenge: makeContractDeploy needs a private key to set up
 * the auth structure correctly. We use a dummy key for structure,
 * then replace signature.
 */
export const deployContractWithTurnkey = async (
  params: DeployContractWithTurnkeyParams
): Promise<{
  txId: string;
  contractName: string;
  contractAddress: string;
  explorerUrl: string;
}> => {
  const { contractName, contractCode, publicKey, network, httpClient } = params;

  console.log('🔐 Deploying contract with Turnkey signing:', {
    contractName,
    publicKey: publicKey.substring(0, 20) + '...',
    network,
  });

  // Parse public key - handle both compressed and uncompressed
  let pubKeyBuffer: Buffer;
  try {
    // Remove 0x prefix if present
    const cleanPubKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
    pubKeyBuffer = Buffer.from(cleanPubKey, 'hex');
    console.log('📍 Public key buffer length:', pubKeyBuffer.length);
  } catch (error) {
    console.error('❌ Failed to parse public key:', error);
    throw new Error('Invalid public key format');
  }

  // Get address from public key
  const senderAddress = getAddressFromPublicKey(publicKey, network);
  console.log('📍 Sender address:', senderAddress);

  // Fetch current nonce
  const apiUrl = network === 'testnet' 
    ? 'https://api.testnet.hiro.so' 
    : 'https://api.hiro.so';
  
  let nonce = 0n;
  try {
    const nonceResponse = await fetch(`${apiUrl}/v2/accounts/${senderAddress}?proof=0`);
    if (nonceResponse.ok) {
      const accountData = await nonceResponse.json();
      nonce = BigInt(accountData.nonce);
      console.log('📊 Current nonce:', nonce.toString());
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch nonce, using 0:', error);
  }

  console.log('📝 Creating transaction with Turnkey public key...');
  
  // Create a dummy private key just to generate proper transaction structure
  const dummyKey = makeRandomPrivKey();
  
  // Create transaction with dummy key
  let transaction = await makeContractDeploy({
    contractName,
    codeBody: contractCode,
    senderKey: dummyKey,
    network,
    nonce,
    fee: 250000, // 0.25 STX - slightly higher to ensure acceptance
  });

  console.log('📝 Transaction structure created');
  console.log('🔄 Now we need to replace the dummy signature with Turnkey signature...');

  // CRITICAL: Update the signer's public key to match Turnkey's
  // The transaction was created with dummy key, we need to update it
  console.log('⚠️  WARNING: makeContractDeploy with dummy key may create mismatched signature');
  console.log('� Solution: We need to get Turnkey to export the actual private key');
  console.log('   OR use Turnkey\'s signTransaction endpoint if available');

  // For now, let's try to sign the pre-generated hash
  const signer = new TransactionSigner(transaction);
  const preSignSigHash = sigHashPreSign(
    signer.sigHash,
    transaction.auth.authType,
    transaction.auth.spendingCondition.fee,
    transaction.auth.spendingCondition.nonce,
  );

  // Turnkey expects hex string WITHOUT 0x prefix
  const payload = preSignSigHash;
  console.log('🔑 Signing payload with Turnkey (length:', payload.length, ')');
  console.log('   Payload:', payload.substring(0, 20) + '...');

  try {
    const signature = await httpClient.signRawPayload({
      encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
      hashFunction: 'HASH_FUNCTION_NO_OP',
      payload, // No 0x prefix!
      signWith: publicKey,
    });

    console.log('✅ Signature received from Turnkey');

    // Parse signature components
    const { r, s, v } = signature;

    // Clean hex strings (remove 0x if present)
    const cleanR = r.startsWith('0x') ? r.slice(2) : r;
    const cleanS = s.startsWith('0x') ? s.slice(2) : s;

    console.log('   r length:', cleanR.length, 'value:', cleanR.substring(0, 20) + '...');
    console.log('   s length:', cleanS.length, 'value:', cleanS.substring(0, 20) + '...');
    console.log('   v (recovery id):', v);

    // Stacks MessageSignature format requires specific structure
    // Create signature object manually with proper format
    const signatureData = `00${cleanR.padStart(64, '0')}${cleanS.padStart(64, '0')}`;
    console.log('📝 Signature data length:', signatureData.length, 'chars (should be 130 with recovery byte)');

    // Create MessageSignature using the createMessageSignature helper
    let messageSignature: MessageSignature;
    try {
      messageSignature = createMessageSignature(signatureData);
      console.log('📝 MessageSignature object created successfully');
    } catch (sigError: any) {
      console.error('❌ Failed to create MessageSignature:', sigError);
      // Fallback: try without recovery byte prefix
      const signatureDataNoPrefix = `${cleanR.padStart(64, '0')}${cleanS.padStart(64, '0')}`;
      console.log('🔄 Trying without recovery byte prefix, length:', signatureDataNoPrefix.length);
      messageSignature = createMessageSignature(signatureDataNoPrefix);
    }

    const spendingCondition = transaction.auth.spendingCondition as SingleSigSpendingCondition;

    // CRITICAL: Update the signer field to match our public key!
    console.log('⚠️  Spending condition signer before:', spendingCondition.signer);
    console.log('⚠️  Should be:', senderAddress);

    // Update signer to correct address and attach signature
    spendingCondition.signer = senderAddress;
    spendingCondition.signature = messageSignature;

    console.log('✅ Signature and signer updated in transaction');

    // Verify signature format before broadcast
    console.log('🔍 Final signature check:');
    console.log('   Type:', spendingCondition.signature.type);
    console.log('   Data length:', spendingCondition.signature.data?.length);

    // Try to serialize transaction first to catch errors early
    console.log('🔍 Testing transaction serialization...');
    try {
      const serialized = transaction.serialize();
      console.log('✅ Transaction serialization successful, size:', serialized.byteLength, 'bytes');
    } catch (serError: any) {
      console.error('❌ Serialization failed:', serError.message);
      throw new Error(`Transaction serialization failed: ${serError.message}`);
    }

    // Broadcast
    console.log('📡 Broadcasting transaction...');
    const broadcastResponse = await broadcastTransaction({
      transaction,
      network,
    });

    const txId = broadcastResponse.txid;
    console.log('✅ Transaction broadcast successful!');
    console.log('📨 Transaction ID:', txId);

    const contractAddress = `${senderAddress}.${contractName}`;
    const explorerUrl = network === 'testnet'
      ? `https://explorer.hiro.so/txid/${txId}?chain=testnet`
      : `https://explorer.hiro.so/txid/${txId}?chain=mainnet`;

    console.log('🔍 View on Explorer:', explorerUrl);

    return {
      txId,
      contractName,
      contractAddress,
      explorerUrl,
    };
  } catch (error: any) {
    console.error('❌ Turnkey signing failed:', error);

    // Log detailed error information
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Response status:', error.response.status);
    }

    if (error.message?.includes('Invalid byte sequence')) {
      console.error('   This usually means the payload format is incorrect');
      console.error('   Payload that was sent:', payload?.substring(0, 40) + '...');
    }

    console.error('Full error:', JSON.stringify(error, null, 2));

    // Provide user-friendly error message
    let errorMessage = error.message || 'Unknown signing error';
    if (error.message?.includes('Invalid byte sequence')) {
      errorMessage = 'Invalid signature payload format. Please try again or contact support.';
    } else if (error.message?.includes('not found')) {
      errorMessage = 'Turnkey wallet key not found. Please reconnect your wallet.';
    }

    throw new Error(`Failed to sign transaction with Turnkey: ${errorMessage}`);
  }
};

/**
 * Helper: Estimate deployment fee
 */
export const estimateDeploymentFee = async (
  contractCode: string
): Promise<number> => {
  // Base fee + size-based fee
  const baseFeeMicroSTX = 200000; // 0.2 STX
  const sizeFeeMicroSTX = Math.ceil(contractCode.length / 1000) * 10000;
  return baseFeeMicroSTX + sizeFeeMicroSTX;
};
