# Turnkey Signing Troubleshooting Guide

## Common Error: "Invalid byte sequence"

### What This Means:
This error occurs when the transaction payload sent to Turnkey has an incorrect format. The signing service expects a specific hex format for the transaction hash.

### What We Fixed:

#### 1. **Removed `0x` Prefix from Payload**
```typescript
// ❌ BEFORE (WRONG):
const payload = `0x${preSignSigHash}`;

// ✅ AFTER (CORRECT):
const payload = preSignSigHash; // No 0x prefix!
```

**Why**: Turnkey's `signRawPayload` with `PAYLOAD_ENCODING_HEXADECIMAL` expects plain hex string without prefix.

#### 2. **Fixed Signature Assembly**
```typescript
// ✅ Proper signature assembly:
const { r, s, v } = signature;
const cleanR = r.startsWith('0x') ? r.slice(2) : r;
const cleanS = s.startsWith('0x') ? s.slice(2) : s;

// Format: recovery_byte (v) + r (32 bytes) + s (32 bytes) = 65 bytes total
const nextSig = `${v.toString(16).padStart(2, '0')}${cleanR.padStart(64, '0')}${cleanS.padStart(64, '0')}`;
```

#### 3. **Added Public Key Validation**
```typescript
// Parse and validate public key format
const cleanPubKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
const pubKeyBuffer = Buffer.from(cleanPubKey, 'hex');
console.log('Public key buffer length:', pubKeyBuffer.length); // Should be 33 (compressed) or 65 (uncompressed)
```

---

## How Turnkey Signing Works

### Flow Diagram:

```
1. Create Transaction Template
   ├─ Use dummy private key for structure
   └─ Get proper nonce from blockchain

2. Generate Signing Hash
   ├─ Calculate transaction hash
   ├─ Add spending condition (fee, nonce)
   └─ Create sigHashPreSign

3. Send to Turnkey for Signing
   ├─ Format: plain hex (no 0x prefix)
   ├─ Method: signRawPayload
   └─ Returns: { r, s, v }

4. Assemble Signature
   ├─ Format: v + r + s (65 bytes)
   └─ Update transaction auth

5. Update Transaction
   ├─ Replace dummy signer with real address
   ├─ Attach Turnkey signature
   └─ Transaction ready!

6. Broadcast to Stacks
   └─ Send to blockchain
```

---

## Debugging Steps

### Step 1: Check Console Logs

When deployment fails, check browser console for:

```
🔐 Deploying contract with Turnkey signing
📍 Sender address: STxxx...
📊 Current nonce: 0
📝 Creating transaction with Turnkey public key
🔑 Signing payload with Turnkey (length: 64)
```

Look for error at signing step.

### Step 2: Verify Payload Format

The payload should be:
- ✅ 64 characters (32 bytes hex)
- ✅ Only hex characters (0-9, a-f)
- ✅ No `0x` prefix
- ✅ No whitespace

Example valid payload:
```
a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd
```

### Step 3: Check Turnkey Response

If Turnkey returns signature:
```javascript
{
  r: "abc123...", // 64 chars
  s: "def456...", // 64 chars
  v: 0 or 1       // recovery id
}
```

### Step 4: Verify Signature Assembly

Assembled signature should be:
- ✅ 130 characters total
- ✅ Format: vv + rrrr...rrrr (64 chars) + ssss...ssss (64 chars)
- ✅ All hex characters

Example:
```
00a1b2c3...def456...
^^  r (32 bytes)  s (32 bytes)
v
```

---

## Still Getting Errors?

### Error: "Invalid byte sequence"

**Possible Causes:**
1. Public key format incorrect
2. Payload has `0x` prefix (should not have!)
3. Payload not valid hex

**Solution:**
```typescript
// Check in console:
console.log('Public key:', publicKey);
console.log('Payload:', payload);
console.log('Payload length:', payload.length); // Should be 64

// If payload has 0x, remove it:
const cleanPayload = payload.startsWith('0x') ? payload.slice(2) : payload;
```

---

### Error: "Turnkey wallet key not found"

**Cause**: The public key doesn't exist in Turnkey or session expired.

**Solution:**
1. Logout from app
2. Clear browser cache
3. Login again with email/passkey
4. Try deployment again

---

### Error: "Spending condition signer mismatch"

**Cause**: Address derived from public key doesn't match the signer in transaction.

**Solution:**
```typescript
// We update this automatically:
spendingCondition.signer = senderAddress;
spendingCondition.signature = createMessageSignature(nextSig);
```

Check that `senderAddress` matches Turnkey wallet address.

---

## Testing the Fix

### Quick Test:

1. **Start Dev Server**:
   ```bash
   npm run dev
   ```

2. **Open Browser Console** (F12)

3. **Navigate to Create Ticket**:
   ```
   http://localhost:5173/create-ticket
   ```

4. **Connect Wallet**:
   - Use any email
   - Authenticate with code

5. **Check Logs**:
   ```
   ✅ Turnkey wallet loaded: STxxx...
   ```

6. **Get Testnet STX**:
   - Copy address
   - Get from faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet

7. **Try Deploy**:
   - Fill event form
   - Click "Deploy NFT Contract"

8. **Watch Console**:
   ```
   🔐 Deploying contract with Turnkey signing
   📍 Public key buffer length: 33
   🔑 Signing payload with Turnkey (length: 64)
   ✅ Signature received from Turnkey
   📝 Assembled signature length: 130 chars
   📡 Broadcasting transaction...
   ✅ Transaction broadcast successful!
   ```

If you see all ✅, deployment worked! 🎉

---

## Advanced: Understanding the Signing Process

### Why We Use Dummy Key?

The `@stacks/transactions` library's `makeContractDeploy` requires a private key to set up the transaction structure (auth type, spending condition, etc.). Since we don't have the private key (Turnkey keeps it secure), we:

1. Use a **dummy private key** to create transaction structure
2. Extract the **signing hash** from that transaction
3. Send hash to **Turnkey** for signing
4. Replace dummy signature with **real Turnkey signature**
5. Update **signer address** to match Turnkey wallet
6. Broadcast complete transaction

This way, Turnkey never exposes the private key, but we still get a valid signed transaction!

### Security Benefits:

- ✅ Private key never leaves Turnkey's secure enclave
- ✅ No key export = no key theft risk
- ✅ User can't accidentally expose key
- ✅ Turnkey handles all cryptographic operations
- ✅ Transaction still fully valid on blockchain

### Transaction Flow:

```typescript
// 1. Create structure (with dummy key)
const dummyKey = makeRandomPrivKey();
const tx = await makeContractDeploy({
  senderKey: dummyKey, // ← Dummy!
  ...options
});

// 2. Get hash to sign
const sigHash = calculateSigHash(tx);

// 3. Sign with Turnkey (SECURE!)
const signature = await turnkey.sign(sigHash);

// 4. Replace auth
tx.auth.spendingCondition.signer = realAddress; // ← Real wallet!
tx.auth.spendingCondition.signature = signature; // ← Real signature!

// 5. Broadcast
await broadcastTransaction(tx);
```

---

## Need Help?

### Check These Files:

1. **turnkeyStacksSigner.ts** - Main signing logic
   - Line 113-124: Payload preparation
   - Line 140-156: Signature assembly
   - Line 158-172: Transaction update

2. **TurnkeyWalletContext.tsx** - Wallet management
   - Line 134-230: deployNFTContract function

3. **CreateTicket.tsx** - UI integration
   - Line 173-177: Balance check
   - Line 204-207: Deployment trigger

### Console Commands for Debugging:

```javascript
// Check Turnkey connection
console.log('Turnkey auth:', window.localStorage.getItem('turnkey_auth'));

// Check wallet
console.log('Wallet:', window.localStorage.getItem('user_wallet'));

// Check deployments
console.log('Deployments:', window.localStorage.getItem('nft_deployments'));
```

---

## Summary of Fixes Applied

| Issue | Status | Fix |
|-------|--------|-----|
| `0x` prefix in payload | ✅ Fixed | Removed prefix |
| Signature assembly | ✅ Fixed | Proper v+r+s format |
| Public key validation | ✅ Added | Buffer parsing + length check |
| Error messages | ✅ Improved | User-friendly messages |
| Debug logging | ✅ Enhanced | Detailed step logging |

**All fixes applied to**: `src/services/turnkeyStacksSigner.ts`

---

**Your deployment should now work!** 🚀

Try again and check the console logs. If you still see errors, check the logs and refer to this guide.
