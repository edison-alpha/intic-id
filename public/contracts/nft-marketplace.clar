;; NFT Marketplace Contract for INTIC Pulse Robot Platform
;; Comprehensive secondary market with auctions, offers, and advanced trading features

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-FEE u25) ;; 2.5% platform fee
(define-constant AUCTION-EXTENSION-TIME u144) ;; 1 day in blocks for auction extension
(define-constant MAX-OFFER-DURATION u1008) ;; 1 week max for offers
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-LISTED (err u101))
(define-constant ERR-ALREADY-LISTED (err u102))
(define-constant ERR-INSUFFICIENT-FUNDS (err u103))
(define-constant ERR-AUCTION-ENDED (err u104))
(define-constant ERR-AUCTION-ACTIVE (err u105))
(define-constant ERR-NOT-SELLER (err u106))
(define-constant ERR-NOT-BUYER (err u107))
(define-constant ERR-INVALID-PRICE (err u108))
(define-constant ERR-OFFER-EXPIRED (err u109))
(define-constant ERR-OFFER-NOT-FOUND (err u110))

;; Data Maps
(define-map listings uint {
  token-id: uint,
  seller: principal,
  contract-address: principal,
  price: uint,
  listed-at: uint,
  is-active: bool,
  listing-type: (string-utf8 32), ;; "fixed", "auction", "bundle"
  auction-end: (optional uint),
  starting-price: (optional uint),
  current-bid: (optional uint),
  highest-bidder: (optional principal),
  bundle-items: (list 10 uint), ;; For bundle sales
  royalty-percentage: uint, ;; Royalty for original creator
  metadata-uri: (optional (string-ascii 256))
})

(define-map offers {
  token-id: uint,
  buyer: principal
} {
  offer-price: uint,
  expires-at: uint,
  is-active: bool,
  created-at: uint,
  is-accepted: bool
})

(define-map price-history uint {
  sale-price: uint,
  sold-at: uint,
  buyer: principal,
  seller: principal,
  royalty-paid: uint,
  platform-fee: uint
})

(define-map collection-stats principal {
  total-volume: uint,
  total-sales: uint,
  floor-price: uint,
  last-sale-price: uint,
  last-sale-time: uint,
  top-bid: uint,
  holders-count: uint
})

(define-map bundles uint {
  bundle-id: uint,
  creator: principal,
  name: (string-utf8 256),
  description: (string-utf8 1024),
  nft-ids: (list 10 uint),
  total-price: uint,
  created-at: uint,
  is-active: bool
})

(define-map dutch-auctions uint {
  auction-id: uint,
  token-id: uint,
  seller: principal,
  contract-address: principal,
  starting-price: uint,
  ending-price: uint,
  start-block: uint,
  duration-blocks: uint,
  is-active: bool
})

(define-map nft-lending uint {
  loan-id: uint,
  nft-token-id: uint,
  nft-contract: principal,
  borrower: principal,
  lender: principal,
  collateral-amount: uint,
  interest-rate: uint,
  loan-start: uint,
  loan-duration: uint,
  is-active: bool,
  loan-status: (string-utf8 32) ;; "active", "repaid", "liquidated"
})

;; Constants for new features
(define-constant LOAN-STATUS-ACTIVE "active")
(define-constant LOAN-STATUS-REPAID "repaid")
(define-constant LOAN-STATUS-LIQUIDATED "liquidated")

;; Data Variables
(define-data-var listing-counter uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-sales uint u0)

;; List NFT for fixed price sale
(define-public (list-fixed-price
  (token-id uint)
  (contract-address principal)
  (price uint)
  (royalty-percentage uint)
  (metadata-uri (optional (string-ascii 256)))
)
  (let ((listing-id (+ (var-get listing-counter) u1)))
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (<= royalty-percentage u1000) ERR-INVALID-PRICE) ;; Max 10% royalty
    
    ;; Verify ownership through NFT contract call (simplified)
    ;; In real implementation, would call the NFT contract to verify ownership

    (map-set listings listing-id {
      token-id: token-id,
      seller: tx-sender,
      contract-address: contract-address,
      price: price,
      listed-at: (unwrap-panic (get-block-info? time u0)),
      is-active: true,
      listing-type: "fixed",
      auction-end: none,
      starting-price: none,
      current-bid: none,
      highest-bidder: none,
      bundle-items: (list u0),
      royalty-percentage: royalty-percentage,
      metadata-uri: metadata-uri
    })

    (var-set listing-counter listing-id)
    (ok listing-id)
  )
)

;; Create bundle sale
(define-public (create-bundle-sale
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (nft-ids (list 10 uint))
  (total-price uint)
)
  (let (
    (bundle-id (+ (var-get listing-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (> (len nft-ids) u1) ERR-INVALID-PRICE) ;; Bundle must have more than 1 NFT
    (asserts! (> total-price u0) ERR-INVALID-PRICE)
    
    ;; Verify ownership of all NFTs (simplified)
    ;; In real implementation, would verify each NFT ownership
    
    ;; Create individual listings for each NFT in the bundle
    (map-set listings bundle-id {
      token-id: u0, ;; Not applicable for bundles
      seller: tx-sender,
      contract-address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VG4EYSCZRE6B, ;; Placeholder
      price: total-price,
      listed-at: current-time,
      is-active: true,
      listing-type: "bundle",
      auction-end: none,
      starting-price: none,
      current-bid: none,
      highest-bidder: none,
      bundle-items: nft-ids,
      royalty-percentage: u0, ;; No royalty for bundle sales
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

;; List NFT for Dutch auction
(define-public (list-dutch-auction
  (token-id uint)
  (contract-address principal)
  (starting-price uint)
  (ending-price uint)
  (duration-blocks uint)
)
  (let (
    (auction-id (+ (var-get listing-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (> starting-price ending-price) ERR-INVALID-PRICE)
    (asserts! (> duration-blocks u0) ERR-INVALID-PRICE)
    
    ;; Verify ownership (simplified)
    
    (map-set dutch-auctions auction-id {
      auction-id: auction-id,
      token-id: token-id,
      seller: tx-sender,
      contract-address: contract-address,
      starting-price: starting-price,
      ending-price: ending-price,
      start-block: current-time,
      duration-blocks: duration-blocks,
      is-active: true
    })

    (var-set listing-counter auction-id)
    (ok auction-id)
  )
)

;; Buy Dutch auction at current price
(define-public (buy-dutch-auction (auction-id uint))
  (let (
    (auction (unwrap! (map-get? dutch-auctions auction-id) ERR-NOT-LISTED))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (blocks-elapsed (- current-time (get start-block auction)))
    (duration (get duration-blocks auction))
  )
    (asserts! (get is-active auction) ERR-NOT-LISTED)
    (asserts! (< blocks-elapsed duration) ERR-AUCTION-ENDED)
    
    ;; Calculate current price using linear decay
    (let (
      (start-price (get starting-price auction))
      (end-price (get ending-price auction))
      (price-range (- start-price end-price))
      (current-price (- start-price (/ (* price-range blocks-elapsed) duration)))
    )
      ;; Process the sale (simplified)
      ;; In real implementation, would handle payment and NFT transfer
      
      ;; Update auction status
      (map-set dutch-auctions auction-id
        (merge auction { is-active: false })
      )
      
      ;; Record sale in price history
      (let (
        (sale-id (+ (var-get listing-counter) u1))
      )
        (map-set price-history sale-id {
          sale-price: current-price,
          sold-at: current-time,
          buyer: tx-sender,
          seller: (get seller auction),
          royalty-paid: (/ (* current-price (get royalty-percentage auction)) u10000),
          platform-fee: (/ (* current-price PLATFORM-FEE) u1000)
        })
      )

      (ok current-price)
    )
  )
)

;; List NFT for auction
(define-public (list-auction
  (token-id uint)
  (contract-address principal)
  (starting-price uint)
  (auction-duration uint) ;; in blocks
)
  (let (
    (listing-id (+ (var-get listing-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (auction-end (+ current-time auction-duration))
  )
    (asserts! (> starting-price u0) ERR-INVALID-PRICE)
    (asserts! (> auction-duration u0) ERR-INVALID-PRICE)

    (map-set listings listing-id {
      token-id: token-id,
      seller: tx-sender,
      contract-address: contract-address,
      price: starting-price,
      listed-at: current-time,
      is-active: true,
      listing-type: "auction",
      auction-end: (some auction-end),
      starting-price: (some starting-price),
      current-bid: none,
      highest-bidder: none
    })

    (var-set listing-counter listing-id)
    (ok listing-id)
  )
)

;; Buy fixed price listing
(define-public (buy-fixed-price (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-LISTED))
    (price (get price listing))
    (platform-fee (/ (* price PLATFORM-FEE) u1000))
    (seller-revenue (- price platform-fee))
  )
    (asserts! (get is-active listing) ERR-NOT-LISTED)
    (asserts! (is-eq (get listing-type listing) "fixed") ERR-NOT-LISTED)

    ;; Transfer payment (would integrate with payment contract)
    ;; Transfer NFT ownership (would call NFT contract)

    ;; Update collection stats
    (update-collection-stats (get contract-address listing) price)

    ;; Record sale in price history
    (map-set price-history listing-id {
      sale-price: price,
      sold-at: (unwrap-panic (get-block-info? time u0)),
      buyer: tx-sender,
      seller: (get seller listing)
    })

    ;; Deactivate listing
    (map-set listings listing-id
      (merge listing { is-active: false })
    )

    ;; Update global stats
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-sales (+ (var-get total-sales) u1))

    (ok true)
  )
)

;; Place bid on auction
(define-public (place-bid (listing-id uint) (bid-amount uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-LISTED))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (auction-end (unwrap! (get auction-end listing) ERR-NOT-LISTED))
    (current-bid (default-to u0 (get current-bid listing)))
  )
    (asserts! (get is-active listing) ERR-NOT-LISTED)
    (asserts! (is-eq (get listing-type listing) "auction") ERR-NOT-LISTED)
    (asserts! (< current-time auction-end) ERR-AUCTION-ENDED)
    (asserts! (> bid-amount current-bid) ERR-INVALID-PRICE)

    ;; Extend auction if bid placed in last 10 minutes (144 blocks ≈ 10 min)
    (let ((extended-end (if (> (- auction-end current-time) u144)
                           auction-end
                           (+ current-time AUCTION-EXTENSION-TIME))))
      (map-set listings listing-id
        (merge listing {
          current-bid: (some bid-amount),
          highest-bidder: (some tx-sender),
          auction-end: (some extended-end)
        })
      )
    )

    (ok true)
  )
)

;; End auction and transfer NFT
(define-public (end-auction (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-LISTED))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (auction-end (unwrap! (get auction-end listing) ERR-NOT-LISTED))
    (highest-bidder (unwrap! (get highest-bidder listing) ERR-NOT-LISTED))
    (final-price (unwrap! (get current-bid listing) ERR-NOT-LISTED))
    (platform-fee (/ (* final-price PLATFORM-FEE) u1000))
    (seller-revenue (- final-price platform-fee))
  )
    (asserts! (get is-active listing) ERR-NOT-LISTED)
    (asserts! (is-eq (get listing-type listing) "auction") ERR-NOT-LISTED)
    (asserts! (>= current-time auction-end) ERR-AUCTION-ACTIVE)
    (asserts! (is-eq (get seller listing) tx-sender) ERR-NOT-SELLER)

    ;; Transfer payment and NFT
    ;; Update collection stats
    (update-collection-stats (get contract-address listing) final-price)

    ;; Record sale
    (map-set price-history listing-id {
      sale-price: final-price,
      sold-at: current-time,
      buyer: highest-bidder,
      seller: (get seller listing)
    })

    ;; Deactivate listing
    (map-set listings listing-id
      (merge listing { is-active: false })
    )

    ;; Update global stats
    (var-set total-volume (+ (var-get total-volume) final-price))
    (var-set total-sales (+ (var-get total-sales) u1))

    (ok true)
  )
)

;; Make offer on NFT
(define-public (make-offer
  (token-id uint)
  (contract-address principal)
  (offer-price uint)
  (duration-blocks uint)
)
  (let (
    (current-time (unwrap-panic (get-block-info? time u0)))
    (expires-at (+ current-time duration-blocks))
  )
    (asserts! (> offer-price u0) ERR-INVALID-PRICE)
    (asserts! (<= duration-blocks MAX-OFFER-DURATION) ERR-INVALID-PRICE)

    (map-set offers { token-id: token-id, buyer: tx-sender } {
      offer-price: offer-price,
      expires-at: expires-at,
      is-active: true,
      created-at: current-time,
      is-accepted: false
    })

    (ok true)
  )
)

;; Lend NFT against collateral
(define-public (lend-nft
  (token-id uint)
  (contract-address principal)
  (collateral-amount uint)
  (interest-rate uint) ;; In basis points (e.g., 500 = 5%)
  (loan-duration uint) ;; In blocks
)
  (let (
    (loan-id (+ (var-get listing-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (> collateral-amount u0) ERR-INVALID-PRICE)
    (asserts! (<= interest-rate u5000) ERR-INVALID-PRICE) ;; Max 50% interest rate
    (asserts! (> loan-duration u0) ERR-INVALID-PRICE)
    
    ;; Verify ownership of NFT (simplified)
    
    (map-set nft-lending loan-id {
      loan-id: loan-id,
      nft-token-id: token-id,
      nft-contract: contract-address,
      borrower: tx-sender, ;; Actually the lender in this context
      lender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VG4EYSCZRE6B, ;; Placeholder - would be actual lender
      collateral-amount: collateral-amount,
      interest-rate: interest-rate,
      loan-start: current-time,
      loan-duration: loan-duration,
      is-active: true,
      loan-status: LOAN-STATUS-ACTIVE
    })

    (var-set listing-counter loan-id)
    (ok loan-id)
  )
)

;; Borrow against NFT
(define-public (borrow-against-nft
  (token-id uint)
  (contract-address principal)
  (loan-amount uint)
  (interest-rate uint)
  (loan-duration uint)
)
  (let (
    (loan-id (+ (var-get listing-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (> loan-amount u0) ERR-INVALID-PRICE)
    (asserts! (<= interest-rate u5000) ERR-INVALID-PRICE) ;; Max 50% interest rate
    (asserts! (> loan-duration u0) ERR-INVALID-PRICE)
    
    ;; Verify ownership of NFT (simplified)
    
    (map-set nft-lending loan-id {
      loan-id: loan-id,
      nft-token-id: token-id,
      nft-contract: contract-address,
      borrower: tx-sender,
      lender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VG4EYSCZRE6B, ;; Placeholder - would be actual lender
      collateral-amount: loan-amount, ;; The loan amount serves as collateral value
      interest-rate: interest-rate,
      loan-start: current-time,
      loan-duration: loan-duration,
      is-active: true,
      loan-status: LOAN-STATUS-ACTIVE
    })

    (var-set listing-counter loan-id)
    (ok loan-id)
  )
)

;; Repay loan and reclaim NFT
(define-public (repay-loan (loan-id uint))
  (let (
    (loan (unwrap! (map-get? nft-lending loan-id) ERR-INVALID-PRICE))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (is-eq (get borrower loan) tx-sender) ERR-NOT-BUYER)
    (asserts! (get is-active loan) ERR-INVALID-PRICE)
    
    ;; Calculate interest
    (let (
      (loan-duration (get loan-duration loan))
      (start-time (get loan-start loan))
      (interest-rate (get interest-rate loan))
      (collateral-amount (get collateral-amount loan))
      (time-elapsed (- current-time start-time))
      (interest-amount (/ (* collateral-amount interest-rate time-elapsed) (* loan-duration u10000)))
      (total-amount (+ collateral-amount interest-amount))
    )
      ;; Process repayment (simplified)
      ;; In real implementation, would handle payment and NFT transfer back
      
      ;; Update loan status
      (map-set nft-lending loan-id
        (merge loan { 
          is-active: false,
          loan-status: LOAN-STATUS-REPAID
        })
      )

      (ok total-amount)
    )
  )
)

;; Accept offer
(define-public (accept-offer (token-id uint) (buyer principal))
  (let (
    (offer (unwrap! (map-get? offers { token-id: token-id, buyer: buyer }) ERR-OFFER-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (price (get offer-price offer))
    (platform-fee (/ (* price PLATFORM-FEE) u1000))
    (seller-revenue (- price platform-fee))
  )
    (asserts! (get is-active offer) ERR-OFFER-NOT-FOUND)
    (asserts! (< current-time (get expires-at offer)) ERR-OFFER-EXPIRED)

    ;; Verify ownership (simplified)
    ;; Transfer payment and NFT
    ;; Update collection stats
    (update-collection-stats tx-sender price) ;; contract-address would be passed

    ;; Record sale
    (map-set price-history token-id {
      sale-price: price,
      sold-at: current-time,
      buyer: buyer,
      seller: tx-sender
    })

    ;; Deactivate offer
    (map-set offers { token-id: token-id, buyer: buyer }
      (merge offer { is-active: false })
    )

    ;; Update global stats
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-sales (+ (var-get total-sales) u1))

    (ok true)
  )
)

;; Cancel listing
(define-public (cancel-listing (listing-id uint))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR-NOT-LISTED)))
    (asserts! (is-eq (get seller listing) tx-sender) ERR-NOT-SELLER)
    (asserts! (get is-active listing) ERR-NOT-LISTED)

    (map-set listings listing-id
      (merge listing { is-active: false })
    )

    (ok true)
  )
)

;; Helper function to update collection stats
(define-private (update-collection-stats (contract-address principal) (sale-price uint))
  (let (
    (current-stats (default-to {
      total-volume: u0,
      total-sales: u0,
      floor-price: u0,
      last-sale-price: u0,
      last-sale-time: u0
    } (map-get? collection-stats contract-address)))
    (new-volume (+ (get total-volume current-stats) sale-price))
    (new-sales (+ (get total-sales current-stats) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (map-set collection-stats contract-address {
      total-volume: new-volume,
      total-sales: new-sales,
      floor-price: (get floor-price current-stats), ;; Would need to calculate floor price
      last-sale-price: sale-price,
      last-sale-time: current-time
    })
  )
)

;; Read-only functions
(define-read-only (get-listing (listing-id uint))
  (map-get? listings listing-id)
)

(define-read-only (get-offer (token-id uint) (buyer principal))
  (map-get? offers { token-id: token-id, buyer: buyer })
)

(define-read-only (get-price-history (token-id uint))
  (map-get? price-history token-id)
)

(define-read-only (get-collection-stats (contract-address principal))
  (map-get? collection-stats contract-address)
)

(define-read-only (get-market-stats)
  {
    total-volume: (var-get total-volume),
    total-sales: (var-get total-sales)
  }
)

;; Get active listings (would need pagination in real implementation)
(define-read-only (get-active-listings)
  ;; Simplified - would return list of active listings
  (ok true)
)

;; Get floor price for collection
(define-read-only (get-floor-price (contract-address principal))
  (let ((stats (map-get? collection-stats contract-address)))
    (if (is-some stats)
      (ok (get floor-price (unwrap-panic stats)))
      (ok u0)
    )
  )
)</content>
<parameter name="filePath">D:\BAHAN PROJECT\pulse-robot-template-87267\contracts\intic-smart-contracts\nft-marketplace.clar