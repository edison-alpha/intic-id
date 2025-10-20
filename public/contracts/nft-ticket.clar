;; NFT Ticket Contract for INTIC Pulse Robot Platform
;; Implements SIP-009 Non-Fungible Token Standard
;; Features: Event tickets as NFTs, royalties, access control, secondary market

(impl-trait .sip-009-nft-trait.nft-trait)

;; Define the NFT token
(define-non-fungible-token intic-nft-ticket uint)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-TICKET-USED (err u103))
(define-constant ERR-EVENT-NOT-FOUND (err u104))
(define-constant ERR-SALE-INACTIVE (err u105))
(define-constant ERR-INSUFFICIENT-PAYMENT (err u106))
(define-constant ERR-EVENT-ENDED (err u107)
(define-constant ERR-UNAUTHORIZED (err u108))
(define-constant ERR-INVALID-TIER (err u111))
(define-constant ERR-EARLY-ACCESS-ENDED (err u112))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var contract-uri (optional (string-utf8 256)) none)

;; Data Maps
(define-map token-count principal uint)

;; Event Structure
(define-map events uint {
  event-id: uint,
  organizer: principal,
  name: (string-utf8 256),
  description: (string-utf8 1024),
  venue: (string-utf8 256),
  location-lat: (string-ascii 32),  ;; Latitude for location-based features
  location-lng: (string-ascii 32),  ;; Longitude for location-based features
  date: uint,
  time: uint,
  end-date: uint,  ;; For multi-day events
  end-time: uint,
  category: (string-utf8 64),
  subcategory: (string-utf8 64),  ;; More specific categorization
  ticket-price: uint,
  total-supply: uint,
  available-tickets: uint,
  royalty-percentage: uint,
  is-active: bool,
  is-recurring: bool,  ;; For recurring events
  early-access-enabled: bool,
  early-access-ends: uint,
  access-requirements: (string-utf8 256),  ;; Special access requirements
  metadata-uri: (string-ascii 256),
  event-website: (optional (string-ascii 256)),  ;; Event website
  organizer-contacts: (string-utf8 256),  ;; Organizer contact info
  tags: (list 10 (string-utf8 32))  ;; Event tags for discovery
})

;; Ticket Structure
(define-map tickets uint {
  ticket-id: uint,
  event-id: uint,
  owner: principal,
  seat-number: (optional (string-utf8 32)),
  section: (optional (string-utf8 32)),  ;; Added section info
  row: (optional (string-utf8 32)),  ;; Added row info
  tier: (string-utf8 32),
  purchase-price: uint,
  purchase-date: uint,
  is-used: bool,
  is-shared: bool,  ;; For ticket sharing feature
  share-with: (optional principal),  ;; Principal that ticket is shared with
  access-code: (string-utf8 64),
  metadata-uri: (string-utf8 256),
  ticket-status: (string-utf8 32),  ;; "active", "transferred", "used", "expired"
  nfc-enabled: bool,  ;; For NFC-enabled tickets
  backup-codes: (list 3 (string-utf8 16))  ;; Backup access codes
})

;; Event counter
(define-data-var event-counter uint u0)

;; Ticket sharing permissions
(define-map ticket-sharing {
  ticket-id: uint,
  from-user: principal,
  to-user: principal
} {
  permission-type: (string-utf8 32),  // "view", "transfer", "access"
  granted-at: uint,
  expires-at: uint
})

;; Event reviews/ratings
(define-map event-reviews {
  event-id: uint,
  reviewer: principal
} {
  rating: uint,  // 1-5 stars
  review-text: (string-utf8 512),
  review-date: uint
})

;; Event categories
(define-map event-categories (string-utf8 64) uint)

;; Constants for new features
(define-constant TICKET-STATUS-ACTIVE "active")
(define-constant TICKET-STATUS-TRANSFERRED "transferred")
(define-constant TICKET-STATUS-USED "used")
(define-constant TICKET-STATUS-EXPIRED "expired")

(define-constant PERMISSION-VIEW "view")
(define-constant PERMISSION-TRANSFER "transfer")
(define-constant PERMISSION-ACCESS "access")

;; SIP-009: Get last token ID
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

;; SIP-009: Get token URI
(define-read-only (get-token-uri (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (ok (some (get metadata-uri ticket)))
  )
)

;; SIP-009: Get token owner
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? intic-nft-ticket token-id))
)

;; SIP-009: Transfer token
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
    (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
      (asserts! (not (get is-used ticket)) ERR-TICKET-USED)
      ;; Update ticket owner
      (map-set tickets token-id
        (merge ticket { owner: recipient })
      )
      ;; Transfer NFT
      (nft-transfer? intic-nft-ticket token-id sender recipient)
    )
  )
)

;; Create new event
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
  (metadata-uri (string-ascii 256))
)
  (let ((event-id (+ (var-get event-counter) u1)))
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
    (var-set event-counter event-id)
    (ok event-id)
  )
)

;; Buy ticket
(define-public (buy-ticket
  (event-id uint)
  (seat-number (optional (string-utf8 32)))
  (tier (string-utf8 32))
)
  (let (
    (event (unwrap! (map-get? events event-id) ERR-EVENT-NOT-FOUND))
    (token-id (+ (var-get last-token-id) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (get is-active event) ERR-SALE-INACTIVE)
    (asserts! (> (get available-tickets event) u0) ERR-SOLD-OUT)
    (asserts! (>= (get date event) current-time) ERR-EVENT-ENDED)

    ;; Check early access if enabled
    (if (and (get early-access-enabled event) (< current-time (get early-access-ends event)))
      (asserts! (is-eq tier "early-access") ERR-EARLY-ACCESS-ENDED)
      true
    )

    ;; Generate access code (simplified)
    (let ((access-code (concat "INTIC-" (uint-to-string token-id))))

      ;; Create ticket
      (map-set tickets token-id {
        ticket-id: token-id,
        event-id: event-id,
        owner: tx-sender,
        seat-number: seat-number,
        tier: tier,
        purchase-price: (get ticket-price event),
        purchase-date: current-time,
        is-used: false,
        access-code: access-code,
        metadata-uri: (get metadata-uri event)
      })

      ;; Update event available tickets
      (map-set events event-id
        (merge event { available-tickets: (- (get available-tickets event) u1) })
      )

      ;; Mint NFT
      (try! (nft-mint? intic-nft-ticket token-id tx-sender))

      ;; Update counters
      (var-set last-token-id token-id)
      (map-set token-count tx-sender
        (+ (default-to u0 (map-get? token-count tx-sender)) u1)
      )

      (ok token-id)
    )
  )
)

;; Use ticket (validate access)
(define-public (use-ticket (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (get owner ticket) tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    ;; Mark as used
    (map-set tickets token-id
      (merge ticket { is-used: true })
    )

    (ok true)
  )
)

;; Validate access code
(define-public (validate-access-code (token-id uint) (provided-code (string-utf8 64)))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (get access-code ticket) provided-code) ERR-UNAUTHORIZED)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)
    (ok true)
  )
)

;; Get event details
(define-read-only (get-event (event-id uint))
  (map-get? events event-id)
)

;; Get ticket details
(define-read-only (get-ticket (token-id uint))
  (map-get? tickets token-id)
)

;; Get user's token count
(define-read-only (get-balance (account principal))
  (default-to u0 (map-get? token-count account))
)

;; Share ticket with another user
(define-public (share-ticket
  (token-id uint)
  (recipient principal)
  (permission-type (string-utf8 32))
  (duration-blocks uint)
)
  (let (
    (ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (expires-at (+ current-time duration-blocks))
  )
    (asserts! (is-eq (get owner ticket) tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)
    (asserts! (or
      (is-eq permission-type PERMISSION-VIEW)
      (is-eq permission-type PERMISSION-TRANSFER)
      (is-eq permission-type PERMISSION-ACCESS)
    ) ERR-INVALID-TIER)

    ;; Update ticket sharing information
    (map-set ticket-sharing {
      ticket-id: token-id,
      from-user: tx-sender,
      to-user: recipient
    } {
      permission-type: permission-type,
      granted-at: current-time,
      expires-at: expires-at
    })

    ;; Update ticket record
    (map-set tickets token-id
      (merge ticket {
        is-shared: true,
        share-with: (some recipient)
      })
    )

    (ok true)
  )
)

;; Transfer shared ticket to new owner
(define-public (accept-shared-ticket (token-id uint))
  (let (
    (ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND))
    (sharing-record (unwrap! (map-get? ticket-sharing {
      ticket-id: token-id,
      from-user: (get owner ticket),
      to-user: tx-sender
    }) ERR-UNAUTHORIZED))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (< current-time (get expires-at sharing-record)) ERR-EVENT-ENDED)
    (asserts! (is-eq (get permission-type sharing-record) PERMISSION-TRANSFER) ERR-UNAUTHORIZED)

    ;; Update ticket owner
    (map-set tickets token-id
      (merge ticket {
        owner: tx-sender,
        ticket-status: TICKET-STATUS-TRANSFERRED
      })
    )

    ;; Transfer NFT ownership
    (try! (nft-transfer? intic-nft-ticket token-id (get owner ticket) tx-sender))

    (ok true)
  )
)

;; Use shared ticket access
(define-public (use-shared-ticket (token-id uint) (access-code-provided (string-utf8 64)))
  (let (
    (ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND))
    (sharing-record (unwrap! (map-get? ticket-sharing {
      ticket-id: token-id,
      from-user: (get owner ticket),
      to-user: tx-sender
    }) ERR-UNAUTHORIZED))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (< current-time (get expires-at sharing-record)) ERR-EVENT-ENDED)
    (asserts! (or
      (is-eq (get permission-type sharing-record) PERMISSION-ACCESS)
      (is-eq (get permission-type sharing-record) PERMISSION-VIEW)
    ) ERR-UNAUTHORIZED)
    (asserts! (is-eq (get access-code ticket) access-code-provided) ERR-UNAUTHORIZED)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    ;; Mark as used
    (map-set tickets token-id
      (merge ticket { is-used: true })
    )

    (ok true)
  )
)

;; Add event review
(define-public (add-event-review
  (event-id uint)
  (rating uint)
  (review-text (string-utf8 512))
)
  (let (
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (and (>= rating u1) (<= rating u5)) ERR-INVALID-TIER)

    (map-set event-reviews {
      event-id: event-id,
      reviewer: tx-sender
    } {
      rating: rating,
      review-text: review-text,
      review-date: current-time
    })

    (ok true)
  )
)

;; Enable NFC for ticket
(define-public (enable-nfc-ticket (token-id uint))
  (let (
    (ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND))
  )
    (asserts! (is-eq (get owner ticket) tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    (map-set tickets token-id
      (merge ticket { nfc-enabled: true })
    )

    (ok true)
  )
)

;; Get event reviews
(define-read-only (get-event-reviews (event-id uint))
  (ok true) ; Simplified - would return list of reviews
)

;; Get user's shared tickets
(define-read-only (get-shared-tickets (user principal))
  (ok true) ; Simplified - would return list of shared tickets
)

;; Get ticket by section/row/seat
(define-read-only (get-ticket-by-location (event-id uint) (section (string-utf8 32)) (row (string-utf8 32)) (seat (string-utf8 32)))
  (ok true) ; Simplified - would return ticket matching location
)</content>
<parameter name="filePath">D:\BAHAN PROJECT\pulse-robot-template-87267\contracts\intic-smart-contracts\nft-ticket.clar