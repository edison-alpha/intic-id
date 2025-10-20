# Troubleshooting: Transaction Broadcast Error

## Error Message
```
Unable to broadcast transaction
Your transaction failed to broadcast because of the error: 
failed to broadcast transaction (unable to parse node response).
```

## Root Causes & Solutions

### 1. **Clarity Value Format Issue** ✅ FIXED

**Problem**: Wallet providers expect Clarity values in hex format, not raw CV objects.

**Solution Applied**:
```typescript
// WalletContext.tsx - callContractFunction now converts CV to hex
const convertedArgs = params.functionArgs.map((arg: any) => {
  if (arg && typeof arg === 'object' && arg.type !== undefined) {
    const { serializeCV } = require('@stacks/transactions');
    const serialized = serializeCV(arg);
    return `0x${serialized.toString('hex')}`; // ✅ Convert to hex
  }
  return arg;
});
```

### 2. **Contract Address Format**

**Verify contract exists**:
```bash
# Check if registry contract is deployed
curl https://api.testnet.hiro.so/v2/contracts/interface/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/event-registry-event
```

**Expected format**:
```
{owner}.{contract-name}
ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.event-registry-event ✅
```

### 3. **Function Arguments Mismatch**

**Registry contract expects 13 parameters**:
```clarity
(define-public (register-event
    (contract-address principal)      ;; 1
    (contract-name (string-ascii 128)) ;; 2
    (event-name (string-utf8 256))     ;; 3
    (event-description (string-utf8 1024)) ;; 4
    (category (string-ascii 64))       ;; 5
    (venue (string-utf8 256))          ;; 6
    (venue-address (string-utf8 512))  ;; 7
    (venue-coordinates (string-ascii 64)) ;; 8
    (event-date uint)                  ;; 9 - Bitcoin block height!
    (ticket-price uint)                ;; 10 - micro-STX
    (total-supply uint)                ;; 11
    (image-uri (string-ascii 256))     ;; 12
    (metadata-uri (string-ascii 256))  ;; 13
  )
```

**Frontend sends 13 args** ✅:
```typescript
const functionArgs = [
  principalCV(contractId),           // 1 ✅
  stringAsciiCV(contractName),       // 2 ✅
  stringUtf8CV(formData.eventName),  // 3 ✅
  stringUtf8CV(description),         // 4 ✅
  stringAsciiCV(category),           // 5 ✅
  stringUtf8CV(venue),               // 6 ✅
  stringUtf8CV(venueAddress),        // 7 ✅
  stringAsciiCV(coordinates),        // 8 ✅
  uintCV(eventBlockHeight),          // 9 ✅ MUST be block height!
  uintCV(priceInMicroSTX),          // 10 ✅
  uintCV(totalSupply),              // 11 ✅
  stringAsciiCV(imageUri),          // 12 ✅
  stringAsciiCV(metadataUri),       // 13 ✅
];
```

### 4. **Common Value Errors**

#### ❌ String Too Long
```typescript
// Error: string longer than max length
stringAsciiCV('very-long-string-over-256-chars...')

// Fix: Truncate or validate
stringAsciiCV(contractName.substring(0, 128))
```

#### ❌ Invalid UTF-8
```typescript
// Error: Special chars in ASCII field
stringAsciiCV('Événement 🎉')

// Fix: Use UTF-8 for special chars
stringUtf8CV('Événement 🎉')
```

#### ❌ Timestamp Instead of Block Height
```typescript
// Error: Using timestamp (1730000000) instead of block height
uintCV(Date.now()) // ❌ Wrong!

// Fix: Convert to Bitcoin block height
const blockHeight = await timestampToBlockHeight(eventDate);
uintCV(blockHeight) // ✅ Correct! (~2500000 for testnet)
```

#### ❌ Price in STX Instead of micro-STX
```typescript
// Error: Price in STX
uintCV(10) // ❌ Only 10 micro-STX = 0.00001 STX

// Fix: Convert to micro-STX
uintCV(10 * 1_000_000) // ✅ 10 STX = 10,000,000 micro-STX
```

### 5. **Network Issues**

**Check wallet network**:
```typescript
// Ensure testnet
const response = await provider.request('stx_callContract', {
  contract: `${owner}.${name}`,
  functionName: 'register-event',
  functionArgs: convertedArgs,
  network: 'testnet', // ✅ Must match contract network
});
```

### 6. **Insufficient Balance**

**Registry charges 0.01 STX registration fee**:
```typescript
// Check balance before calling
const balance = await getBalance();
if (balance < 0.01) {
  throw new Error('Insufficient balance for registration fee');
}
```

---

## Debugging Steps

### 1. **Enable Console Logging**

Check browser console for:
```javascript
Registry contract call details: {
  registryOwner: 'ST1X7M...',
  registryName: 'event-registry-event',
  contractId: 'ST...user-event-123',
  functionName: 'register-event',
  argsCount: 13, // ✅ Should be 13
  eventBlockHeight: 2500123, // ✅ Should be ~2.5M for testnet
  priceInSmallestUnit: 10000000 // ✅ Should be in micro-STX
}

Calling contract: ST1X7M...event-registry-event
Function: register-event
Args (converted): ['0x0516...', '0x0d00...', ...] // ✅ Should be hex strings
```

### 2. **Verify Contract Deployed**

```bash
# PowerShell
Invoke-WebRequest -Uri "https://api.testnet.hiro.so/v2/contracts/interface/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/event-registry-event" | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "functions": [
    {
      "name": "register-event",
      "args": [...13 args...]
    }
  ]
}
```

### 3. **Test with Minimal Data**

Try with shortest possible values first:
```typescript
const functionArgs = [
  principalCV('ST1X7M...deployed-contract'),
  stringAsciiCV('test'),
  stringUtf8CV('Test Event'),
  stringUtf8CV('Test'),
  stringAsciiCV('general'),
  stringUtf8CV('Venue'),
  stringUtf8CV('Address'),
  stringAsciiCV('0,0'),
  uintCV(2500000), // Fixed block height
  uintCV(1000000), // 1 STX
  uintCV(100),
  stringAsciiCV('ipfs://test'),
  stringAsciiCV('ipfs://test'),
];
```

### 4. **Check Wallet Extension**

- ✅ Wallet unlocked?
- ✅ On testnet network?
- ✅ Sufficient STX balance (>0.01)?
- ✅ Extension up to date?

---

## Solutions Applied

### ✅ 1. Updated WalletContext.tsx
- Added Clarity value to hex conversion
- Added detailed logging
- Better error handling

### ✅ 2. Updated CreateEventNFT.tsx
- Added registry call logging
- Added error message parsing
- Validates block height conversion

### ✅ 3. Enhanced Error Messages
- Shows actual error from wallet
- Logs all error details to console
- Provides actionable feedback

---

## Testing Checklist

Before deploying event:

- [ ] Wallet connected and unlocked
- [ ] On testnet network
- [ ] Balance > 0.26 STX (0.25 deploy + 0.01 register)
- [ ] Registry contract deployed and accessible
- [ ] All form fields filled correctly
- [ ] Event date in future
- [ ] Valid venue coordinates (or 0,0)
- [ ] Image and metadata uploaded to IPFS

During deployment:

- [ ] TX #1 (deploy) broadcasts successfully
- [ ] Wait ~30-60s for confirmation
- [ ] Check console for "Registry contract call details"
- [ ] TX #2 (register) broadcasts successfully
- [ ] Check console for "Args (converted)" - should be hex

After deployment:

- [ ] Check both TXs on explorer
- [ ] Verify event in localStorage
- [ ] Check registry contract for event count

---

## Still Having Issues?

### Check Console Output

Look for these specific logs:
```
✅ Good:
- "Registry contract call details" with 13 args
- "Calling contract: ST1X7M...event-registry-event"
- "Args (converted): ['0x05...', ...]" (hex strings)

❌ Bad:
- "Args (converted): [{type: 'principal', ...}]" (objects, not hex)
- Error about "unable to parse node response"
- Missing or undefined values in args
```

### Manual Contract Call Test

Try calling with Stacks CLI:
```bash
clarinet console
(contract-call? .event-registry-event register-event 
  'ST1X7M...test
  "test-event"
  u"Test"
  u"Test"
  "general"
  u"Venue"
  u"Address"
  "0,0"
  u2500000
  u1000000
  u100
  "ipfs://test"
  "ipfs://test"
)
```

If this works but frontend doesn't → issue with frontend arg conversion
If this also fails → issue with contract itself

---

**Current Status**: ✅ All fixes applied, ready to test!
