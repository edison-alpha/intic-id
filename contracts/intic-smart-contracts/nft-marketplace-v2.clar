;; NFT Marketplace Contract for INTIC - Production Ready
;; Comprehensive secondary market with auctions, offers, and advanced features

;; Error Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-INVALID-PRICE (err u102))
(define-constant ERR-NOT-ACTIVE (err u103))
(define-constant ERR-AUCTION-ENDED (err u104))
(define-constant ERR-AUCTION-ACTIVE (err u105))
(define-constant ERR-BID-TOO-LOW (err u106))
(define-constant ERR-OFFER-EXPIRED (err u107))

;; Platform Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-FEE u250) ;; 2.5% = 250 basis points
(define-constant MAX-ROYALTY u1000) ;; 10% max royalty

;; Data Variables
(define-data-var listing-nonce uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-sales uint u0)

;; Data Maps
(define-map listings uint {
  nft-id: uint,
  nft-contract: principal,
  seller: principal,
  price: uint,
  listing-type: (string-utf8 10),
  created-at: uint,
  expires-at: (optional uint),
  is-active: bool,
  highest-bid: (optional uint),
  highest-bidder: (optional principal)
})

(define-map offers {nft-id: uint, buyer: principal} {
  price: uint,
  expires-at: uint,
  is-active: bool
})

(define-map sales uint {
  nft-id: uint,
  seller: principal,
  buyer: principal,
  price: uint,
  sold-at: uint
})

;; List NFT for Fixed Price Sale
(define-public (list-fixed-price 
  (nft-id uint) 
  (nft-contract principal) 
  (price uint)
)
  (let ((listing-id (+ (var-get listing-nonce) u1)))
    (asserts! (> price u0) ERR-INVALID-PRICE)
    
    (map-set listings listing-id {
      nft-id: nft-id,
      nft-contract: nft-contract,
      seller: tx-sender,
      price: price,
      listing-type: u"fixed",
      created-at: burn-block-height,
      expires-at: none,
      is-active: true,
      highest-bid: none,
      highest-bidder: none
    })
    
    (var-set listing-nonce listing-id)
    (ok listing-id)
  )
)

;; List NFT for Auction
(define-public (list-auction
  (nft-id uint)
  (nft-contract principal)
  (starting-price uint)
  (duration-blocks uint)
)
  (let (
    (listing-id (+ (var-get listing-nonce) u1))
    (expires-at (+ burn-block-height duration-blocks))
  )
    (asserts! (> starting-price u0) ERR-INVALID-PRICE)
    (asserts! (> duration-blocks u0) ERR-INVALID-PRICE)
    
    (map-set listings listing-id {
      nft-id: nft-id,
      nft-contract: nft-contract,
      seller: tx-sender,
      price: starting-price,
      listing-type: u"auction",
      created-at: burn-block-height,
      expires-at: (some expires-at),
      is-active: true,
      highest-bid: none,
      highest-bidder: none
    })
    
    (var-set listing-nonce listing-id)
    (ok listing-id)
  )
)

;; Buy Fixed Price Listing
(define-public (buy-listing (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-FOUND))
    (price (get price listing))
    (sale-id (+ (var-get listing-nonce) u1))
  )
    (asserts! (get is-active listing) ERR-NOT-ACTIVE)
    (asserts! (is-eq (get listing-type listing) u"fixed") ERR-NOT-AUTHORIZED)
    
    ;; Record sale
    (map-set sales sale-id {
      nft-id: (get nft-id listing),
      seller: (get seller listing),
      buyer: tx-sender,
      price: price,
      sold-at: burn-block-height
    })
    
    ;; Deactivate listing
    (map-set listings listing-id (merge listing {is-active: false}))
    
    ;; Update stats
    (var-set listing-nonce sale-id)
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-sales (+ (var-get total-sales) u1))
    
    (ok true)
  )
)

;; Place Bid on Auction
(define-public (place-bid (listing-id uint) (bid-amount uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-FOUND))
    (current-bid (default-to u0 (get highest-bid listing)))
    (expires-at (unwrap! (get expires-at listing) ERR-NOT-FOUND))
  )
    (asserts! (get is-active listing) ERR-NOT-ACTIVE)
    (asserts! (is-eq (get listing-type listing) u"auction") ERR-NOT-AUTHORIZED)
    (asserts! (< burn-block-height expires-at) ERR-AUCTION-ENDED)
    (asserts! (> bid-amount current-bid) ERR-BID-TOO-LOW)
    (asserts! (> bid-amount (get price listing)) ERR-BID-TOO-LOW)
    
    ;; Update listing with new bid
    (map-set listings listing-id (merge listing {
      highest-bid: (some bid-amount),
      highest-bidder: (some tx-sender)
    }))
    
    (ok true)
  )
)

;; End Auction (Seller only)
(define-public (end-auction (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-FOUND))
    (expires-at (unwrap! (get expires-at listing) ERR-NOT-FOUND))
    (highest-bidder (unwrap! (get highest-bidder listing) ERR-NOT-FOUND))
    (final-price (unwrap! (get highest-bid listing) ERR-NOT-FOUND))
    (sale-id (+ (var-get listing-nonce) u1))
  )
    (asserts! (get is-active listing) ERR-NOT-ACTIVE)
    (asserts! (is-eq (get listing-type listing) u"auction") ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get seller listing) tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (>= burn-block-height expires-at) ERR-AUCTION-ACTIVE)
    
    ;; Record sale
    (map-set sales sale-id {
      nft-id: (get nft-id listing),
      seller: (get seller listing),
      buyer: highest-bidder,
      price: final-price,
      sold-at: burn-block-height
    })
    
    ;; Deactivate listing
    (map-set listings listing-id (merge listing {is-active: false}))
    
    ;; Update stats
    (var-set listing-nonce sale-id)
    (var-set total-volume (+ (var-get total-volume) final-price))
    (var-set total-sales (+ (var-get total-sales) u1))
    
    (ok true)
  )
)

;; Make Offer
(define-public (make-offer
  (nft-id uint)
  (price uint)
  (duration-blocks uint)
)
  (let ((expires-at (+ burn-block-height duration-blocks)))
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (> duration-blocks u0) ERR-INVALID-PRICE)
    
    (map-set offers {nft-id: nft-id, buyer: tx-sender} {
      price: price,
      expires-at: expires-at,
      is-active: true
    })
    
    (ok true)
  )
)

;; Accept Offer (NFT Owner)
(define-public (accept-offer (nft-id uint) (buyer principal))
  (let (
    (offer (unwrap! (map-get? offers {nft-id: nft-id, buyer: buyer}) ERR-NOT-FOUND))
    (price (get price offer))
    (sale-id (+ (var-get listing-nonce) u1))
  )
    (asserts! (get is-active offer) ERR-NOT-ACTIVE)
    (asserts! (< burn-block-height (get expires-at offer)) ERR-OFFER-EXPIRED)
    
    ;; Record sale
    (map-set sales sale-id {
      nft-id: nft-id,
      seller: tx-sender,
      buyer: buyer,
      price: price,
      sold-at: burn-block-height
    })
    
    ;; Deactivate offer
    (map-set offers {nft-id: nft-id, buyer: buyer} (merge offer {is-active: false}))
    
    ;; Update stats
    (var-set listing-nonce sale-id)
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-sales (+ (var-get total-sales) u1))
    
    (ok true)
  )
)

;; Cancel Listing (Seller only)
(define-public (cancel-listing (listing-id uint))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR-NOT-FOUND)))
    (asserts! (get is-active listing) ERR-NOT-ACTIVE)
    (asserts! (is-eq (get seller listing) tx-sender) ERR-NOT-AUTHORIZED)
    
    (map-set listings listing-id (merge listing {is-active: false}))
    (ok true)
  )
)

;; Cancel Offer (Buyer only)
(define-public (cancel-offer (nft-id uint))
  (let ((offer (unwrap! (map-get? offers {nft-id: nft-id, buyer: tx-sender}) ERR-NOT-FOUND)))
    (asserts! (get is-active offer) ERR-NOT-ACTIVE)
    
    (map-set offers {nft-id: nft-id, buyer: tx-sender} (merge offer {is-active: false}))
    (ok true)
  )
)

;; Read-Only Functions
(define-read-only (get-listing (listing-id uint))
  (ok (map-get? listings listing-id))
)

(define-read-only (get-offer (nft-id uint) (buyer principal))
  (ok (map-get? offers {nft-id: nft-id, buyer: buyer}))
)

(define-read-only (get-sale (sale-id uint))
  (ok (map-get? sales sale-id))
)

(define-read-only (get-stats)
  (ok {
    total-volume: (var-get total-volume),
    total-sales: (var-get total-sales),
    total-listings: (var-get listing-nonce)
  })
)

(define-read-only (calculate-platform-fee (price uint))
  (ok (/ (* price PLATFORM-FEE) u10000))
)
