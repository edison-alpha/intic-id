# 📦 NFT Marketplace Contract - Bundle Sale Feature

## Contract Overview

**File**: `nft-marketplace.clar`  
**Purpose**: Secondary marketplace untuk INTIC platform dengan fitur:
- ✅ Fixed price sales
- ✅ Auctions (regular & Dutch)
- ✅ Bundle sales (multiple NFTs)
- ✅ Offers/Bids
- ✅ NFT lending/borrowing

## Bundle Sale Feature Explained

### What is a Bundle Sale?

Bundle sale memungkinkan user **menjual beberapa NFT sekaligus** dalam satu paket dengan harga total. Seperti "combo deal" atau "package deal".

**Contoh Use Case**:
- Menjual 3 tiket konser berbeda dalam 1 bundle dengan diskon
- Menjual koleksi NFT art series (NFT #1, #2, #3) sebagai set lengkap
- Package deal: VIP ticket + Meet & Greet pass + Merchandise NFT

### Code Breakdown

```clarity
;; Create bundle sale
(define-public (create-bundle-sale
  (name (string-utf8 256))           ;; Nama bundle: "VIP Concert Package"
  (description (string-utf8 1024))  ;; Deskripsi bundle
  (nft-ids (list 10 uint))          ;; List NFT IDs: (list u1 u2 u3)
  (total-price uint)                ;; Harga total bundle
)
```

**Validations**:
```clarity
(asserts! (> (len nft-ids) u1) ERR-INVALID-PRICE)  ;; Min 2 NFTs
(asserts! (> total-price u0) ERR-INVALID-PRICE)    ;; Price > 0
```

### Data Structures

#### 1. Listings Map Entry
```clarity
(map-set listings bundle-id {
  token-id: u0,              ;; Not used for bundles
  seller: tx-sender,         ;; Bundle creator/seller
  contract-address: ???,     ;; ⚠️ PROBLEM: Hardcoded placeholder!
  price: total-price,        ;; Total bundle price
  listed-at: current-time,   ;; When listed (block height)
  is-active: true,           ;; Active status
  listing-type: "bundle",    ;; Type identifier
  bundle-items: nft-ids,     ;; 📦 THE MAIN DATA: List of NFT IDs
  ...
})
```

#### 2. Bundles Map Entry
```clarity
(map-set bundles bundle-id {
  bundle-id: bundle-id,
  creator: tx-sender,
  name: name,                ;; "VIP Concert Package"
  description: description,  ;; Full description
  nft-ids: nft-ids,         ;; List of NFTs in bundle
  total-price: total-price,
  created-at: current-time,
  is-active: true
})
```

## ⚠️ Critical Issues Found

### Issue #1: Hardcoded Contract Address

```clarity
❌ CURRENT:
contract-address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VG4EYSCZRE6B, ;; Placeholder
```

**Problem**: 
- Placeholder address yang tidak valid
- Semua bundle akan punya contract address yang sama (salah!)
- Tidak fleksibel untuk different NFT contracts

**Solutions**:

**Option A**: Pass as parameter
```clarity
(define-public (create-bundle-sale
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (nft-ids (list 10 uint))
  (nft-contracts (list 10 principal))  ;; ← ADD THIS
  (total-price uint)
)
```

**Option B**: Use primary contract address
```clarity
contract-address: contract-address,  ;; Pass as parameter
```

**Option C**: Use this contract as bundle manager
```clarity
contract-address: (as-contract tx-sender),  ;; This marketplace contract
```

### Issue #2: Missing Error in end-auction

```clarity
Line 407:
(map-set price-history listing-id {
  sale-price: final-price,
  sold-at: current-time,  ;; ❌ undefined variable!
  buyer: highest-bidder,
  seller: (get seller listing)
})
```

**Fix**: Should be `burn-block-height`
```clarity
sold-at: burn-block-height,  ;; ✅ CORRECT
```

### Issue #3: Missing Fields in update-collection-stats

```clarity
(define-private (update-collection-stats (contract-address principal) (sale-price uint))
  (let (
    (current-stats (default-to {
      total-volume: u0,
      total-sales: u0,
      floor-price: u0,
      last-sale-price: u0,
      last-sale-time: u0  ;; ❌ Missing fields!
    } (map-get? collection-stats contract-address)))
```

Should match the map definition:
```clarity
(define-map collection-stats principal {
  total-volume: uint,
  total-sales: uint,
  floor-price: uint,
  last-sale-price: uint,
  last-sale-time: uint,
  top-bid: uint,       ;; ← MISSING!
  holders-count: uint  ;; ← MISSING!
})
```

## 🔧 Recommended Fixes

### Fix #1: Update create-bundle-sale

```clarity
(define-public (create-bundle-sale
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (nft-ids (list 10 uint))
  (nft-contract principal)  ;; ADD: contract address parameter
  (total-price uint)
)
  (let (
    (bundle-id (+ (var-get listing-counter) u1))
    (current-time burn-block-height)
  )
    (asserts! (> (len nft-ids) u1) ERR-INVALID-PRICE)
    (asserts! (> total-price u0) ERR-INVALID-PRICE)
    
    ;; Create listing for bundle
    (map-set listings bundle-id {
      token-id: u0,
      seller: tx-sender,
      contract-address: nft-contract,  ;; ✅ USE PARAMETER
      price: total-price,
      listed-at: current-time,
      is-active: true,
      listing-type: "bundle",
      auction-end: none,
      starting-price: none,
      current-bid: none,
      highest-bidder: none,
      bundle-items: nft-ids,
      royalty-percentage: u0,
      metadata-uri: none
    })
    
    ;; Create bundle record
    (map-set bundles bundle-id {
      bundle-id: bundle-id,
      creator: tx-sender,
      name: name,
      description: description,
      nft-ids: nft-ids,
      total-price: total-price,
      created-at: current-time,
      is-active: true
    })

    (var-set listing-counter bundle-id)
    (ok bundle-id)
  )
)
```

### Fix #2: Fix end-auction

```clarity
;; Record sale
(map-set price-history listing-id {
  sale-price: final-price,
  sold-at: burn-block-height,  ;; ✅ FIXED
  buyer: highest-bidder,
  seller: (get seller listing),
  royalty-paid: u0,
  platform-fee: platform-fee
})
```

### Fix #3: Fix update-collection-stats

```clarity
(current-stats (default-to {
  total-volume: u0,
  total-sales: u0,
  floor-price: u0,
  last-sale-price: u0,
  last-sale-time: u0,
  top-bid: u0,        ;; ✅ ADD
  holders-count: u0   ;; ✅ ADD
} (map-get? collection-stats contract-address)))
```

## 📚 How to Use Bundle Sale

### Frontend Integration Example:

```typescript
// Create a bundle sale
const createBundleSale = async () => {
  const functionArgs = [
    "VIP Concert Package",              // name
    "3 NFTs: VIP Ticket + Backstage + Merch", // description
    [1, 2, 3],                          // nft-ids
    contractAddress,                     // nft-contract
    1000000                             // price (1 STX)
  ];

  await openContractCall({
    contract: MARKETPLACE_CONTRACT,
    functionName: 'create-bundle-sale',
    functionArgs: functionArgs,
  });
};
```

### Buy a Bundle:

```typescript
// User buys the entire bundle
const buyBundle = async (bundleId: number) => {
  await openContractCall({
    contract: MARKETPLACE_CONTRACT,
    functionName: 'buy-fixed-price',  // Bundles use fixed price
    functionArgs: [bundleId],
  });
};
```

## 💡 Use Cases for INTIC Platform

1. **Event Package Deals**
   - VIP ticket + Meet & Greet + Merch = Bundle discount
   - Early bird bundle: 5 tickets at discounted rate

2. **Series Collections**
   - Complete concert tour pass (all venues)
   - Festival season pass (all events)

3. **Tiered Packages**
   - Bronze: 1 ticket
   - Silver: 2 tickets + 1 merch
   - Gold: 3 tickets + 2 merch + backstage pass

## 🎯 Summary

**Contract**: NFT Marketplace  
**Feature**: Bundle Sale (multi-NFT packages)  
**Status**: ⚠️ **Needs fixes before deployment**

**Must Fix**:
1. ✅ Remove hardcoded contract address - FIXED with parameter
2. ✅ Fix `current-time` undefined variable in end-auction
3. ✅ Fix missing fields in update-collection-stats default value

**After fixes**: Contract will be ready for deployment! 🚀
