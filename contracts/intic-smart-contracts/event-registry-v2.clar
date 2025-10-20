;; Event Registry V2 - Simplified (OpenSea-style)
;; Only stores contract addresses, details fetched from contracts via indexer
;; Version: 2.0.0

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-REGISTERED (err u103))
(define-constant ERR-INVALID-INPUT (err u104))

;; ============================================
;; DATA VARIABLES
;; ============================================
(define-data-var next-event-id uint u1)

;; ============================================
;; DATA MAPS - Simplified!
;; ============================================

;; Main registry: Only stores contract references
(define-map registered-events 
  uint 
  {
    event-id: uint,
    contract-address: principal,
    contract-name: (string-ascii 128),
    organizer: principal,
    registered-at: uint,
    is-active: bool,
    is-verified: bool,
    is-featured: bool
  }
)

;; Quick lookup: contract -> event-id
(define-map contract-to-event-id principal uint)

;; Index by organizer
(define-map organizer-events 
  principal 
  (list 200 uint)
)

;; Featured events list
(define-map featured-events-list
  uint  ;; index
  uint  ;; event-id
)
(define-data-var featured-count uint u0)

;; Verified organizers
(define-map verified-organizers principal bool)

;; Platform statistics
(define-data-var total-events-count uint u0)
(define-data-var total-organizers-count uint u0)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Register new event contract (called after deployment)
(define-public (register-event
  (contract-address principal)
  (contract-name (string-ascii 128)))
  (let
    (
      (event-id (var-get next-event-id))
      (current-events (default-to (list) (map-get? organizer-events tx-sender)))
    )
    
    ;; Validations
    (asserts! (> (len contract-name) u0) ERR-INVALID-INPUT)
    (asserts! (is-none (map-get? contract-to-event-id contract-address)) ERR-ALREADY-REGISTERED)
    
    ;; Register event with minimal data
    (map-set registered-events event-id {
      event-id: event-id,
      contract-address: contract-address,
      contract-name: contract-name,
      organizer: tx-sender,
      registered-at: burn-block-height,
      is-active: true,
      is-verified: false,
      is-featured: false
    })
    
    ;; Create contract lookup
    (map-set contract-to-event-id contract-address event-id)
    
    ;; Add to organizer's events
    (map-set organizer-events tx-sender
      (unwrap! (as-max-len? (append current-events event-id) u200) ERR-INVALID-INPUT))
    
    ;; Update counters
    (var-set next-event-id (+ event-id u1))
    (var-set total-events-count (+ (var-get total-events-count) u1))
    
    ;; If first event from this organizer, increment organizer count
    (if (is-eq (len current-events) u0)
      (var-set total-organizers-count (+ (var-get total-organizers-count) u1))
      true
    )
    
    (ok event-id)))

;; Update event status (organizer only)
(define-public (set-event-active (event-id uint) (is-active bool))
  (let ((event (unwrap! (map-get? registered-events event-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get organizer event)) ERR-UNAUTHORIZED)
    (map-set registered-events event-id (merge event { is-active: is-active }))
    (ok true)))

;; Verify event (platform admin only)
(define-public (verify-event (event-id uint) (verified bool))
  (let ((event (unwrap! (map-get? registered-events event-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set registered-events event-id (merge event { is-verified: verified }))
    (ok true)))

;; Feature event (platform admin only)
(define-public (feature-event (event-id uint) (featured bool))
  (let 
    (
      (event (unwrap! (map-get? registered-events event-id) ERR-NOT-FOUND))
      (current-featured-count (var-get featured-count))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    ;; Update event
    (map-set registered-events event-id (merge event { is-featured: featured }))
    
    ;; Add/remove from featured list
    (if featured
      (begin
        (map-set featured-events-list current-featured-count event-id)
        (var-set featured-count (+ current-featured-count u1))
        (ok true))
      (ok true)  ;; TODO: Implement remove from list if needed
    )))

;; Verify organizer (platform admin only)
(define-public (set-verified-organizer (organizer principal) (verified bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set verified-organizers organizer verified)
    (ok true)))

;; Transfer ownership (current owner only)
(define-public (transfer-event-ownership (event-id uint) (new-organizer principal))
  (let 
    (
      (event (unwrap! (map-get? registered-events event-id) ERR-NOT-FOUND))
      (old-organizer (get organizer event))
    )
    (asserts! (is-eq tx-sender old-organizer) ERR-UNAUTHORIZED)
    (map-set registered-events event-id (merge event { organizer: new-organizer }))
    
    ;; TODO: Update organizer-events maps for both old and new organizer
    
    (ok true)))

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get event registry entry
(define-read-only (get-event (event-id uint))
  (ok (map-get? registered-events event-id)))

;; Get event by contract address
(define-read-only (get-event-by-contract (contract-address principal))
  (match (map-get? contract-to-event-id contract-address)
    event-id (ok (map-get? registered-events event-id))
    (ok none)))

;; Get organizer's events
(define-read-only (get-organizer-events (organizer principal))
  (ok (default-to (list) (map-get? organizer-events organizer))))

;; Check if organizer is verified
(define-read-only (is-organizer-verified (organizer principal))
  (ok (default-to false (map-get? verified-organizers organizer))))

;; Get total events count
(define-read-only (get-total-events)
  (ok (var-get total-events-count)))

;; Get total organizers count
(define-read-only (get-total-organizers)
  (ok (var-get total-organizers-count)))

;; Get featured events (returns list of event IDs)
(define-read-only (get-featured-events)
  (ok (list 
    (map-get? featured-events-list u0)
    (map-get? featured-events-list u1)
    (map-get? featured-events-list u2)
    (map-get? featured-events-list u3)
    (map-get? featured-events-list u4)
    (map-get? featured-events-list u5)
    (map-get? featured-events-list u6)
    (map-get? featured-events-list u7)
    (map-get? featured-events-list u8)
    (map-get? featured-events-list u9)
  )))

;; Get events in range (for pagination)
(define-read-only (get-events-range (start-id uint) (end-id uint))
  (ok {
    start: start-id,
    end: end-id,
    events: (list
      (map-get? registered-events start-id)
      (map-get? registered-events (+ start-id u1))
      (map-get? registered-events (+ start-id u2))
      (map-get? registered-events (+ start-id u3))
      (map-get? registered-events (+ start-id u4))
      (map-get? registered-events (+ start-id u5))
      (map-get? registered-events (+ start-id u6))
      (map-get? registered-events (+ start-id u7))
      (map-get? registered-events (+ start-id u8))
      (map-get? registered-events (+ start-id u9))
    )
  }))

;; Get platform stats
(define-read-only (get-platform-stats)
  (ok {
    total-events: (var-get total-events-count),
    total-organizers: (var-get total-organizers-count),
    featured-count: (var-get featured-count)
  }))

;; Check if contract is registered
;; Check if contract is registered
(define-read-only (is-contract-registered (contract-address principal))
  (ok (is-some (map-get? contract-to-event-id contract-address))))

