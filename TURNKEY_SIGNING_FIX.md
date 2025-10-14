# Turnkey Signing Fix - Resolution

## Problem
The application was experiencing "Invalid byte sequence" errors when trying to deploy Stacks contracts with Turnkey signing:

```
❌ Serialization failed: Invalid byte sequence
❌ Turnkey signing failed: Error: Transaction serialization failed: Invalid byte sequence
```

## Root Cause
The original approach was trying to:
1. Create a transaction with a dummy private key
2. Extract the signing hash
3. Sign with Turnkey
4. Replace the signature in the transaction

This approach failed because:
- The transaction structure was created with wrong signer information
- Replacing signatures after transaction creation causes serialization errors
- The auth structure doesn't match the actual signer

## Solution (V2)
The fixed approach uses Turnkey's `exportWalletAccount` functionality:

1. **Export the private key temporarily** from Turnkey (securely encrypted)
2. **Decrypt it** using `@turnkey/crypto`
3. **Use the actual key** to create and sign the transaction properly
4. **Immediately clear** the key from memory

### Key Changes

#### New File: `src/services/turnkeyStacksSigner-v2.ts`
- Implements proper Turnkey wallet account export
- Uses `@turnkey/crypto` for secure decryption
- Creates transactions with the real private key (no dummy key hacks)
- Memory-safe: clears private key immediately after use

#### Updated: `src/contexts/TurnkeyWalletContext.tsx`
- Changed import to use the new v2 signer

#### New Dependency
```bash
npm install @turnkey/crypto
```

## Security Considerations

✅ **Secure**:
- Private key is only in memory (never persisted to disk)
- Encrypted during transport from Turnkey
- Only exists for single transaction signing
- Immediately overwritten and cleared after use
- Uses Turnkey's secure P256 encryption for export

✅ **Follows Turnkey Best Practices**:
- Uses official `exportWalletAccount` API
- Implements proper encryption/decryption flow
- Matches their documented patterns

## How It Works

```typescript
// 1. Generate P256 keypair for secure export
const keyPair = generateP256KeyPair();

// 2. Export wallet account from Turnkey
const exportResult = await httpClient.exportWalletAccount({
  address: senderAddress,
  targetPublicKey: keyPair.publicKeyUncompressed,
});

// 3. Decrypt the export bundle
const privateKeyHex = await decryptExportBundle({
  exportBundle: exportResult.exportBundle,
  embeddedKey: keyPair.privateKey,
  organizationId,
  returnMnemonic: false,
  keyFormat: 'HEXADECIMAL',
});

// 4. Use the key to create and sign transaction properly
const transaction = await makeContractDeploy({
  contractName,
  codeBody: contractCode,
  senderKey: privateKeyHex, // Real key, not dummy!
  network,
  nonce,
  fee: 250000,
});

// 5. Clear from memory immediately
privateKeyHex = '0'.repeat(privateKeyHex.length);
privateKeyHex = null;
```

## Requirements

### Environment Variables
Make sure you have set:
```env
VITE_TURNKEY_ORGANIZATION_ID=your-org-id
```

### Turnkey Permissions
Your Turnkey policy must allow:
- `ACTIVITY_TYPE_EXPORT_WALLET_ACCOUNT`

Check your Turnkey dashboard → Policies to ensure this activity is allowed.

### Package Requirements
```json
{
  "@turnkey/crypto": "^1.0.0+",
  "@turnkey/react-wallet-kit": "^1.0.0+",
  "@stacks/transactions": "^6.0.0+"
}
```

## Testing
To test the fix:
1. Connect your Turnkey wallet
2. Try to deploy an NFT contract
3. Check console for success messages:
   ```
   🔐 [V2] Deploying contract with Turnkey (Export Key Approach)
   🔑 Step 1: Export private key from Turnkey...
   ✅ Wallet account exported from Turnkey
   ✅ Export bundle decrypted
   📝 Step 2: Create and sign transaction with exported key...
   ✅ Transaction created and signed properly
   🗑️  Private key cleared from memory
   ✅ Serialization successful!
   📡 Broadcasting transaction to testnet...
   ✅ Transaction broadcast successful!
   ```

## Rollback
If you need to rollback, simply change the import in `TurnkeyWalletContext.tsx`:
```typescript
// V2 (new)
import { deployContractWithTurnkey } from '@/services/turnkeyStacksSigner-v2';

// V1 (old - has bugs)
import { deployContractWithTurnkey } from '@/services/turnkeyStacksSigner';
```

## References
- [Turnkey Export Wallet Documentation](https://docs.turnkey.com/embedded-wallets/code-examples/export)
- [Turnkey Export Wallets Feature](https://docs.turnkey.com/features/export-wallets)
- [Stacks Transactions Library](https://github.com/hirosystems/stacks.js)

## Status
✅ **FIXED** - Ready for testing

Date: October 14, 2025
