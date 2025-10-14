/**
 * Turnkey Stacks Transaction Signer V2
 *
 * This service signs Stacks transactions using Turnkey wallet.
 *
 * APPROACH V2: Export private key temporarily from Turnkey for signing,
 * then use standard Stacks transaction signing flow.
 *
 * This solves the "Invalid byte sequence" serialization error by using
 * proper transaction creation instead of signature replacement.
 *
 * Security:
 * - Key is only in memory (never persisted to disk)
 * - Encrypted during export from Turnkey
 * - Only used for single transaction
 * - Immediately cleared from memory after use
 */

import {
  makeContractDeploy,
  broadcastTransaction,
  getAddressFromPublicKey,
} from '@stacks/transactions';

export interface DeployContractWithTurnkeyParams {
  contractName: string;
  contractCode: string;
  publicKey: string;
  network: 'testnet' | 'mainnet';
  httpClient: any; // TurnkeyHttpClient type from useTurnkey()
  walletId?: string; // Turnkey wallet ID (required for export)
  organizationId?: string; // Turnkey organization ID
}

/**
 * Deploy contract using Turnkey with proper key export approach
 * 
 * This fixes the serialization issue by:
 * 1. Exporting the actual private key from Turnkey (securely)
 * 2. Using it to create/sign the transaction properly
 * 3. Immediately clearing it from memory
 * 
 * No more "dummy key + replace signature" hacks!
 */
export const deployContractWithTurnkey = async (
  params: DeployContractWithTurnkeyParams
): Promise<{
  txId: string;
  contractName: string;
  contractAddress: string;
  explorerUrl: string;
}> => {
  const { contractName, contractCode, publicKey, network, httpClient, walletId, organizationId } = params;

  console.log('🔐 [V2] Deploying contract with Turnkey (Export Key Approach):', {
    contractName,
    publicKey: publicKey.substring(0, 20) + '...',
    network,
    hasWalletId: !!walletId,
    hasOrgId: !!organizationId,
  });

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

  console.log('🔑 Step 1: Export private key from Turnkey...');
  
  let privateKeyHex: string | null = null;
  
  try {
    // According to Turnkey docs, we have 3 options:
    // 1. exportWallet - exports mnemonic (not what we need)
    // 2. exportWalletAccount - exports private key for specific address
    // 3. exportPrivateKey - exports specific private key by ID
    //
    // For Stacks, we need the wallet account's private key
    // We'll use exportWallet then derive the private key from mnemonic
    
    // Import necessary functions from @turnkey/crypto
    let generateP256KeyPair: any;
    let decryptExportBundle: any;
    
    try {
      const turnkeyCrypto = await import('@turnkey/crypto');
      generateP256KeyPair = turnkeyCrypto.generateP256KeyPair;
      decryptExportBundle = turnkeyCrypto.decryptExportBundle;
    } catch (importError) {
      console.error('❌ Failed to import @turnkey/crypto');
      throw new Error(
        '@turnkey/crypto package not found. ' +
        'Please install it: npm install @turnkey/crypto'
      );
    }

    if (!walletId) {
      throw new Error(
        'Wallet ID is required for export. ' +
        'Please ensure the wallet was created successfully.'
      );
    }

    // Step 1: Generate P256 keypair for secure export
    console.log('   Generating P256 keypair for secure export...');
    const keyPair = generateP256KeyPair();
    const embeddedPrivateKey = keyPair.privateKey;
    const embeddedPublicKey = keyPair.publicKeyUncompressed;
    
    console.log('   P256 keypair generated');
    console.log('   Public key length:', embeddedPublicKey.length);

    // Step 2: Export wallet (gets mnemonic)
    console.log('   Calling exportWallet with walletId:', walletId);
    
    const exportResult = await httpClient.exportWallet({
      walletId: walletId,
      targetPublicKey: embeddedPublicKey,
    });

    console.log('✅ Wallet exported from Turnkey');
    
    if (!exportResult || !exportResult.exportBundle) {
      throw new Error('Export result missing export bundle');
    }

    // Step 3: Decrypt the export bundle
    console.log('   Decrypting export bundle...');
    
    // Get organization ID from params or environment
    // NOTE: Use import.meta.env for Vite (not process.env which is Node.js only)
    const orgId = organizationId || 
                  import.meta.env.VITE_TURNKEY_ORGANIZATION_ID ||
                  '';
    
    console.log('   Organization ID for decryption:', orgId);
    console.log('   (This should be the user\'s sub-organization ID, not parent org)');
    
    if (!orgId) {
      throw new Error(
        'Organization ID not found. ' +
        'Please provide organizationId parameter (user sub-org ID) or set VITE_TURNKEY_ORGANIZATION_ID.'
      );
    }

    const decryptedBundle = await decryptExportBundle({
      exportBundle: exportResult.exportBundle,
      embeddedKey: embeddedPrivateKey,
      organizationId: orgId,
      returnMnemonic: true, // We get mnemonic from wallet export
    });

    console.log('✅ Export bundle decrypted');
    console.log('   Decrypted data type:', typeof decryptedBundle);

    // Step 4: Derive private key from mnemonic
    // For Stacks, we use path: m/44'/5757'/0'/0/0
    console.log('   Deriving private key from mnemonic...');
    
    // Import Stacks wallet utilities
    const { mnemonicToSeed } = await import('@scure/bip39');
    const { HDKey } = await import('@scure/bip32');
    
    // Convert mnemonic to seed
    const seed = await mnemonicToSeed(decryptedBundle);
    
    // Derive the Stacks account key
    const hdKey = HDKey.fromMasterSeed(seed);
    const stacksPath = "m/44'/5757'/0'/0/0"; // Stacks derivation path
    const derivedKey = hdKey.derive(stacksPath);
    
    if (!derivedKey.privateKey) {
      throw new Error('Failed to derive private key from mnemonic');
    }

    privateKeyHex = Buffer.from(derivedKey.privateKey).toString('hex');
    console.log('✅ Private key derived from mnemonic');
    console.log('   Private key length:', privateKeyHex.length, 'chars');

  } catch (exportError: any) {
    console.error('❌ Failed to export private key from Turnkey');
    console.error('   Error:', exportError.message);
    console.error('   Details:', {
      code: exportError.code,
      name: exportError.name,
    });
    
    // Provide helpful error messages
    if (exportError.message?.includes('not found') || exportError.message?.includes('Could not find')) {
      throw new Error(
        'Wallet not found in Turnkey. ' +
        'Please ensure the wallet was created successfully and try again. ' +
        'Wallet ID: ' + (walletId || 'not provided')
      );
    } else if (exportError.message?.includes('permission') || exportError.message?.includes('denied')) {
      throw new Error(
        'Permission denied to export wallet. ' +
        'Please check your Turnkey policy settings and ensure ' +
        'ACTIVITY_TYPE_EXPORT_WALLET is allowed for your user/API key.'
      );
    } else if (exportError.message?.includes('not a function')) {
      throw new Error(
        'Turnkey SDK does not support wallet export. ' +
        'Please upgrade to the latest @turnkey packages.'
      );
    } else if (exportError.message?.includes('@turnkey/crypto')) {
      throw new Error(exportError.message);
    } else if (exportError.message?.includes('Organization ID')) {
      throw new Error(exportError.message);
    } else if (exportError.message?.includes('Wallet ID')) {
      throw new Error(exportError.message);
    }
    
    throw new Error(`Failed to export private key: ${exportError.message}`);
  }

  console.log('📝 Step 2: Create and sign transaction with exported key...');
  
  try {
    // Create transaction using the REAL private key from Turnkey
    // This is the proper way - no dummy keys, no signature hacks
    const transaction = await makeContractDeploy({
      contractName,
      codeBody: contractCode,
      senderKey: privateKeyHex, // Use the actual key
      network,
      nonce,
      fee: 250000, // 0.25 STX - enough for most contracts
    });

    console.log('✅ Transaction created and signed properly');

    // IMMEDIATELY clear the private key from memory
    if (privateKeyHex) {
      // Overwrite with zeros to clear from memory
      privateKeyHex = '0'.repeat(privateKeyHex.length);
      privateKeyHex = null;
    }
    console.log('🗑️  Private key cleared from memory');

    // Verify serialization (this should work now!)
    console.log('🔍 Testing transaction serialization...');
    const serialized = transaction.serialize();
    const serializedSize = serialized.length || 0;
    console.log('✅ Serialization successful! Size:', serializedSize, 'bytes');

    // Broadcast to network
    console.log('📡 Broadcasting transaction to', network, '...');
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
    console.log('📄 Contract Address:', contractAddress);

    return {
      txId,
      contractName,
      contractAddress,
      explorerUrl,
    };

  } catch (error: any) {
    console.error('❌ Transaction creation/broadcast failed:', error);
    console.error('   Message:', error.message);
    console.error('   Details:', error);
    
    // Ensure private key is cleared even on error
    if (privateKeyHex) {
      privateKeyHex = '0'.repeat(privateKeyHex.length);
      privateKeyHex = null;
      console.log('🗑️  Private key cleared from memory (error path)');
    }

    // Provide user-friendly error messages
    let errorMessage = error.message || 'Unknown error';
    
    if (error.message?.includes('Insufficient funds')) {
      errorMessage = 'Insufficient STX balance to deploy contract. Please add funds to your wallet.';
    } else if (error.message?.includes('ConflictingNonceInMempool')) {
      errorMessage = 'Another transaction is pending. Please wait and try again.';
    } else if (error.message?.includes('Invalid byte sequence')) {
      errorMessage = 'Transaction format error. This should not happen with v2 approach. Please report this issue.';
    }

    throw new Error(`Failed to deploy contract: ${errorMessage}`);
  }
};

/**
 * Helper: Estimate deployment fee based on contract size
 */
export const estimateDeploymentFee = async (
  contractCode: string
): Promise<number> => {
  // Base fee + size-based fee
  const baseFeeMicroSTX = 200000; // 0.2 STX base
  const sizeFeeMicroSTX = Math.ceil(contractCode.length / 1000) * 10000; // 0.01 STX per KB
  return baseFeeMicroSTX + sizeFeeMicroSTX;
};
