;; Individual NFT Ticket Contract Template
;; Each event organizer deploys their own instance of this contract
;; Customizable supply, pricing, and metadata

(impl-trait .sip-009-nft-trait.nft-trait)

;; Contract Configuration (Set during deployment)
(define-constant CONTRACT-OWNER tx-sender)
(define-constant EVENT-ORGANIZER tx-sender)

;; Error Constants
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-SOLD-OUT (err u103))
(define-constant ERR-SALE-INACTIVE (err u104))
(define-constant ERR-INSUFFICIENT-PAYMENT (err u105))
(define-constant ERR-INVALID-PRICE (err u106))
(define-constant ERR-UNAUTHORIZED (err u107))
(define-constant ERR-TICKET-USED (err u108))

;; Data Variables (Customizable per deployment)
(define-data-var event-name (string-utf8 256) u"")
(define-data-var event-description (string-utf8 1024) u"")
(define-data-var event-date uint u0)
(define-data-var event-time uint u0)
(define-data-var event-venue (string-utf8 256) u"")
(define-data-var event-image-uri (string-utf8 256) u"")
(define-data-var base-metadata-uri (string-utf8 256) u"")

;; Supply and Pricing (Set by organizer)
(define-data-var total-supply uint u0)
(define-data-var available-supply uint u0)
(define-data-var ticket-price uint u0)
(define-data-var royalty-percentage uint u500) ;; 5% default

;; Sale Configuration
(define-data-var sale-active bool false)
(define-data-var early-access-enabled bool false)
(define-data-var early-access-ends uint u0)
(define-data-var sale-starts uint u0)
(define-data-var sale-ends uint u0)

;; Token tracking
(define-data-var last-token-id uint u0)

;; Token storage
(define-non-fungible-token event-ticket uint)

;; Token metadata
(define-map token-metadata uint {
  token-id: uint,
  owner: principal,
  tier: (string-utf8 32),
  seat-info: (optional (string-utf8 64)),
  mint-block: uint,
  mint-timestamp: uint,
  access-code: (string-utf8 64),
  is-used: bool,
  metadata-uri: (string-utf8 256)
})

;; User purchase tracking
(define-map user-purchases principal {
  total-tickets: uint,
  total-spent: uint,
  first-purchase: uint,
  tier-level: uint
})

;; Tier configurations (customizable)
(define-map tier-configs (string-utf8 32) {
  price-multiplier: uint, ;; 100 = 1x, 200 = 2x
  max-supply: uint,
  perks: (string-utf8 512),
  early-access: bool
})

;; Secondary market
(define-map listings uint {
  seller: principal,
  price: uint,
  listed-at: uint,
  is-active: bool
})

;; SIP-009 Implementation
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (get metadata-uri (unwrap! (map-get? token-metadata token-id) (err ERR-NOT-FOUND)))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? event-ticket token-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-TOKEN-OWNER))
    (asserts! (is-some (nft-get-owner? event-ticket token-id)) (err ERR-NOT-FOUND))
    (nft-transfer? event-ticket token-id sender recipient)))

;; Contract Initialization (Called during deployment)
(define-public (initialize-contract
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (date uint)
  (time uint)
  (venue (string-utf8 256))
  (image-uri (string-utf8 256))
  (metadata-uri (string-utf8 256))
  (supply uint)
  (price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    ;; Set event details
    (var-set event-name name)
    (var-set event-description description)
    (var-set event-date date)
    (var-set event-time time)
    (var-set event-venue venue)
    (var-set event-image-uri image-uri)
    (var-set base-metadata-uri metadata-uri)

    ;; Set supply and pricing
    (var-set total-supply supply)
    (var-set available-supply supply)
    (var-set ticket-price price)

    ;; Set default sale configuration
    (var-set sale-starts block-height)
    (var-set sale-ends (+ block-height u52560)) ;; ~1 year

    (ok true)))

;; Configure Tiers (Called by organizer)
(define-public (set-tier-config
  (tier-name (string-utf8 32))
  (price-multiplier uint)
  (max-supply uint)
  (perks (string-utf8 512))
  (early-access bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (map-set tier-configs tier-name {
      price-multiplier: price-multiplier,
      max-supply: max-supply,
      perks: perks,
      early-access: early-access
    })

    (ok true)))

;; Sale Management
(define-public (toggle-sale (active bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set sale-active active)
    (ok true)))

(define-public (set-sale-period (start-block uint) (end-block uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set sale-starts start-block)
    (var-set sale-ends end-block)
    (ok true)))

(define-public (set-early-access (enabled bool) (ends-block uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set early-access-enabled enabled)
    (var-set early-access-ends ends-block)
    (ok true)))

;; Ticket Purchase
(define-public (purchase-ticket
  (tier (string-utf8 32))
  (seat-info (optional (string-utf8 64)))
  (quantity uint))
  (let ((current-supply (var-get available-supply))
        (base-price (var-get ticket-price))
        (tier-config (map-get? tier-configs tier))
        (user-data (default-to
          {total-tickets: u0, total-spent: u0, first-purchase: u0, tier-level: u1}
          (map-get? user-purchases tx-sender))))

    ;; Validations
    (asserts! (var-get sale-active) (err ERR-SALE-INACTIVE))
    (asserts! (>= block-height (var-get sale-starts)) (err ERR-SALE-INACTIVE))
    (asserts! (<= block-height (var-get sale-ends)) (err ERR-SALE-INACTIVE))
    (asserts! (>= current-supply quantity) (err ERR-SOLD-OUT))

    ;; Calculate price
    (let ((price-multiplier (default-to u100 (get price-multiplier tier-config)))
          (final-price (* (* base-price price-multiplier) quantity))
          (new-token-id (+ (var-get last-token-id) u1)))

      ;; Mint tickets
      (try! (mint-tickets-batch tx-sender tier seat-info quantity final-price))

      ;; Update user data
      (map-set user-purchases tx-sender {
        total-tickets: (+ (get total-tickets user-data) quantity),
        total-spent: (+ (get total-spent user-data) final-price),
        first-purchase: (if (is-eq (get total-tickets user-data) u0) block-height (get first-purchase user-data)),
        tier-level: (calculate-user-tier (+ (get total-spent user-data) final-price))
      })

      (ok new-token-id))))

;; Batch minting helper
(define-private (mint-tickets-batch
  (recipient principal)
  (tier (string-utf8 32))
  (seat-info (optional (string-utf8 64)))
  (quantity uint)
  (total-price uint))
  (let ((current-token-id (var-get last-token-id)))

    ;; Mint multiple tickets
    (try! (mint-ticket-recursive recipient tier seat-info quantity current-token-id))

    ;; Update supply
    (var-set available-supply (- (var-get available-supply) quantity))
    (var-set last-token-id (+ current-token-id quantity))

    (ok true)))

(define-private (mint-ticket-recursive
  (recipient principal)
  (tier (string-utf8 32))
  (seat-info (optional (string-utf8 64)))
  (remaining uint)
  (current-id uint))
  (if (is-eq remaining u0)
    (ok true)
    (let ((token-id (+ current-id u1))
          (access-code (generate-access-code token-id))
          (metadata-uri (concat (var-get base-metadata-uri) (uint-to-ascii token-id))))

      ;; Mint NFT
      (try! (nft-mint? event-ticket token-id recipient))

      ;; Store metadata
      (map-set token-metadata token-id {
        token-id: token-id,
        owner: recipient,
        tier: tier,
        seat-info: seat-info,
        mint-block: block-height,
        mint-timestamp: (unwrap-panic (get-block-info? time (- block-height u1))),
        access-code: access-code,
        is-used: false,
        metadata-uri: metadata-uri
      })

      ;; Recursive call for remaining tickets
      (mint-ticket-recursive recipient tier seat-info (- remaining u1) token-id))))

;; Secondary Market
(define-public (list-for-sale (token-id uint) (price uint))
  (let ((token-owner (unwrap! (nft-get-owner? event-ticket token-id) (err ERR-NOT-FOUND))))

    (asserts! (is-eq tx-sender token-owner) (err ERR-NOT-TOKEN-OWNER))
    (asserts! (> price u0) (err ERR-INVALID-PRICE))

    (map-set listings token-id {
      seller: tx-sender,
      price: price,
      listed-at: block-height,
      is-active: true
    })

    (ok true)))

(define-public (purchase-from-market (token-id uint))
  (let ((listing (unwrap! (map-get? listings token-id) (err ERR-NOT-FOUND)))
        (seller (get seller listing))
        (price (get price listing)))

    (asserts! (get is-active listing) (err ERR-SALE-INACTIVE))

    ;; Transfer NFT
    (try! (nft-transfer? event-ticket token-id seller tx-sender))

    ;; Update metadata owner
    (let ((metadata (unwrap! (map-get? token-metadata token-id) (err ERR-NOT-FOUND))))
      (map-set token-metadata token-id (merge metadata {owner: tx-sender})))

    ;; Remove listing
    (map-delete listings token-id)

    ;; Calculate royalties (implement payment logic here)

    (ok true)))

;; Ticket Validation
(define-public (use-ticket (token-id uint))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) (err ERR-NOT-FOUND)))
        (token-owner (unwrap! (nft-get-owner? event-ticket token-id) (err ERR-NOT-FOUND))))

    (asserts! (is-eq tx-sender token-owner) (err ERR-NOT-TOKEN-OWNER))
    (asserts! (not (get is-used metadata)) (err ERR-TICKET-USED))

    ;; Mark as used
    (map-set token-metadata token-id (merge metadata {is-used: true}))

    (ok true)))

(define-public (validate-access-code (token-id uint) (provided-code (string-utf8 64)))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) (err ERR-NOT-FOUND))))
    (ok (is-eq (get access-code metadata) provided-code))))

;; Utility Functions
(define-private (generate-access-code (token-id uint))
  (concat "TKT-" (uint-to-ascii token-id)))

(define-private (uint-to-ascii (value uint))
  "GENERATED") ;; Simplified

(define-private (calculate-user-tier (total-spent uint))
  (if (>= total-spent u10000000) u4  ;; Platinum
    (if (>= total-spent u5000000) u3 ;; Gold
      (if (>= total-spent u1000000) u2 ;; Silver
        u1)))) ;; Bronze

;; Read-only Functions
(define-read-only (get-event-info)
  {
    name: (var-get event-name),
    description: (var-get event-description),
    date: (var-get event-date),
    time: (var-get event-time),
    venue: (var-get event-venue),
    image-uri: (var-get event-image-uri),
    total-supply: (var-get total-supply),
    available-supply: (var-get available-supply),
    ticket-price: (var-get ticket-price),
    sale-active: (var-get sale-active),
    organizer: CONTRACT-OWNER
  })

(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata token-id))

(define-read-only (get-user-stats (user principal))
  (map-get? user-purchases user))

(define-read-only (get-tier-config (tier (string-utf8 32)))
  (map-get? tier-configs tier))

(define-read-only (get-listing (token-id uint))
  (map-get? listings token-id))

(define-read-only (get-sales-stats)
  {
    total-supply: (var-get total-supply),
    available-supply: (var-get available-supply),
    sold: (- (var-get total-supply) (var-get available-supply)),
    last-token-id: (var-get last-token-id)
  })

;; Admin Functions
(define-public (update-metadata-uri (new-uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set base-metadata-uri new-uri)
    (ok true)))

(define-public (update-royalty (new-percentage uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (<= new-percentage u1000) (err ERR-INVALID-PRICE)) ;; Max 10%
    (var-set royalty-percentage new-percentage)
    (ok true)))

(define-public (emergency-mint (recipient principal) (quantity uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (try! (mint-tickets-batch recipient "emergency" none quantity u0))
    (ok true)))

(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set sale-active false)
    (ok true)))