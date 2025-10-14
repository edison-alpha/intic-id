;; NFT Ticket Contract for Pulse Robot Platform
;; Implements SIP-009 Non-Fungible Token Standard
;; Features: Event tickets as NFTs, royalties, access control, secondary market

(impl-trait .sip-009-nft-trait.nft-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-TICKET-USED (err u103))
(define-constant ERR-EVENT-NOT-FOUND (err u104))
(define-constant ERR-SALE-INACTIVE (err u105))
(define-constant ERR-INSUFFICIENT-PAYMENT (err u106))
(define-constant ERR-EVENT-ENDED (err u107))
(define-constant ERR-UNAUTHORIZED (err u108))
(define-constant ERR-INVALID-PRICE (err u109))
(define-constant ERR-SOLD-OUT (err u110))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var contract-uri (optional (string-utf8 256)) none)

;; Data Maps
(define-map token-count principal uint)
(define-map market (tuple (token-id uint) (listed bool))
  (tuple (price uint) (commission uint)))

;; Event Structure
(define-map events uint {
  event-id: uint,
  organizer: principal,
  name: (string-utf8 256),
  description: (string-utf8 1024),
  venue: (string-utf8 256),
  date: uint,
  time: uint,
  category: (string-utf8 64),
  ticket-price: uint,
  total-supply: uint,
  available-tickets: uint,
  royalty-percentage: uint,
  is-active: bool,
  early-access-enabled: bool,
  early-access-ends: uint,
  metadata-uri: (string-ascii 256)
})

;; Ticket Structure
(define-map tickets uint {
  ticket-id: uint,
  event-id: uint,
  owner: principal,
  seat-number: (optional (string-utf8 32)),
  tier: (string-utf8 32),
  purchase-price: uint,
  purchase-date: uint,
  is-used: bool,
  metadata-uri: (string-ascii 256),
  access-code: (string-utf8 64)
})

;; User Tier System for Proof of Fandom
(define-map user-tiers principal {
  tier: (string-utf8 32),
  tier-level: uint,
  discount-percentage: uint,
  early-access: bool,
  total-tickets-bought: uint,
  total-spent: uint,
  rewards-earned: uint
})

;; Royalty Recipients
(define-map royalty-recipients uint {
  event-organizer: principal,
  platform: principal,
  organizer-percentage: uint,
  platform-percentage: uint
})

;; Access Control
(define-map authorized-minters principal bool)
(define-map event-organizers principal bool)

;; SIP-009 Implementation
(define-non-fungible-token pulse-ticket uint)

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (get metadata-uri (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? pulse-ticket token-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-TOKEN-OWNER))
    (asserts! (is-some (nft-get-owner? pulse-ticket token-id)) (err ERR-NOT-FOUND))
    (nft-transfer? pulse-ticket token-id sender recipient)))

;; Event Management Functions

(define-public (create-event
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (venue (string-utf8 256))
  (date uint)
  (time uint)
  (category (string-utf8 64))
  (ticket-price uint)
  (total-supply uint)
  (royalty-percentage uint)
  (early-access-enabled bool)
  (early-access-ends uint)
  (metadata-uri (string-ascii 256)))
  (let ((event-id (+ (var-get last-token-id) u1)))
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER)
                  (default-to false (map-get? event-organizers tx-sender)))
              (err ERR-UNAUTHORIZED))
    (asserts! (<= royalty-percentage u1000) (err ERR-INVALID-PRICE)) ;; Max 10%
    (asserts! (> ticket-price u0) (err ERR-INVALID-PRICE))
    (asserts! (> total-supply u0) (err ERR-INVALID-PRICE))

    (map-set events event-id {
      event-id: event-id,
      organizer: tx-sender,
      name: name,
      description: description,
      venue: venue,
      date: date,
      time: time,
      category: category,
      ticket-price: ticket-price,
      total-supply: total-supply,
      available-tickets: total-supply,
      royalty-percentage: royalty-percentage,
      is-active: true,
      early-access-enabled: early-access-enabled,
      early-access-ends: early-access-ends,
      metadata-uri: metadata-uri
    })

    ;; Set royalty recipients
    (map-set royalty-recipients event-id {
      event-organizer: tx-sender,
      platform: CONTRACT-OWNER,
      organizer-percentage: (- u1000 u250), ;; 97.5% to organizer
      platform-percentage: u250 ;; 2.5% to platform
    })

    (ok event-id)))

(define-public (update-event-status (event-id uint) (is-active bool))
  (let ((event (unwrap! (map-get? events event-id) (err ERR-EVENT-NOT-FOUND))))
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER)
                  (is-eq tx-sender (get organizer event)))
              (err ERR-UNAUTHORIZED))
    (map-set events event-id (merge event { is-active: is-active }))
    (ok true)))

;; Ticket Purchase Functions

(define-public (buy-ticket
  (event-id uint)
  (seat-number (optional (string-utf8 32)))
  (tier (string-utf8 32)))
  (let (
    (event (unwrap! (map-get? events event-id) (err ERR-EVENT-NOT-FOUND)))
    (ticket-id (+ (var-get last-token-id) u1))
    (user-tier-data (default-to
      { tier: "bronze", tier-level: u1, discount-percentage: u0, early-access: false,
        total-tickets-bought: u0, total-spent: u0, rewards-earned: u0 }
      (map-get? user-tiers tx-sender)))
    (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
    )

    ;; Validations
    (asserts! (get is-active event) (err ERR-SALE-INACTIVE))
    (asserts! (> (get available-tickets event) u0) (err ERR-SOLD-OUT))
    (asserts! (> (get date event) current-time) (err ERR-EVENT-ENDED))

    ;; Check early access
    (if (get early-access-enabled event)
      (if (< current-time (get early-access-ends event))
        (asserts! (get early-access user-tier-data) (err ERR-UNAUTHORIZED))
        true)
      true)

    ;; Calculate final price with tier discount
    (let ((base-price (get ticket-price event))
          (discount (get discount-percentage user-tier-data))
          (final-price (- base-price (/ (* base-price discount) u10000))))

      ;; Update event available tickets
      (map-set events event-id
        (merge event { available-tickets: (- (get available-tickets event) u1) }))

      ;; Create ticket
      (map-set tickets ticket-id {
        ticket-id: ticket-id,
        event-id: event-id,
        owner: tx-sender,
        seat-number: seat-number,
        tier: tier,
        purchase-price: final-price,
        purchase-date: current-time,
        is-used: false,
        metadata-uri: (get metadata-uri event),
        access-code: (generate-access-code ticket-id)
      })

      ;; Mint NFT
      (unwrap! (nft-mint? pulse-ticket ticket-id tx-sender) (err ERR-NOT-TOKEN-OWNER))

      ;; Update last token ID
      (var-set last-token-id ticket-id)

      ;; Update user tier data
      (update-user-tier tx-sender final-price)

      (ok ticket-id))))

;; Secondary Market Functions

(define-public (list-ticket (token-id uint) (price uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? pulse-ticket token-id)) (err ERR-NOT-TOKEN-OWNER))
    (asserts! (> price u0) (err ERR-INVALID-PRICE))
    (asserts! (not (get is-used ticket)) (err ERR-TICKET-USED))

    (map-set market { token-id: token-id, listed: true }
      { price: price, commission: u500 }) ;; 5% commission
    (ok true)))

(define-public (unlist-ticket (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? pulse-ticket token-id)) (err ERR-NOT-TOKEN-OWNER))
    (map-delete market { token-id: token-id, listed: true })
    (ok true)))

(define-public (buy-listed-ticket (token-id uint))
  (let (
    (ticket (unwrap! (map-get? tickets token-id) (err ERR-NOT-FOUND)))
    (listing (unwrap! (map-get? market { token-id: token-id, listed: true }) (err ERR-NOT-FOUND)))
    (current-owner (unwrap! (nft-get-owner? pulse-ticket token-id) (err ERR-NOT-FOUND)))
    (event (unwrap! (map-get? events (get event-id ticket)) (err ERR-EVENT-NOT-FOUND)))
    (royalty-info (unwrap! (map-get? royalty-recipients (get event-id ticket)) (err ERR-NOT-FOUND)))
    (sale-price (get price listing))
    (commission (get commission listing))
    (royalty-percentage (get royalty-percentage event))
  )

    (asserts! (not (get is-used ticket)) (err ERR-TICKET-USED))

    ;; Calculate payments
    (let (
      (platform-fee (/ (* sale-price commission) u10000))
      (royalty-amount (/ (* sale-price royalty-percentage) u10000))
      (seller-amount (- sale-price platform-fee royalty-amount))
    )

      ;; Transfer NFT
      (unwrap! (nft-transfer? pulse-ticket token-id current-owner tx-sender) (err ERR-NOT-TOKEN-OWNER))

      ;; Update ticket owner
      (map-set tickets token-id (merge ticket { owner: tx-sender }))

      ;; Remove from market
      (map-delete market { token-id: token-id, listed: true })

      ;; Update user tier
      (update-user-tier tx-sender sale-price)

      (ok true))))

;; Ticket Validation Functions

(define-public (use-ticket (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? pulse-ticket token-id)) (err ERR-NOT-TOKEN-OWNER))
    (asserts! (not (get is-used ticket)) (err ERR-TICKET-USED))

    (map-set tickets token-id (merge ticket { is-used: true }))
    (ok true)))

(define-public (validate-access-code (token-id uint) (provided-code (string-utf8 64)))
  (let ((ticket (unwrap! (map-get? tickets token-id) (err ERR-NOT-FOUND))))
    (ok (is-eq (get access-code ticket) provided-code))))

;; User Tier Management

(define-private (update-user-tier (user principal) (amount-spent uint))
  (let ((current-tier (default-to
    { tier: "bronze", tier-level: u1, discount-percentage: u0, early-access: false,
      total-tickets-bought: u0, total-spent: u0, rewards-earned: u0 }
    (map-get? user-tiers user))))

    (let ((new-total-spent (+ (get total-spent current-tier) amount-spent))
          (new-total-tickets (+ (get total-tickets-bought current-tier) u1)))

      ;; Calculate new tier based on spending
      (let ((new-tier-data (calculate-tier new-total-spent new-total-tickets)))
        (map-set user-tiers user new-tier-data)
        true))))

(define-private (calculate-tier (total-spent uint) (total-tickets uint))
  (if (>= total-spent u100000000) ;; 1 sBTC
    { tier: "platinum", tier-level: u4, discount-percentage: u1500, early-access: true,
      total-tickets-bought: total-tickets, total-spent: total-spent, rewards-earned: u0 }
    (if (>= total-spent u50000000) ;; 0.5 sBTC
      { tier: "gold", tier-level: u3, discount-percentage: u1000, early-access: true,
        total-tickets-bought: total-tickets, total-spent: total-spent, rewards-earned: u0 }
      (if (>= total-spent u10000000) ;; 0.1 sBTC
        { tier: "silver", tier-level: u2, discount-percentage: u500, early-access: true,
          total-tickets-bought: total-tickets, total-spent: total-spent, rewards-earned: u0 }
        { tier: "bronze", tier-level: u1, discount-percentage: u0, early-access: false,
          total-tickets-bought: total-tickets, total-spent: total-spent, rewards-earned: u0 }))))

;; Utility Functions

(define-private (generate-access-code (token-id uint))
  (concat "ACCESS-" (uint-to-ascii token-id)))

(define-private (uint-to-ascii (value uint))
  "GENERATED") ;; Simplified for demo

;; Read-only Functions

(define-read-only (get-event (event-id uint))
  (map-get? events event-id))

(define-read-only (get-ticket (token-id uint))
  (map-get? tickets token-id))

(define-read-only (get-user-tier (user principal))
  (map-get? user-tiers user))

(define-read-only (get-listing (token-id uint))
  (map-get? market { token-id: token-id, listed: true }))

(define-read-only (get-tickets-by-owner (owner principal))
  (ok (default-to u0 (map-get? token-count owner))))

(define-read-only (get-event-tickets-sold (event-id uint))
  (let ((event (unwrap! (map-get? events event-id) (err ERR-EVENT-NOT-FOUND))))
    (ok (- (get total-supply event) (get available-tickets event)))))

;; Admin Functions

(define-public (set-authorized-minter (minter principal) (authorized bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (map-set authorized-minters minter authorized)
    (ok true)))

(define-public (set-event-organizer (organizer principal) (authorized bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (map-set event-organizers organizer authorized)
    (ok true)))

(define-public (set-contract-uri (uri (optional (string-utf8 256))))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set contract-uri uri)
    (ok true)))

;; Emergency Functions

(define-public (emergency-pause-event (event-id uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (let ((event (unwrap! (map-get? events event-id) (err ERR-EVENT-NOT-FOUND))))
      (map-set events event-id (merge event { is-active: false }))
      (ok true))))

(define-public (emergency-refund-ticket (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (not (get is-used ticket)) (err ERR-TICKET-USED))

    ;; Burn the NFT
    (unwrap! (nft-burn? pulse-ticket token-id (get owner ticket)) (err ERR-NOT-TOKEN-OWNER))

    ;; Mark ticket as used (refunded)
    (map-set tickets token-id (merge ticket { is-used: true }))

    (ok true)))