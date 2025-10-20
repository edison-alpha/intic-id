# 🎯 Quick Reference: Contract Integration Flow

## Simple Visual Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY - START TO FINISH                    │
└─────────────────────────────────────────────────────────────────────┘

👤 EVENT CREATOR
    │
    ├─ 1️⃣ CREATE (CreateEventNFT.tsx)
    │   ├─ Fill form (name, date, venue, price, supply)
    │   ├─ Upload image → IPFS
    │   ├─ Generate contract code
    │   └─ Deploy to blockchain ✅
    │       Contract: ST1ABC...XYZ.summer-fest-2025
    │
    ├─ 2️⃣ REGISTER (Auto - eventRegistry.ts)
    │   └─ Call event-registry.register-event()
    │       Registry assigns: event-id = u1
    │       Indexes: by category, by creator, by contract ✅
    │
    └─ 3️⃣ MANAGE (ContractManagement.tsx)
        ├─ View stats (minted, revenue)
        ├─ Update details (venue, date, image)
        └─ Request verification badge ✓

👤 TICKET BUYER
    │
    ├─ 4️⃣ DISCOVER (Browse.tsx)
    │   ├─ View all events by category
    │   ├─ Search by keyword
    │   ├─ Filter: verified ✓, featured ⭐, price, date
    │   └─ Sort: trending 🔥, newest, cheapest
    │       Data from: event-registry.get-category-events()
    │
    ├─ 5️⃣ VIEW DETAIL (EventDetail.tsx)
    │   ├─ See full event info
    │   ├─ View venue map 🗺️
    │   ├─ Check availability (850/1000 left)
    │   ├─ See floor price (if resale market active)
    │   └─ ❤️ Favorite event
    │       Data from: nft-ticket.get-event-details()
    │
    ├─ 6️⃣ BUY TICKET - PRIMARY (MintNFTButton)
    │   ├─ Pay 0.1 STX
    │   ├─ Receive NFT ticket (token-id #42)
    │   └─ Stats update: total-minted +1
    │       Call: nft-ticket.mint-ticket()
    │       Update: event-registry.update-mint-stats()
    │
    └─ 7️⃣ RESELL TICKET - SECONDARY (Marketplace)
        ├─ List ticket for 0.15 STX (50% markup)
        ├─ Buyer purchases
        ├─ Payment split:
        │   ├─ Platform: 2.5% (3,750 microSTX)
        │   ├─ Creator: 5% royalty (7,500 microSTX)
        │   └─ Seller: 92.5% (138,750 microSTX)
        └─ Stats update: volume +0.15 STX, floor price updated
            Call: nft-marketplace.buy-fixed-price()
            Update: event-registry.update-sale-stats()
```

---

## Contract Relationship Map

```
┌────────────────────────────────────────────────────────────────┐
│                       SMART CONTRACTS                          │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│ EVENT-REGISTRY.clar │ ◄─────── Central Registry (OpenSea Collections)
│ (Deployed Once)     │
│                     │
│ Functions:          │
│ • register-event    │ ◄─── CreateEventNFT calls after deploy
│ • get-event         │ ◄─── Browse/EventDetail reads
│ • track-view        │ ◄─── EventDetail increments views
│ • add-favorite      │ ◄─── User ❤️ events
│ • update-mint-stats │ ◄─── Called after mint
│ • update-sale-stats │ ◄─── Called after marketplace sale
│ • request-verify    │ ◄─── Creator requests ✓
│ • feature-event     │ ◄─── Admin adds ⭐
└──────┬──────────────┘
       │
       │ Indexes/References
       │
       ├───────────────┬───────────────┬──────────────────┐
       │               │               │                  │
       ▼               ▼               ▼                  ▼
┌────────────┐  ┌────────────┐  ┌────────────┐   ┌─────────────┐
│NFT-TICKET-1│  │NFT-TICKET-2│  │NFT-TICKET-3│   │NFT-TICKET-N │
│.clar       │  │.clar       │  │.clar       │   │.clar        │
│(Per Event) │  │(Per Event) │  │(Per Event) │   │(Per Event)  │
│            │  │            │  │            │   │             │
│Event:      │  │Event:      │  │Event:      │   │Event:       │
│Summer Fest │  │Rock Concrt │  │Tech Conf   │   │...          │
│            │  │            │  │            │   │             │
│Functions:  │  │Functions:  │  │Functions:  │   │Functions:   │
│• mint      │  │• mint      │  │• mint      │   │• mint       │
│• transfer  │  │• transfer  │  │• transfer  │   │• transfer   │
│• use-tickt │  │• use-tickt │  │• use-tickt │   │• use-tickt  │
│• refund    │  │• refund    │  │• refund    │   │• refund     │
│• update-*  │  │• update-*  │  │• update-*  │   │• update-*   │
└────────────┘  └────────────┘  └────────────┘   └─────────────┘
       │               │               │                  │
       │               │               │                  │
       └───────────────┴───────────────┴──────────────────┘
                               │
                               │ All tickets tradeable here
                               ▼
                    ┌─────────────────────┐
                    │ NFT-MARKETPLACE.clar│ ◄─── Trading Platform (OpenSea Market)
                    │ (Deployed Once)     │
                    │                     │
                    │ Functions:          │
                    │ • list-fixed-price  │ ◄─── Seller lists ticket
                    │ • list-auction      │ ◄─── Seller starts auction
                    │ • buy-fixed-price   │ ◄─── Buyer purchases
                    │ • place-bid         │ ◄─── Buyer bids
                    │ • make-offer        │ ◄─── Buyer makes offer
                    │ • accept-offer      │ ◄─── Seller accepts
                    │ • create-bundle     │ ◄─── Bundle tickets
                    │ • lend-nft          │ ◄─── NFT lending
                    └─────────────────────┘
```

---

## Data Storage: localStorage vs On-Chain

### ❌ BEFORE (localStorage only):
```javascript
localStorage: {
  "deployed-contracts-ST1ABC": [
    {
      contractAddress: "ST1ABC...XYZ.summer-fest",
      eventName: "Summer Fest",
      totalSupply: 1000,
      // Limited data, device-specific
    }
  ]
}

Problems:
❌ Clears when browser cache cleared
❌ Can't access from mobile/other device
❌ No global search/discovery
❌ No trading volume tracking
❌ No verification badges
```

### ✅ AFTER (On-chain registry):
```clarity
;; ON BLOCKCHAIN - event-registry.clar

(map-set events { event-id: u1 } {
  contract-address: 'ST1ABC...XYZ.summer-fest,
  event-name: "Summer Fest 2025",
  category: "music",
  venue: "Gelora Bung Karno",
  venue-coordinates: "-6.218,106.802",
  ticket-price: u100000,
  total-supply: u1000,
  total-minted: u850,
  total-volume: u12500000, ;; 12.5 STX traded
  total-sales: u75, ;; 75 secondary sales
  floor-price: u95000, ;; 0.095 STX
  views: u2500,
  favorites: u320,
  is-verified: true, ;; ✓
  is-featured: true, ;; ⭐
  ...
})

Benefits:
✅ Permanent, immutable record
✅ Accessible from any device
✅ Global discovery/search
✅ Real-time stats tracking
✅ Trust system (verified badges)
✅ Trading volume visible
✅ Floor price auto-calculated
```

---

## API Call Sequence

### When User Opens Browse Page:
```
1. Browse.tsx loads
2. Call: getEventsByCategory("music", 0, 20)
3. Contract: event-registry.get-category-events()
4. Returns: [event-id: u1, u5, u7, u12, ...]
5. For each event-id:
   - Call: getEventFromRegistry(eventId)
   - Contract: event-registry.get-event(u1)
   - Returns: Full event data
6. Display event cards with:
   - Image, title, venue, price
   - ✓ if verified
   - ⭐ if featured
   - Floor price if trading active
```

### When User Mints Ticket:
```
1. User clicks "Mint Ticket"
2. MintNFTButton.onClick()
3. Call: mintTicket(contractId, price)
4. Contract: nft-ticket.mint-ticket()
   - Transfer 0.1 STX: buyer → creator
   - Mint NFT: token-id #42 → buyer
5. Wait for tx confirmation
6. Call: updateMintStats(eventId, 1)
7. Contract: event-registry.update-mint-stats(u1, u1)
   - Increment total-minted: u849 → u850
   - Update tickets-remaining: auto-calculated
8. UI updates: "Ticket Minted! ✅"
9. Refresh EventDetail to show new availability
```

### When User Buys from Marketplace:
```
1. User clicks "Buy" on listing
2. Marketplace.buyListing(listingId)
3. Contract: nft-marketplace.buy-fixed-price(u123)
   - Calculate fees:
     * Platform: 2.5% → treasury
     * Creator: 5% royalty → original creator
     * Seller: 92.5% → previous owner
   - Transfer payments (3 transactions)
   - Transfer NFT: seller → buyer
4. Call: updateSaleStats(eventId, salePrice)
5. Contract: event-registry.update-sale-stats(u1, u150000)
   - Add to total-volume: u12350000 → u12500000
   - Increment total-sales: u74 → u75
   - Update floor-price if needed
6. UI updates: "Purchase Complete! ✅"
7. Refresh marketplace listings
```

---

## Quick Implementation Checklist

### Phase 1: Core Registry ✅
- [x] event-registry.clar contract created
- [ ] Deploy to testnet
- [ ] Get contract address
- [ ] Update .env: `VITE_EVENT_REGISTRY_CONTRACT=ST...XYZ.event-registry`

### Phase 2: Integration
- [ ] Update CreateEventNFT.tsx:
  ```typescript
  // After deploy success:
  await registerEventToRegistry({...eventData});
  ```

- [ ] Update Browse.tsx:
  ```typescript
  // Replace localStorage read:
  const events = await getEventsByCategory(category);
  ```

- [ ] Update MintNFTButton:
  ```typescript
  // After mint success:
  await updateMintStats(eventId, 1);
  ```

- [ ] Update Marketplace:
  ```typescript
  // After sale success:
  await updateSaleStats(eventId, salePrice);
  ```

### Phase 3: UI Enhancements
- [ ] Add ✓ verified badge
- [ ] Add ⭐ featured badge
- [ ] Show floor price
- [ ] Show trading volume
- [ ] Add favorites button ❤️
- [ ] Add view counter 👁️
- [ ] Add trending 🔥 sort

### Phase 4: Advanced Features
- [ ] Verification request UI
- [ ] Admin panel for approvals
- [ ] Featured events homepage section
- [ ] Analytics dashboard
- [ ] Platform stats page

---

## Environment Variables Needed

```bash
# .env
VITE_EVENT_REGISTRY_CONTRACT=ST1ABC...XYZ.event-registry
VITE_MARKETPLACE_CONTRACT=ST1ABC...XYZ.nft-marketplace
VITE_NETWORK=testnet

# Pinata (already configured)
VITE_PINATA_API_KEY=...
VITE_PINATA_SECRET=...
VITE_PINATA_JWT=...

# Google Maps (already configured)
VITE_GOOGLE_MAPS_API_KEY=...
```

---

## Testing Flow

1. **Deploy Registry**:
   ```bash
   clarinet contract deploy event-registry
   ```

2. **Create Event**:
   - Fill form in CreateEventNFT
   - Upload image
   - Deploy contract
   - ✅ Verify auto-registration call

3. **Browse Events**:
   - Open Browse page
   - ✅ Verify events loaded from registry
   - ✅ Check filters work

4. **Mint Ticket**:
   - Open EventDetail
   - Click Mint
   - ✅ Verify stats updated in registry

5. **Secondary Market**:
   - List ticket on marketplace
   - Another user buys
   - ✅ Verify volume/floor updated

---

Ini adalah complete guide untuk implementasi! Apakah ada bagian yang perlu saya jelaskan lebih detail? 🚀
