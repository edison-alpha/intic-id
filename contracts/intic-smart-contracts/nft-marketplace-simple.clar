;; NFT Marketplace Contract - Simplified Version for INTIC
;; Fixed price listings and auction system

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-FEE u25) ;; 2.5% platform fee
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-LISTED (err u101))
(define-constant ERR-NOT-SELLER (err u106))
(define-constant ERR-INVALID-PRICE (err u108))

;; Data Variables
(define-data-var listing-counter uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-sales uint u0)

;; Data Maps
(define-map listings uint {
  token-id: uint,
  seller: principal,
  nft-contract: principal,
  price: uint,
  listed-at: uint,
  is-active: bool
})

(define-map sale-history uint {
  sale-price: uint,
  sold-at: uint,
  buyer: principal,
  seller: principal
})

;; List NFT for sale
(define-public (list-nft
  (token-id uint)
  (nft-contract principal)
  (price uint)
)
  (let ((listing-id (+ (var-get listing-counter) u1)))
    (asserts! (> price u0) ERR-INVALID-PRICE)
    
    (map-set listings listing-id {
      token-id: token-id,
      seller: tx-sender,
      nft-contract: nft-contract,
      price: price,
      listed-at: burn-block-height,
      is-active: true
    })

    (var-set listing-counter listing-id)
    (ok listing-id)
  )
)

;; Buy NFT
(define-public (buy-nft (listing-id uint))
  (let (
    (listing (unwrap! (map-get? listings listing-id) ERR-NOT-LISTED))
    (price (get price listing))
  )
    (asserts! (get is-active listing) ERR-NOT-LISTED)

    ;; Record sale
    (map-set sale-history listing-id {
      sale-price: price,
      sold-at: burn-block-height,
      buyer: tx-sender,
      seller: (get seller listing)
    })

    ;; Deactivate listing
    (map-set listings listing-id
      (merge listing { is-active: false })
    )

    ;; Update stats
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

;; Read-only functions
(define-read-only (get-listing (listing-id uint))
  (ok (map-get? listings listing-id))
)

(define-read-only (get-sale-history (listing-id uint))
  (ok (map-get? sale-history listing-id))
)

(define-read-only (get-market-stats)
  (ok {
    total-volume: (var-get total-volume),
    total-sales: (var-get total-sales),
    total-listings: (var-get listing-counter)
  })
)
