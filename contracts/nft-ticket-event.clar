;; NFT Ticket Event Contract - SIP-009 Compliant
;; Simplified contract for individual event deployment via Turnkey
;; Each event gets its own contract deployment

(impl-trait .sip-009-nft-trait.nft-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-TICKET-USED (err u103))
(define-constant ERR-SOLD-OUT (err u104))
(define-constant ERR-INVALID-PRICE (err u105))
(define-constant ERR-EVENT-ENDED (err u106))
(define-constant ERR-UNAUTHORIZED (err u107))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var event-name (string-utf8 256) u"")
(define-data-var event-description (string-utf8 1024) u"")
(define-data-var event-venue (string-utf8 256) u"")
(define-data-var event-date uint u0)
(define-data-var event-time (string-utf8 32) u"")
(define-data-var event-category (string-utf8 64) u"")
(define-data-var ticket-price uint u0)
(define-data-var total-supply uint u0)
(define-data-var available-tickets uint u0)
(define-data-var royalty-percentage uint u500) ;; Default 5%
(define-data-var metadata-base-uri (string-ascii 256) "")

;; NFT Definition
(define-non-fungible-token event-ticket uint)

;; Ticket Data
(define-map tickets uint {
  owner: principal,
  tier: (string-utf8 32),
  purchase-price: uint,
  purchase-date: uint,
  is-used: bool,
  seat-number: (optional (string-utf8 32))
})

;; Marketplace
(define-map listings uint {
  price: uint,
  seller: principal
})

;; ============================================
;; SIP-009 Standard Functions
;; ============================================

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (if (is-some (map-get? tickets token-id))
    (ok (some (var-get metadata-base-uri)))
    ERR-NOT-FOUND))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? event-ticket token-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
    (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
      (asserts! (not (get is-used ticket)) (err u108)) ;; Cannot transfer used ticket
      (try! (nft-transfer? event-ticket token-id sender recipient))
      (map-set tickets token-id (merge ticket { owner: recipient }))
      (ok true))))

;; ============================================
;; Initialization Function (called once after deployment)
;; ============================================

(define-public (initialize
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (venue (string-utf8 256))
  (date uint)
  (time (string-utf8 32))
  (category (string-utf8 64))
  (price uint)
  (supply uint)
  (royalty uint)
  (metadata-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (is-eq (var-get total-supply) u0) (err u109)) ;; Already initialized

    ;; Set event details
    (var-set event-name name)
    (var-set event-description description)
    (var-set event-venue venue)
    (var-set event-date date)
    (var-set event-time time)
    (var-set event-category category)
    (var-set ticket-price price)
    (var-set total-supply supply)
    (var-set available-tickets supply)
    (var-set royalty-percentage royalty)
    (var-set metadata-base-uri metadata-uri)

    (ok true)))

;; ============================================
;; Ticket Purchase Functions
;; ============================================

(define-public (mint-ticket (tier (string-utf8 32)) (seat (optional (string-utf8 32))))
  (let (
    (token-id (+ (var-get last-token-id) u1))
    (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
  )
    ;; Validations
    (asserts! (> (var-get available-tickets) u0) ERR-SOLD-OUT)
    (asserts! (> (var-get event-date) current-time) ERR-EVENT-ENDED)

    ;; Create ticket
    (try! (nft-mint? event-ticket token-id tx-sender))

    (map-set tickets token-id {
      owner: tx-sender,
      tier: tier,
      purchase-price: (var-get ticket-price),
      purchase-date: current-time,
      is-used: false,
      seat-number: seat
    })

    ;; Update counters
    (var-set last-token-id token-id)
    (var-set available-tickets (- (var-get available-tickets) u1))

    (ok token-id)))

;; ============================================
;; Ticket Usage
;; ============================================

(define-public (use-ticket (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? event-ticket token-id)) ERR-NOT-TOKEN-OWNER)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    (map-set tickets token-id (merge ticket { is-used: true }))
    (ok true)))

;; ============================================
;; Secondary Market
;; ============================================

(define-public (list-ticket (token-id uint) (price uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? event-ticket token-id)) ERR-NOT-TOKEN-OWNER)
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    (map-set listings token-id {
      price: price,
      seller: tx-sender
    })
    (ok true)))

(define-public (unlist-ticket (token-id uint))
  (begin
    (asserts! (is-eq (some tx-sender) (nft-get-owner? event-ticket token-id)) ERR-NOT-TOKEN-OWNER)
    (map-delete listings token-id)
    (ok true)))

(define-public (buy-listed-ticket (token-id uint))
  (let (
    (listing (unwrap! (map-get? listings token-id) ERR-NOT-FOUND))
    (ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND))
    (seller (get seller listing))
    (price (get price listing))
  )
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    ;; Transfer NFT
    (try! (nft-transfer? event-ticket token-id seller tx-sender))

    ;; Update ticket owner
    (map-set tickets token-id (merge ticket { owner: tx-sender }))

    ;; Remove listing
    (map-delete listings token-id)

    ;; Note: Payment handling should be done off-chain or via separate payment contract
    (ok true)))

;; ============================================
;; Read-only Functions
;; ============================================

(define-read-only (get-event-info)
  (ok {
    name: (var-get event-name),
    description: (var-get event-description),
    venue: (var-get event-venue),
    date: (var-get event-date),
    time: (var-get event-time),
    category: (var-get event-category),
    ticket-price: (var-get ticket-price),
    total-supply: (var-get total-supply),
    available-tickets: (var-get available-tickets),
    royalty-percentage: (var-get royalty-percentage)
  }))

(define-read-only (get-ticket-info (token-id uint))
  (ok (map-get? tickets token-id)))

(define-read-only (get-listing (token-id uint))
  (ok (map-get? listings token-id)))

(define-read-only (get-tickets-sold)
  (ok (- (var-get total-supply) (var-get available-tickets))))
