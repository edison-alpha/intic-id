# 🔄 INTIC Platform - Complete Integration Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTIC Platform Architecture                       │
│                     (OpenSea-like NFT Event Marketplace)                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │
│   (React)    │
└──────┬───────┘
       │
       ├─── CreateEventNFT.tsx ────────┐
       ├─── Browse.tsx ────────────────┤
       ├─── EventDetail.tsx ───────────┤
       ├─── ContractManagement.tsx ────┤
       └─── Marketplace.tsx ───────────┤
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Service Layer                                   │
├──────────────┬──────────────┬──────────────┬───────────────────────────┤
│ eventRegistry│ stacksReader │  nftIndexer  │   marketplaceService     │
│    .ts       │    .ts       │     .ts      │         .ts              │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬──────────────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Stacks Blockchain (Testnet)                          │
├──────────────┬──────────────┬──────────────┬───────────────────────────┤
│event-registry│nft-ticket-123│nft-ticket-456│  nft-marketplace         │
│   .clar      │    .clar     │    .clar     │      .clar               │
└──────────────┴──────────────┴──────────────┴───────────────────────────┘
```

---

## 📋 Complete User Flow

### **PHASE 1: Event Creation & Deployment**

#### Step 1.1: User Fills Form (CreateEventNFT.tsx)
```typescript
User Input:
├─ Event Name: "Summer Music Festival 2025"
├─ Event Date: 2025-08-15
├─ Venue: Search "Gelora Bung Karno" → Auto-fill coordinates
├─ Category: "Music"
├─ Ticket Price: 0.1 STX (or $10 USD with dynamic pricing)
├─ Total Supply: 1000 tickets
├─ Royalty: 5%
└─ Image: Upload → IPFS
```

#### Step 1.2: Upload to IPFS
```typescript
handleUploadToIPFS() {
  // 1. Upload image
  const imageUrl = await uploadImageToPinata(file);
  // Result: "ipfs://QmXxxx..."
  
  // 2. Generate metadata JSON
  const metadata = {
    name: "Summer Music Festival 2025 - Ticket #1",
    description: "NFT ticket for SMF 2025",
    image: imageUrl,
    properties: {
      event_name: "Summer Music Festival 2025",
      event_date: "2025-08-15T19:00:00Z",
      venue: "Gelora Bung Karno",
      venue_address: "Jl. Pintu Satu, Jakarta",
      venue_coordinates: "-6.218481,106.802046",
      ticket_type: "General Admission",
      category: "music"
    }
  };
  
  // 3. Upload metadata
  const metadataUrl = await uploadMetadataToPinata(metadata);
  // Result: "ipfs://QmYyyy..."
  
  setMetadataIpfsUrl(metadataUrl);
  setImageIpfsUrl(imageUrl);
  setStep('deploy');
}
```

#### Step 1.3: Generate Smart Contract
```typescript
handleDeployContract() {
  // Generate contract code with:
  const contractCode = `
    ;; Event: Summer Music Festival 2025
    ;; SIP-009 NFT Standard
    
    (define-non-fungible-token smf-2025-ticket uint)
    
    (define-constant total-supply u1000)
    (define-constant ticket-price u100000) ;; 0.1 STX in microSTX
    (define-constant royalty-percent u500) ;; 5%
    
    ;; Mutable event details
    (define-data-var event-name (string-ascii 256) "Summer Music Festival 2025")
    (define-data-var event-venue (string-ascii 256) "Gelora Bung Karno")
    (define-data-var venue-address (string-ascii 512) "Jl. Pintu Satu, Jakarta")
    (define-data-var venue-coordinates (string-ascii 64) "-6.218481,106.802046")
    (define-data-var event-date uint u1755302400000) ;; Aug 15, 2025
    (define-data-var event-image-uri (string-ascii 256) "ipfs://QmXxxx...")
    (define-data-var token-uri (string-ascii 256) "ipfs://QmYyyy...")
    
    ;; Mint function
    (define-public (mint-ticket) ...)
    
    ;; Update functions (owner only)
    (define-public (update-event-name (new-name (string-ascii 256))) ...)
    (define-public (update-venue-details ...) ...)
    (define-public (update-event-date (new-date uint)) ...)
  `;
  
  const contractName = "summer-music-festival-2025-1729260000";
  
  // Deploy via wallet
  const txId = await deployContract(contractName, contractCode);
  // Result: "0xabcd1234..."
}
```

#### Step 1.4: Deploy to Blockchain
```typescript
// Using Leather/Hiro wallet
const transaction = await openContractDeploy({
  contractName: "summer-music-festival-2025-1729260000",
  codeBody: contractCode,
  network: 'testnet',
  fee: 250000, // 0.25 STX
});

// Transaction broadcast
// txId: "0xabcd1234..."
// Status: "pending" → "success" (2-3 minutes)

// Contract Address: 
// "ST1ABC...XYZ.summer-music-festival-2025-1729260000"
```

---

### **PHASE 2: Event Registry Registration** 🆕

#### Step 2.1: Auto-Register After Deploy
```typescript
// In CreateEventNFT.tsx - After successful deploy
const contractId = `${wallet.address}.${contractName}`;

// 🔥 KEY INTEGRATION POINT
await registerEventToRegistry({
  contractAddress: contractId,
  contractName: contractName,
  eventName: formData.eventName,
  eventDescription: formData.description,
  category: formData.category, // "music"
  venue: formData.venue,
  venueAddress: formData.venueAddress,
  venueCoordinates: `${selectedVenue.lat},${selectedVenue.lon}`,
  eventDate: new Date(formData.eventDate).getTime(),
  ticketPrice: priceInMicroSTX, // 100000
  totalSupply: parseInt(formData.totalSupply), // 1000
  imageUri: imageIpfsUrl,
  metadataUri: metadataIpfsUrl,
});

// Blockchain Transaction:
// Function: event-registry.register-event()
// Fee: 0.01 STX registration fee
// Result: event-id = u1
```

#### Step 2.2: On-Chain Registry Storage
```clarity
;; EVENT-REGISTRY CONTRACT STATE

;; Event #1 stored:
(map-set events
  { event-id: u1 }
  {
    contract-address: 'ST1ABC...XYZ.summer-music-festival-2025-1729260000,
    contract-name: "summer-music-festival-2025-1729260000",
    creator: 'ST1ABC...XYZ,
    event-name: "Summer Music Festival 2025",
    event-description: "The biggest music festival...",
    category: "music",
    venue: "Gelora Bung Karno",
    venue-address: "Jl. Pintu Satu, Jakarta",
    venue-coordinates: "-6.218481,106.802046",
    event-date: u1755302400000,
    ticket-price: u100000,
    total-supply: u1000,
    image-uri: "ipfs://QmXxxx...",
    metadata-uri: "ipfs://QmYyyy...",
    is-active: true,
    is-verified: false, ;; ❌ Not verified yet
    is-featured: false, ;; ❌ Not featured yet
    registered-at: u123456,
    total-minted: u0, ;; 0 tickets sold initially
    total-volume: u0, ;; No trading volume yet
    total-sales: u0,
    floor-price: u0,
    views: u0,
    favorites: u0
  }
)

;; Index by contract address
(map-set contract-to-event-id
  'ST1ABC...XYZ.summer-music-festival-2025-1729260000
  u1
)

;; Index by creator
(map-set creator-events
  { creator: 'ST1ABC...XYZ, index: u0 }
  u1
)

;; Index by category
(map-set category-events
  { category: "music", index: u0 }
  u1
)
```

---

### **PHASE 3: Browse & Discovery**

#### Step 3.1: User Visits Browse Page
```typescript
// Browse.tsx

useEffect(() => {
  loadEvents();
}, [category, searchQuery]);

const loadEvents = async () => {
  // Option A: Get all events by category
  const musicEvents = await getEventsByCategory("music", 0, 20);
  
  // Option B: Get featured events
  const featured = await getFeaturedEvents();
  
  // Option C: Get creator's events (for "My Events" page)
  const myEvents = await getCreatorEvents(wallet.address, 0, 20);
  
  // Result: Array of event-ids
  // [u1, u5, u7, u12, ...]
  
  // For each event-id, fetch full details
  const eventsWithDetails = await Promise.all(
    eventIds.map(async (id) => {
      const event = await getEventFromRegistry(id);
      return {
        eventId: id,
        contractId: event.contract_address,
        title: event.event_name,
        image: event.image_uri,
        venue: event.venue,
        price: (event.ticket_price / 1000000).toFixed(2) + ' STX',
        date: new Date(event.event_date).toLocaleDateString(),
        isVerified: event.is_verified, // ✓ badge
        isFeatured: event.is_featured, // ⭐ badge
        floorPrice: event.floor_price, // Secondary market floor
        totalSales: event.total_sales,
        favorites: event.favorites,
      };
    })
  );
  
  setEvents(eventsWithDetails);
};
```

#### Step 3.2: Display Events
```tsx
<div className="grid grid-cols-3 gap-6">
  {events.map((event) => (
    <EventCard
      key={event.eventId}
      {...event}
      onClick={() => navigate(`/event/${event.contractId}`)}
    />
  ))}
</div>

// EventCard shows:
// - Image (from IPFS)
// - Title with ✓ verified badge
// - ⭐ if featured
// - Venue
// - Date
// - Price (or "Floor: X STX" if secondary market active)
// - ❤️ Favorites count
// - 👁️ Views count
```

---

### **PHASE 4: Event Detail & Primary Purchase**

#### Step 4.1: User Clicks Event
```typescript
// EventDetail.tsx

useEffect(() => {
  loadEventData();
  trackView(); // Increment view counter
}, [contractId]);

const loadEventData = async () => {
  // Get from registry
  const registryData = await getEventByContract(contractId);
  
  // Get real-time data from contract
  const contractData = await getEventDataFromContract(contractId);
  
  // Merge data
  const event = {
    ...registryData,
    ...contractData,
    // Registry provides: views, favorites, verification badge
    // Contract provides: live availability, minted count
  };
  
  setEvent(event);
};

const trackView = async () => {
  // Increment view counter in registry
  await trackEventView(wallet.privateKey, registryData.event_id);
  // This helps with "Trending" sort
};
```

#### Step 4.2: User Mints Ticket (Primary Purchase)
```typescript
const handleMint = async () => {
  // 1. Call NFT contract mint function
  const txId = await mintTicket(contractId, ticketPrice);
  
  // Wait for confirmation
  await waitForTransaction(txId);
  
  // 2. 🔥 Update registry stats
  await updateMintStats(
    wallet.privateKey,
    registryData.event_id,
    1 // quantity minted
  );
  
  // Registry updates:
  // total-minted: u0 → u1
  // tickets-remaining calculated automatically
  
  toast.success("Ticket minted! Check your wallet.");
};
```

---

### **PHASE 5: Secondary Market Listing**

#### Step 5.1: User Lists Ticket for Resale
```typescript
// In user's wallet, they own token-id #42

const listTicket = async () => {
  const listing = {
    tokenId: 42,
    contractAddress: contractId,
    price: 150000, // 0.15 STX (50% markup)
    royaltyPercentage: 500, // 5% to creator
    listingType: 'fixed', // or 'auction'
  };
  
  // Call marketplace contract
  const listingId = await nftMarketplace.listFixedPrice(listing);
  
  // Marketplace stores:
  (map-set listings u123 {
    token-id: u42,
    seller: 'ST1BUYER...ABC,
    contract-address: 'ST1ABC...XYZ.smf-2025-ticket,
    price: u150000,
    listed-at: u789456,
    is-active: true,
    listing-type: "fixed",
    royalty-percentage: u500
  })
};
```

#### Step 5.2: Browse Marketplace
```typescript
// Marketplace.tsx

const loadListings = async () => {
  // Get active listings for this event
  const listings = await getActiveListingsForContract(contractId);
  
  // Sort by price (find floor)
  listings.sort((a, b) => a.price - b.price);
  
  const floorPrice = listings[0]?.price || 0;
  
  // Display listings with filters
  // - Price: Low to High
  // - Recently Listed
  // - Ending Soon (for auctions)
};
```

---

### **PHASE 6: Secondary Market Purchase**

#### Step 6.1: User Buys from Marketplace
```typescript
const buyListedTicket = async (listingId) => {
  // Call marketplace buy function
  await nftMarketplace.buyFixedPrice(listingId);
  
  // Marketplace executes:
  // 1. Calculate fees:
  const platformFee = price * 0.025; // 2.5%
  const creatorRoyalty = price * 0.05; // 5%
  const sellerAmount = price - platformFee - creatorRoyalty;
  
  // 2. Transfer payments:
  // - Platform: 3,750 microSTX → Marketplace treasury
  // - Creator: 7,500 microSTX → Original event creator
  // - Seller: 138,750 microSTX → Previous owner
  
  // 3. Transfer NFT:
  (nft-transfer? smf-2025-ticket u42 seller buyer)
  
  // 4. 🔥 Update registry stats:
  await updateSaleStats(
    marketplace.key,
    registryData.event_id,
    150000 // sale price
  );
  
  // Registry updates:
  // total-volume: u0 → u150000
  // total-sales: u0 → u1
  // floor-price: u0 → u150000 (or lower if other listings exist)
};
```

---

### **PHASE 7: Advanced Features**

#### Feature 1: Verification Badge
```typescript
// ContractManagement.tsx

const requestVerification = async (eventId) => {
  // Creator pays 0.05 STX verification fee
  await requestVerificationBadge(wallet.privateKey, eventId);
  
  // Admin reviews and approves
  // (admin panel - separate feature)
  await approveVerification(admin.key, eventId, "Verified organizer");
  
  // Event gets ✓ blue checkmark
  (map-set events { event-id: u1 }
    (merge event { is-verified: true })
  )
};
```

#### Feature 2: Featured Event
```typescript
// Admin panel

const featureEvent = async (eventId) => {
  // Only platform admin can feature
  await featureEventOnPlatform(admin.key, eventId);
  
  // Event shows on homepage with ⭐
  (map-set events { event-id: u1 }
    (merge event { is-featured: true })
  )
  
  (map-set featured-events u0 u1)
};
```

#### Feature 3: Analytics Dashboard
```typescript
// Analytics.tsx

const loadAnalytics = async () => {
  // Platform-wide stats
  const platformStats = await getPlatformStats();
  // {
  //   total-events: u150,
  //   total-featured: u10,
  //   platform-treasury: u50000000 // 50 STX collected fees
  // }
  
  // Per-event stats
  const eventStats = await getEventFromRegistry(eventId);
  // {
  //   total-minted: u850 / u1000,
  //   total-volume: u125000000, // 125 STX trading volume
  //   total-sales: u75, // 75 secondary sales
  //   floor-price: u95000, // 0.095 STX
  //   views: u2500,
  //   favorites: u320
  // }
};
```

---

## 🔗 Contract Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTRACT CALLS                            │
└─────────────────────────────────────────────────────────────────┘

1. DEPLOY EVENT:
   User → CreateEventNFT.tsx
         → deployContract(name, code)
         → Blockchain: New contract deployed
         → registerEventToRegistry()
         → event-registry.register-event()
         → Registry: event-id assigned

2. BROWSE EVENTS:
   User → Browse.tsx
         → getEventsByCategory("music")
         → event-registry.get-category-events()
         → Returns: [event-id-1, event-id-2, ...]
         → For each: getEventFromRegistry(id)
         → Display cards

3. VIEW EVENT:
   User → EventDetail.tsx
         → getEventByContract(contractId)
         → event-registry.get-event-by-contract()
         → getEventDataFromContract(contractId)
         → nft-ticket-contract.get-event-details()
         → trackEventView(eventId)
         → event-registry.track-view()

4. MINT TICKET (Primary):
   User → MintNFTButton
         → mintTicket(contractId)
         → nft-ticket-contract.mint-ticket()
         → STX transfer: buyer → creator
         → NFT mint: ticket-id → buyer
         → updateMintStats(eventId, 1)
         → event-registry.update-mint-stats()

5. LIST FOR SALE (Secondary):
   User → MyTickets → List
         → listFixedPrice(tokenId, price)
         → nft-marketplace.list-fixed-price()
         → Creates listing-id

6. BUY FROM MARKETPLACE (Secondary):
   User → Marketplace → Buy
         → buyFixedPrice(listingId)
         → nft-marketplace.buy-fixed-price()
         → Payments: platform fee + royalty + seller
         → NFT transfer: seller → buyer
         → updateSaleStats(eventId, price)
         → event-registry.update-sale-stats()

7. REQUEST VERIFICATION:
   Creator → ContractManagement → Verify
            → requestVerification(eventId)
            → event-registry.request-verification()
            → Admin approves
            → event-registry.approve-verification()

8. FAVORITE EVENT:
   User → EventDetail → ❤️
         → addEventToFavorites(eventId)
         → event-registry.add-favorite()
```

---

## 📊 Data Flow Summary

| Phase | Frontend | Service | Contract | Result |
|-------|----------|---------|----------|--------|
| **1. Deploy** | CreateEventNFT.tsx | deployContract() | NFT-Ticket.clar | Contract Address |
| **2. Register** | Auto (after deploy) | registerEventToRegistry() | event-registry.clar | event-id |
| **3. Browse** | Browse.tsx | getEventsByCategory() | event-registry.clar | Event List |
| **4. View** | EventDetail.tsx | getEventDataFromContract() | NFT-Ticket + Registry | Full Event Data |
| **5. Mint** | MintNFTButton | mintTicket() | NFT-Ticket.clar | Token ID |
| **6. Stats Update** | Background | updateMintStats() | event-registry.clar | Updated Stats |
| **7. List** | MyTickets | listFixedPrice() | nft-marketplace.clar | Listing ID |
| **8. Buy** | Marketplace | buyFixedPrice() | nft-marketplace.clar | Transfer Complete |
| **9. Stats Update** | Background | updateSaleStats() | event-registry.clar | Volume Updated |

---

## 🎯 Key Integration Points

### ✅ CURRENT STATUS:
- [x] NFT Ticket contracts deployed
- [x] Primary minting works
- [x] Event details from contract
- [x] Google Maps venue preview
- [x] Update functions (venue, date, image)

### 🔧 TO IMPLEMENT:
- [ ] Event Registry contract deployment
- [ ] Auto-register after deploy
- [ ] Browse reads from registry
- [ ] Stats updates after mint/sale
- [ ] Verification badge system
- [ ] Featured events homepage
- [ ] Analytics dashboard
- [ ] Marketplace integration

---

## 📝 Next Steps

1. **Deploy event-registry.clar to testnet**
2. **Update CreateEventNFT.tsx** - Add registerEventToRegistry() call
3. **Update Browse.tsx** - Read from registry instead of localStorage
4. **Update MintNFTButton** - Call updateMintStats() after mint
5. **Create Marketplace UI** - Secondary market trading
6. **Add Analytics** - Platform-wide and per-event stats

---

## 🚀 Benefits of This Architecture

| Feature | Without Registry | With Registry |
|---------|-----------------|---------------|
| **Discovery** | localStorage only | Global, searchable |
| **Stats** | Manual calculation | Auto-tracked on-chain |
| **Verification** | No trust system | ✓ Badge system |
| **Featured** | Manual selection | Admin-controlled on-chain |
| **Analytics** | Limited | Comprehensive |
| **Multi-device** | Single device only | Access anywhere |
| **Trading Volume** | Unknown | Tracked automatically |
| **Floor Price** | Manual check | Auto-calculated |

This architecture creates a complete OpenSea-like experience for event tickets! 🎟️
