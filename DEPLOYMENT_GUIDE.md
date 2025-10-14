# NFT Ticketing Deployment Guide

## ✅ Smart Contract Deployment dengan Turnkey Wallet

Platform ini menggunakan **user's Turnkey wallet** untuk deploy smart contract NFT ticketing. Setiap user yang membuat event akan deploy contract mereka sendiri menggunakan wallet pribadi mereka.

---

## 🔐 Architecture Overview

### Flow Deployment:

```
User Login (Email/Passkey)
    ↓
Turnkey Creates Wallet
    ↓
User Connects Wallet
    ↓
User Fills Event Form
    ↓
User Clicks "Deploy NFT Contract"
    ↓
Turnkey Signs Transaction (NO private key export!)
    ↓
Contract Deployed to Stacks Testnet
    ↓
User Owns the Contract ✅
```

### Key Benefits:
- ✅ **User owns the contract** - Deployed from their own wallet
- ✅ **No platform wallet needed** - Each user pays for their own deployment
- ✅ **Secure** - Turnkey handles keys, no private key export
- ✅ **Simple UX** - Login with email/passkey
- ✅ **Non-custodial** - User controls their wallet

---

## 📋 Prerequisites

### 1. Environment Configuration

File `.env` sudah dikonfigurasi dengan Turnkey credentials:

```env
# Turnkey Configuration (✅ Already configured)
VITE_TURNKEY_ORGANIZATION_ID=47df936a-6c65-497a-b879-2a37f7570b8a
VITE_TURNKEY_AUTH_PROXY_CONFIG_ID=44059b55-6a77-4398-8586-0fffc86e4b12

# Network (✅ Already set to testnet)
VITE_NETWORK=testnet
```

### 2. User Wallet Requirements

User harus memiliki **STX balance** di wallet mereka untuk deploy contract:
- **Minimum Required**: 0.25 STX
- **Recommended**: 0.5 - 1 STX (untuk multiple deployments)

### 3. Getting Testnet STX

User bisa mendapatkan testnet STX dari faucet:
1. Connect wallet di aplikasi
2. Copy wallet address
3. Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet
4. Paste address dan request STX
5. Wait ~1 minute untuk receive

---

## 🚀 Deployment Steps (User Perspective)

### Step 1: Connect Wallet

1. Navigate ke `/create-ticket` page
2. Click **"Connect Wallet"** button
3. Authenticate dengan:
   - Email + verification code, atau
   - Passkey (biometric)
4. Turnkey creates/loads Stacks wallet
5. Wallet balance ditampilkan

### Step 2: Fill Event Details

Form fields:
- ✅ **Event Name** (required)
- ✅ **Event Date** (required)
- Event Time (optional)
- Venue Location (optional)
- Event Description (optional)
- Event Image (optional)
- Event Category (dropdown)
- Contract Template (dropdown)

### Step 3: Configure Tickets

Add ticket categories dengan:
- Category Name (e.g., "VIP", "General Admission")
- Price per ticket (in sBTC)
- Supply (total tickets available)
- Description

**Note**: Bisa add multiple categories dengan "Add Category" button

### Step 4: Set Contract Configuration

- **Royalty Percentage** (slider 0-10%)
  - Percentage yang akan diterima dari secondary market sales
- **Metadata URI** (optional)
  - Link ke external metadata (IPFS, etc)

### Step 5: Review Deployment Summary

System akan show:
- ✅ **Total Supply**: Sum of all ticket categories
- ✅ **Est. Revenue**: Projected revenue jika all tickets sold
- ✅ **Deployment Cost**: 0.25 STX (paid from user wallet)

### Step 6: Deploy Contract

1. **Balance Check**:
   - System checks STX balance
   - ✅ Green = Sufficient balance
   - ❌ Red = Insufficient, need to fund wallet

2. **Click "Deploy NFT Contract"**:
   - Transaction signed dengan Turnkey
   - Broadcast ke Stacks Testnet
   - Loading indicator shown

3. **Wait for Confirmation**:
   - Transaction appears on blockchain (~30 seconds)
   - Contract confirmed (~2-5 minutes)
   - Success message shown

### Step 7: View Deployment

Success screen shows:
- ✅ Contract Address
- ✅ Transaction ID
- ✅ Explorer Link
- Option to view in Dashboard

---

## 💻 Technical Implementation

### Files Involved:

1. **CreateTicket.tsx** - Main deployment UI
   ```typescript
   // Uses Turnkey wallet context
   const { isConnected, address, stxBalance, deployNFTContract } = useTurnkeyWallet();

   // Deploy with user's wallet
   await deployNFTContract(eventName, royaltyPercentage);
   ```

2. **TurnkeyWalletContext.tsx** - Wallet management
   ```typescript
   // NO private key export needed!
   const deployNFTContract = async (contractName, royaltyPercent) => {
     // Generate contract code
     const contractCode = stacksDeploymentService.generateContractCode(data);

     // Deploy using Turnkey signing
     await deployContractWithTurnkey({
       contractName,
       contractCode,
       publicKey,      // From Turnkey
       network: 'testnet',
       httpClient,     // Turnkey HTTP client
     });
   };
   ```

3. **turnkeyStacksSigner.ts** - Signing service
   ```typescript
   // Signs transaction WITHOUT exporting private key
   export const deployContractWithTurnkey = async (params) => {
     // Create transaction structure
     const transaction = await makeContractDeploy(...);

     // Sign with Turnkey API
     const signature = await httpClient.signRawPayload({
       payload,
       signWith: publicKey,
     });

     // Broadcast transaction
     await broadcastTransaction({ transaction, network });
   };
   ```

4. **stacksDeployment.ts** - Contract generation
   ```typescript
   // Generates SIP-009 compliant Clarity code
   generateContractCode(contractData) {
     return `
       ;; NFT Ticket Event Contract
       (define-non-fungible-token event-ticket uint)

       ;; SIP-009 functions
       (define-read-only (get-token-uri (token-id uint)) ...)
       (define-public (transfer ...) ...)

       ;; Ticket minting
       (define-public (mint-ticket ...) ...)

       ;; Secondary market with royalty
       (define-public (buy-listed-ticket ...) ...)
     `;
   }
   ```

---

## 🔍 Verification Steps

### After Deployment:

1. **Check Transaction Status**:
   ```bash
   # Visit Stacks Explorer
   https://explorer.hiro.so/txid/{TX_ID}?chain=testnet
   ```

2. **Verify Contract**:
   ```bash
   # API endpoint
   https://api.testnet.hiro.so/v2/contracts/interface/{CONTRACT_ADDRESS}
   ```

3. **Test Contract Functions**:
   - Call `get-event-info` to verify event details
   - Call `get-ticket-price` to check pricing
   - Try `mint-ticket` to test minting (if you have STX)

---

## 🎯 Cost Breakdown

### User Costs:

| Item | Cost | Paid By | Purpose |
|------|------|---------|---------|
| **Contract Deployment** | 0.25 STX | User Wallet | One-time contract deployment |
| **Ticket Minting** | Variable | Ticket Buyer | Per-ticket minting (set by event owner) |
| **Secondary Market** | Royalty % | Ticket Seller | Percentage to original creator |

### No Platform Fees for Deployment:
- ❌ No platform wallet needed
- ❌ No centralized deployment service
- ✅ User pays directly to blockchain
- ✅ User owns the contract fully

---

## 🛠️ Troubleshooting

### Issue: "Deployment wallet not configured"

**Cause**: Using wrong page (CreateEventNFT.tsx instead of CreateTicket.tsx)

**Solution**: Use `/create-ticket` route, NOT `/app/create-event-nft`

---

### Issue: "Insufficient STX Balance"

**Cause**: User wallet doesn't have enough STX

**Solution**:
1. Get wallet address dari UI
2. Visit testnet faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet
3. Request STX (usually get 500 STX instantly)
4. Refresh balance in app
5. Try deploy again

---

### Issue: "Turnkey authentication failed"

**Cause**: Turnkey session expired atau credentials wrong

**Solution**:
1. Logout dari app
2. Clear browser cache/cookies
3. Login again dengan email/passkey
4. Try deployment again

---

### Issue: "Transaction broadcast failed"

**Possible Causes**:
- Network congestion
- Invalid nonce
- Insufficient fee

**Solution**:
1. Check Stacks testnet status: https://status.hiro.so
2. Wait 1 minute dan try again
3. Check wallet has STX balance
4. Contact support if persists

---

## 📱 User Experience Flow

### Visual Indicators:

1. **Not Connected**:
   ```
   [!] Wallet Connection Required
   → Connect Wallet button shown
   ```

2. **Connected, Insufficient Balance**:
   ```
   [X] Insufficient STX Balance
   Your Balance: 0.10 STX
   Required: 0.25 STX
   → Button disabled: "Insufficient STX Balance"
   → Link to faucet shown
   ```

3. **Ready to Deploy**:
   ```
   [✓] Ready to deploy! Your wallet will pay for the deployment.
   Your Balance: 1.50 STX
   Required: 0.25 STX
   → Button enabled: "Deploy NFT Contract (0.25 STX)"
   ```

4. **Deploying**:
   ```
   [↻] Deploying with Your Wallet...
   → Loading spinner
   → Form disabled
   ```

5. **Success**:
   ```
   [✓] Contract Deployed Successfully!
   → Transaction ID shown
   → Explorer link
   → View in Dashboard button
   ```

---

## 🎓 For Developers

### Testing Locally:

```bash
# 1. Ensure .env configured
cat .env | grep TURNKEY

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev

# 4. Navigate to create ticket page
# http://localhost:5173/create-ticket

# 5. Connect wallet (use any email)

# 6. Get testnet STX from faucet

# 7. Fill form and deploy!
```

### Contract Customization:

Contract code generated di `stacksDeployment.ts`:
- Modify `generateContractCode()` function
- Add custom features (e.g., multi-day passes, upgrades)
- Update SIP-009 compliance if needed

---

## 🔗 Resources

- **Stacks Docs**: https://docs.stacks.co/
- **SIP-009 Standard**: https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md
- **Turnkey Docs**: https://docs.turnkey.com/
- **Testnet Faucet**: https://explorer.hiro.so/sandbox/faucet?chain=testnet
- **Explorer**: https://explorer.hiro.so/?chain=testnet

---

## ✅ Summary

**What We Built:**
1. ✅ User-owned NFT ticketing contracts
2. ✅ Turnkey wallet integration (no private keys!)
3. ✅ SIP-009 compliant smart contracts
4. ✅ Full secondary market dengan royalty
5. ✅ Easy deployment UX

**What Users Can Do:**
1. ✅ Login dengan email/passkey
2. ✅ Create event tanpa technical knowledge
3. ✅ Deploy contract dari wallet mereka sendiri
4. ✅ Earn royalty dari secondary market
5. ✅ Fully own dan control contract mereka

**What's Next:**
- 🔄 Add metadata hosting (IPFS)
- 🔄 Add QR code generation untuk validation
- 🔄 Add ticket scanning app
- 🔄 Add analytics dashboard
- 🔄 Add bulk minting untuk airdrops

---

**Ready to Deploy!** 🚀

Platform siap digunakan. Users tinggal connect wallet, fund dengan testnet STX, dan deploy NFT ticketing contracts mereka sendiri.

**No platform wallet needed. User pays, user owns. Simple.** ✅
