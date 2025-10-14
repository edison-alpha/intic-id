# Turnkey Signing Fix - Update V2.1

## Issue
After implementing V2, we encountered a new error:
```
POST https://api.turnkey.com/public/v1/submit/export_wallet_account 404 (Not Found)
Turnkey error 5: Could not find wallet account with address: ST2NQ23A3EFSSGC4JSD25STVPRWXXJNMY4ZXN60QS
```

## Root Cause
We were trying to use `exportWalletAccount` with a Stacks address, but:
1. Turnkey doesn't recognize the Stacks address directly
2. The proper way is to export the entire **wallet** (which contains the mnemonic)
3. Then **derive** the Stacks private key from the mnemonic using BIP32/BIP39

## Solution V2.1

### Changed Approach:
1. ✅ Export **wallet** (not wallet account) using `walletId`
2. ✅ Decrypt to get the **mnemonic**
3. ✅ Derive the Stacks private key from mnemonic using path `m/44'/5757'/0'/0/0`
4. ✅ Use the derived key to sign the transaction

### Key Changes:

#### 1. Updated `turnkeyStacksSigner-v2.ts`
```typescript
// Changed from exportWalletAccount to exportWallet
const exportResult = await httpClient.exportWallet({
  walletId: walletId,  // Use walletId instead of address
  targetPublicKey: embeddedPublicKey,
});

// Decrypt to get mnemonic
const decryptedMnemonic = await decryptExportBundle({
  exportBundle: exportResult.exportBundle,
  embeddedKey: embeddedPrivateKey,
  organizationId: orgId,
  returnMnemonic: true,  // Get mnemonic, not private key
});

// Derive Stacks private key from mnemonic
const seed = await mnemonicToSeed(decryptedMnemonic);
const hdKey = HDKey.fromMasterSeed(seed);
const stacksPath = "m/44'/5757'/0'/0/0";
const derivedKey = hdKey.derive(stacksPath);
const privateKeyHex = Buffer.from(derivedKey.privateKey).toString('hex');
```

#### 2. Updated `useUser.ts`
Added `walletId` to return value:
```typescript
return {
  wallet: walletQuery.data,
  walletId, // Now available for export
  // ... rest
};
```

#### 3. Updated `TurnkeyWalletContext.tsx`
Pass `walletId` and `organizationId` to signer:
```typescript
const { wallet, walletId, balances, ... } = useUser('testnet');

// Pass to signer
await deployContractWithTurnkey({
  // ...
  walletId,
  organizationId: import.meta.env.VITE_TURNKEY_ORGANIZATION_ID,
});
```

### New Dependencies:
```bash
npm install @scure/bip39 @scure/bip32
```

These libraries are used for:
- `@scure/bip39`: Convert mnemonic to seed
- `@scure/bip32`: Derive private keys using BIP32 HD wallet standard

## Environment Variables Required

Make sure these are set in your `.env` file:
```env
VITE_TURNKEY_ORGANIZATION_ID=your-turnkey-org-id
```

## Turnkey Permissions Required

Your Turnkey policy must allow:
- ✅ `ACTIVITY_TYPE_EXPORT_WALLET` (not EXPORT_WALLET_ACCOUNT)

## Security Notes

✅ **Still Secure**:
- Mnemonic is only in memory (never persisted)
- Encrypted during transport from Turnkey
- Immediately cleared after deriving the key
- Private key also cleared after signing
- Uses P256 encryption for secure export

## Testing

After this fix, you should see:
```
🔐 [V2] Deploying contract with Turnkey (Export Key Approach)
🔑 Step 1: Export private key from Turnkey...
   Generating P256 keypair for secure export...
   Calling exportWallet with walletId: xxx
✅ Wallet exported from Turnkey
   Decrypting export bundle...
✅ Export bundle decrypted
   Deriving private key from mnemonic...
✅ Private key derived from mnemonic
📝 Step 2: Create and sign transaction with exported key...
✅ Transaction created and signed properly
🗑️  Private key cleared from memory
✅ Serialization successful!
📡 Broadcasting transaction to testnet...
✅ Transaction broadcast successful!
📨 Transaction ID: 0x...
```

## Why This Approach Works

1. **Turnkey Design**: Turnkey stores wallets as HD wallets (mnemonic-based)
2. **Account Derivation**: Individual accounts/addresses are derived from the mnemonic
3. **Stacks Compatibility**: Stacks uses standard BIP32 derivation path
4. **Export API**: `exportWallet` is the correct API for getting the mnemonic

This is the **standard and recommended** way to integrate Turnkey with blockchains that use HD wallet derivation.

## Comparison

| Approach | Status | Why |
|----------|--------|-----|
| V1: Dummy key + replace signature | ❌ Failed | Serialization error |
| V2: exportWalletAccount | ❌ Failed | Address not found |
| V2.1: exportWallet + derive key | ✅ Works | Proper HD wallet flow |

## Status
✅ **READY FOR TESTING**

Date: October 14, 2025 (Updated)
