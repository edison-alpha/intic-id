# 🎫 NFT TICKET RESALE - QUICK REFERENCE

## 📊 SYSTEM ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│  (React + TypeScript + Stacks.js)                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CreateEventNFT.tsx  →  Deploy Custom Event Contract               │
│  MintTicketButton.tsx →  Buy Ticket (Primary Sale)                 │
│  MyTickets.tsx       →  View Owned Tickets                         │
│  ListTicketButton.tsx →  List Ticket for Resale [NEW]              │
│  ResaleMarket.tsx    →  Browse & Buy Resale Tickets [NEW]          │
│                                                                     │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                                 │
│  (Stacks Blockchain - Clarity Smart Contracts)                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  EVENT-{NAME}.clar (Custom per event)                       │  │
│  │  ✓ SIP-009 NFT Standard                                     │  │
│  │  ✓ mint-ticket() - Primary sale                            │  │
│  │  ✓ transfer() - Enable resale                              │  │
│  │  ✓ get-owner() - Ownership verification                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  NFT-MARKETPLACE-TICKET-RESALE.clar [NEW]                   │  │
│  │  ✓ list-ticket-for-resale() - Create listing               │  │
│  │  ✓ buy-resale-ticket() - Purchase + Transfer               │  │
│  │  ✓ list-ticket-auction() - Auction system                  │  │
│  │  ✓ place-bid() / end-auction()                             │  │
│  │  ✓ make-offer() / accept-offer()                           │  │
│  │  ✓ Payment distribution (seller/platform/organizer)        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 PRIMARY SALE FLOW (EXISTING)

```
┌─────────┐     ┌──────────────────┐     ┌──────────────┐     ┌────────────┐
│Organizer│────>│CreateEventNFT.tsx│────>│Deploy Event  │────>│Event Live  │
└─────────┘     └──────────────────┘     │Contract      │     │on-chain    │
                                          └──────────────┘     └────────────┘
                                                                      │
                                                                      ↓
┌─────────┐     ┌──────────────────┐     ┌──────────────┐     ┌────────────┐
│  Buyer  │────>│MintTicketButton  │────>│mint-ticket() │────>│NFT Minted  │
└─────────┘     │    .tsx          │     │Pay organizer │     │to Wallet   │
                └──────────────────┘     └──────────────┘     └────────────┘
```

---

## 🔁 SECONDARY SALE FLOW (NEW)

```
LISTING PHASE
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│Ticket Owner  │────>│ListTicketButton  │────>│list-ticket-for-     │
│(wants to sell│     │   .tsx           │     │resale()             │
│ ticket)      │     └──────────────────┘     └─────────────────────┘
└──────────────┘                                       │
                                                       ↓
                                            ┌─────────────────────┐
                                            │Verify Ownership     │
                                            │Create Marketplace   │
                                            │Listing              │
                                            └─────────────────────┘

PURCHASE PHASE
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│New Buyer     │────>│ResaleMarket.tsx  │────>│buy-resale-ticket()  │
│(browsing     │     │Browse & Buy      │     │                     │
│ marketplace) │     └──────────────────┘     └─────────────────────┘
└──────────────┘                                       │
                                                       ↓
                                            ┌─────────────────────┐
                                            │1. Transfer NFT      │
                                            │   seller → buyer    │
                                            │                     │
                                            │2. Distribute Payment│
                                            │   ├─ Seller 92.5%   │
                                            │   ├─ Platform 2.5%  │
                                            │   └─ Organizer 5%   │
                                            │                     │
                                            │3. Record Sale       │
                                            │4. Update Stats      │
                                            └─────────────────────┘
                                                       │
                                                       ↓
                                            ┌─────────────────────┐
                                            │NFT Now in Buyer's   │
                                            │Wallet - Ready to Use│
                                            └─────────────────────┘
```

---

## 💰 PAYMENT DISTRIBUTION

```
Example: Ticket Resale at 20 STX
Royalty: 5% | Platform Fee: 2.5%

┌────────────────────────────────┐
│   Buyer Pays: 20 STX           │
└────────────────────────────────┘
                │
                ↓
    ┌───────────┴───────────┐
    │                       │
    ↓                       ↓
┌─────────┐           ┌─────────┐
│ 18.5 STX│           │ 1.5 STX │
│ Seller  │           │  Fees   │
└─────────┘           └─────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
          ┌─────────┐           ┌─────────┐
          │ 0.5 STX │           │ 1.0 STX │
          │Platform │           │Organizer│
          │ (2.5%)  │           │  (5%)   │
          └─────────┘           └─────────┘
```

---

## 🎯 KEY FUNCTIONS REFERENCE

### FOR TICKET OWNERS (Sellers)

#### List Ticket Fixed Price
```typescript
// Frontend
await openContractCall({
  functionName: 'list-ticket-for-resale',
  functionArgs: [
    uintCV(tokenId),              // Your ticket ID
    principalCV(eventContract),   // Event contract
    uintCV(priceInMicroSTX),     // Your asking price
    uintCV(royaltyPercent),      // Organizer royalty (5% = 500)
    uintCV(originalPrice)         // Original purchase price
  ]
});
```

#### List Ticket Auction
```typescript
await openContractCall({
  functionName: 'list-ticket-auction',
  functionArgs: [
    uintCV(tokenId),
    principalCV(eventContract),
    uintCV(startingPrice),
    uintCV(durationBlocks),      // e.g., 144 blocks = ~1 day
    uintCV(royaltyPercent),
    uintCV(originalPrice)
  ]
});
```

#### Cancel Listing
```typescript
await openContractCall({
  functionName: 'cancel-listing',
  functionArgs: [uintCV(listingId)]
});
```

---

### FOR BUYERS

#### Buy Fixed Price Ticket
```typescript
await openContractCall({
  functionName: 'buy-resale-ticket',
  functionArgs: [uintCV(listingId)],
  postConditions: [
    makeStandardSTXPostCondition(
      userAddress,
      FungibleConditionCode.Equal,
      priceInMicroSTX
    )
  ]
});
```

#### Place Bid on Auction
```typescript
await openContractCall({
  functionName: 'place-bid',
  functionArgs: [
    uintCV(listingId),
    uintCV(bidAmount)
  ]
});
```

#### Make Offer
```typescript
await openContractCall({
  functionName: 'make-offer',
  functionArgs: [
    uintCV(tokenId),
    principalCV(eventContract),
    uintCV(offerPrice),
    uintCV(expirationBlocks)
  ]
});
```

---

### READ-ONLY QUERIES

#### Get Listing Details
```typescript
const result = await callReadOnlyFunction({
  functionName: 'get-listing',
  functionArgs: [uintCV(listingId)]
});
```

#### Get Marketplace Stats
```typescript
const stats = await callReadOnlyFunction({
  functionName: 'get-marketplace-stats',
  functionArgs: []
});
// Returns: { total-volume, total-sales, total-listings, platform-earnings }
```

#### Calculate Fees
```typescript
const platformFee = await callReadOnlyFunction({
  functionName: 'calculate-platform-fee',
  functionArgs: [uintCV(priceInMicroSTX)]
});

const sellerProceeds = await callReadOnlyFunction({
  functionName: 'calculate-seller-proceeds',
  functionArgs: [
    uintCV(priceInMicroSTX),
    uintCV(royaltyPercent)
  ]
});
```

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ DONE
- [x] Smart contract written (`nft-marketplace-ticket-resale.clar`)
- [x] Payment distribution logic
- [x] NFT transfer integration
- [x] Ownership verification
- [x] Auction system
- [x] Offer system
- [x] Analytics functions
- [x] Documentation

### 🔨 TODO - SMART CONTRACT
- [ ] Deploy to testnet
- [ ] Test all functions
- [ ] Security audit
- [ ] Deploy to mainnet
- [ ] Verify on Stacks Explorer

### 🔨 TODO - FRONTEND
- [ ] Create `ResaleMarket.tsx` page
- [ ] Create `ListTicketButton.tsx` component
- [ ] Enhance `MyTickets.tsx` with resale features
- [ ] Add marketplace navigation link
- [ ] Add price history charts
- [ ] Add notifications for sales/purchases
- [ ] Add marketplace analytics dashboard

### 🔨 TODO - INTEGRATION
- [ ] Update `CreateEventNFT.tsx` to include royalty %
- [ ] Add marketplace address to config
- [ ] Connect marketplace to event indexer
- [ ] Add resale data to event detail pages
- [ ] Test end-to-end flow

---

## 🚀 QUICK START DEPLOYMENT

### 1. Deploy Contract
```bash
# Using Clarinet
cd contracts/intic-smart-contracts
clarinet check nft-marketplace-ticket-resale.clar
clarinet test
clarinet deploy --testnet
```

### 2. Get Contract Address
```bash
# After deployment, note the contract address
# Example: ST2X0TJ4HTBJ8N3YY.nft-marketplace-ticket-resale
```

### 3. Update Frontend Config
```typescript
// src/config/marketplace.ts
export const MARKETPLACE_CONFIG = {
  address: 'ST2X0TJ4HTBJ8N3YY...',  // Your deployed address
  name: 'nft-marketplace-ticket-resale',
  network: 'testnet' // or 'mainnet'
};
```

### 4. Create Components
```bash
# Create new component files
touch src/components/ResaleMarket/ResaleMarket.tsx
touch src/components/ResaleMarket/ListTicketButton.tsx
touch src/components/ResaleMarket/TicketCard.tsx
```

### 5. Add Routes
```typescript
// src/App.tsx
import { ResaleMarket } from './components/ResaleMarket';

<Route path="/marketplace" element={<ResaleMarket />} />
```

### 6. Test Flow
```
1. Create test event
2. Mint test ticket
3. List ticket for resale
4. Buy from marketplace
5. Verify payment distribution
6. Verify NFT transfer
```

---

## 📖 CODE EXAMPLES

### Example: Full Resale Flow (TypeScript)

```typescript
import { openContractCall, callReadOnlyFunction } from '@stacks/connect';
import { uintCV, principalCV } from '@stacks/transactions';

// 1. USER LISTS TICKET
async function listMyTicket(
  tokenId: number,
  eventContract: string,
  resalePrice: number
) {
  const priceInMicroSTX = resalePrice * 1_000_000;
  
  await openContractCall({
    contractAddress: MARKETPLACE_CONFIG.address,
    contractName: MARKETPLACE_CONFIG.name,
    functionName: 'list-ticket-for-resale',
    functionArgs: [
      uintCV(tokenId),
      principalCV(eventContract),
      uintCV(priceInMicroSTX),
      uintCV(500), // 5% royalty
      uintCV(10 * 1_000_000) // Original price was 10 STX
    ],
    onFinish: (data) => {
      console.log('Listed!', data.txId);
      toast.success('Ticket listed for resale!');
    }
  });
}

// 2. BUYER BROWSES LISTINGS
async function getActiveListings() {
  const listings = [];
  const nonce = await callReadOnlyFunction({
    contractAddress: MARKETPLACE_CONFIG.address,
    contractName: MARKETPLACE_CONFIG.name,
    functionName: 'get-marketplace-stats',
    functionArgs: []
  });
  
  const totalListings = nonce.value['total-listings'].value;
  
  // Fetch each listing
  for (let i = 1; i <= totalListings; i++) {
    const listing = await callReadOnlyFunction({
      functionName: 'get-listing',
      functionArgs: [uintCV(i)]
    });
    
    if (listing.value && listing.value['is-active'].value) {
      listings.push(listing);
    }
  }
  
  return listings;
}

// 3. BUYER PURCHASES TICKET
async function buyResaleTicket(
  listingId: number,
  price: number
) {
  await openContractCall({
    contractAddress: MARKETPLACE_CONFIG.address,
    contractName: MARKETPLACE_CONFIG.name,
    functionName: 'buy-resale-ticket',
    functionArgs: [uintCV(listingId)],
    postConditions: [
      makeStandardSTXPostCondition(
        userAddress,
        FungibleConditionCode.Equal,
        price * 1_000_000
      )
    ],
    onFinish: (data) => {
      console.log('Purchased!', data.txId);
      toast.success('Ticket purchased successfully!');
    }
  });
}
```

---

## 🆘 TROUBLESHOOTING

### Issue: "ERR-NOT-OWNER"
**Cause:** Trying to list ticket you don't own  
**Solution:** Verify ownership with `get-owner` function first

### Issue: "ERR-TRANSFER-FAILED"
**Cause:** NFT contract doesn't implement `transfer` properly  
**Solution:** Ensure event contract has SIP-009 transfer function

### Issue: "Insufficient Balance"
**Cause:** Not enough STX to buy ticket  
**Solution:** Check balance with `hasEnoughSTX()` before purchase

### Issue: "Listing not found"
**Cause:** Invalid listing ID or listing was cancelled  
**Solution:** Query active listings first

---

## 📞 SUPPORT

- **Documentation:** `/docs/TICKET_RESALE_INTEGRATION.md`
- **Contract:** `/contracts/intic-smart-contracts/nft-marketplace-ticket-resale.clar`
- **Status:** `/docs/RESALE_IMPLEMENTATION_STATUS.md`
- **GitHub:** edison-alpha/intic-id

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0  
**Ready for:** Testnet Deployment
