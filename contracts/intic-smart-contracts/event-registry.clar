(define-constant CONTRACT-OWNER tx-sender)
(define-constant REGISTRATION-FEE u1000000)
(define-constant VERIFICATION-FEE u5000000)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-REGISTERED (err u103))
(define-constant ERR-INVALID-INPUT (err u104))
(define-constant ERR-INSUFFICIENT-FEE (err u105))
(define-constant ERR-NOT-VERIFIED (err u106))

(define-map events 
  { event-id: uint } 
  {
    contract-address: principal,
    contract-name: (string-ascii 128),
    creator: principal,
    event-name: (string-utf8 256),
    event-description: (string-utf8 1024),
    category: (string-ascii 64),
    venue: (string-utf8 256),
    venue-address: (string-utf8 512),
    venue-coordinates: (string-ascii 64),
    event-date: uint,
    ticket-price: uint,
    total-supply: uint,
    image-uri: (string-ascii 256),
    metadata-uri: (string-ascii 256),
    is-active: bool,
    is-verified: bool,
    is-featured: bool,
    registered-at: uint,
    total-minted: uint,
    total-volume: uint,
    total-sales: uint,
    floor-price: uint,
    views: uint,
    favorites: uint
  }
)

(define-map contract-to-event-id
  principal
  uint
)

(define-map creator-events
  { creator: principal, index: uint }
  uint
)

(define-map creator-event-count
  principal
  uint
)

(define-map category-events
  { category: (string-ascii 64), index: uint }
  uint
)

(define-map category-event-count
  (string-ascii 64)
  uint
)

(define-map featured-events
  uint
  uint
)

(define-map user-favorites
  { user: principal, event-id: uint }
  bool
)

(define-map user-favorite-count
  principal
  uint
)

(define-map event-views
  { event-id: uint, viewer: principal }
  uint
)

(define-map verification-requests
  uint
  {
    requested-at: uint,
    status: (string-ascii 32),
    reviewed-at: (optional uint),
    reviewer: (optional principal),
    notes: (optional (string-utf8 512))
  }
)

(define-data-var event-counter uint u0)
(define-data-var featured-counter uint u0)
(define-data-var platform-treasury uint u0)

(define-public (register-event
    (contract-address principal)
    (contract-name (string-ascii 128))
    (event-name (string-utf8 256))
    (event-description (string-utf8 1024))
    (category (string-ascii 64))
    (venue (string-utf8 256))
    (venue-address (string-utf8 512))
    (venue-coordinates (string-ascii 64))
    (event-date uint)
    (ticket-price uint)
    (total-supply uint)
    (image-uri (string-ascii 256))
    (metadata-uri (string-ascii 256))
  )
  (let
    (
      (event-id (+ (var-get event-counter) u1))
      (creator tx-sender)
      (current-time burn-block-height)
      (creator-count (default-to u0 (map-get? creator-event-count tx-sender)))
      (cat-count (default-to u0 (map-get? category-event-count category)))
    )
    
    (asserts! (is-none (map-get? contract-to-event-id contract-address)) ERR-ALREADY-REGISTERED)
    (asserts! (> total-supply u0) ERR-INVALID-INPUT)
    (asserts! (> event-date current-time) ERR-INVALID-INPUT)
    
    (try! (stx-transfer? REGISTRATION-FEE tx-sender (as-contract tx-sender)))
    
    (map-set events
      { event-id: event-id }
      {
        contract-address: contract-address,
        contract-name: contract-name,
        creator: creator,
        event-name: event-name,
        event-description: event-description,
        category: category,
        venue: venue,
        venue-address: venue-address,
        venue-coordinates: venue-coordinates,
        event-date: event-date,
        ticket-price: ticket-price,
        total-supply: total-supply,
        image-uri: image-uri,
        metadata-uri: metadata-uri,
        is-active: true,
        is-verified: false,
        is-featured: false,
        registered-at: current-time,
        total-minted: u0,
        total-volume: u0,
        total-sales: u0,
        floor-price: u0,
        views: u0,
        favorites: u0
      }
    )
    
    (map-set contract-to-event-id contract-address event-id)
    
    (map-set creator-events
      { creator: creator, index: creator-count }
      event-id
    )
    (map-set creator-event-count creator (+ creator-count u1))
    
    (map-set category-events
      { category: category, index: cat-count }
      event-id
    )
    (map-set category-event-count category (+ cat-count u1))
    
    (var-set event-counter event-id)
    (var-set platform-treasury (+ (var-get platform-treasury) REGISTRATION-FEE))
    
    (ok event-id)
  )
)

(define-public (update-event
    (event-id uint)
    (event-name (string-utf8 256))
    (event-description (string-utf8 1024))
    (venue (string-utf8 256))
    (venue-address (string-utf8 512))
    (venue-coordinates (string-ascii 64))
    (event-date uint)
    (image-uri (string-ascii 256))
    (metadata-uri (string-ascii 256))
  )
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
    )
    
    (asserts! (is-eq tx-sender (get creator event)) ERR-UNAUTHORIZED)
    
    (map-set events
      { event-id: event-id }
      (merge event {
        event-name: event-name,
        event-description: event-description,
        venue: venue,
        venue-address: venue-address,
        venue-coordinates: venue-coordinates,
        event-date: event-date,
        image-uri: image-uri,
        metadata-uri: metadata-uri
      })
    )
    
    (ok true)
  )
)

(define-public (deactivate-event (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
    )
    
    (asserts! (is-eq tx-sender (get creator event)) ERR-UNAUTHORIZED)
    
    (map-set events
      { event-id: event-id }
      (merge event { is-active: false })
    )
    
    (ok true)
  )
)

(define-public (request-verification (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (current-time burn-block-height)
    )
    
    (asserts! (is-eq tx-sender (get creator event)) ERR-UNAUTHORIZED)
    
    (try! (stx-transfer? VERIFICATION-FEE tx-sender (as-contract tx-sender)))
    
    (map-set verification-requests event-id {
      requested-at: current-time,
      status: "pending",
      reviewed-at: none,
      reviewer: none,
      notes: none
    })
    
    (var-set platform-treasury (+ (var-get platform-treasury) VERIFICATION-FEE))
    
    (ok true)
  )
)

(define-public (approve-verification (event-id uint) (notes (optional (string-utf8 512))))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (request (unwrap! (map-get? verification-requests event-id) ERR-NOT-FOUND))
      (current-time burn-block-height)
    )
    
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set events
      { event-id: event-id }
      (merge event { is-verified: true })
    )
    
    (map-set verification-requests event-id
      (merge request {
        status: "approved",
        reviewed-at: (some current-time),
        reviewer: (some tx-sender),
        notes: notes
      })
    )
    
    (ok true)
  )
)

(define-public (reject-verification (event-id uint) (notes (optional (string-utf8 512))))
  (let
    (
      (request (unwrap! (map-get? verification-requests event-id) ERR-NOT-FOUND))
      (current-time burn-block-height)
    )
    
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set verification-requests event-id
      (merge request {
        status: "rejected",
        reviewed-at: (some current-time),
        reviewer: (some tx-sender),
        notes: notes
      })
    )
    
    (ok true)
  )
)

(define-public (track-view (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (current-time burn-block-height)
    )
    
    (map-set event-views
      { event-id: event-id, viewer: tx-sender }
      current-time
    )
    
    (map-set events
      { event-id: event-id }
      (merge event { views: (+ (get views event) u1) })
    )
    
    (ok true)
  )
)

(define-public (add-favorite (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (user-fav-count (default-to u0 (map-get? user-favorite-count tx-sender)))
    )
    
    (map-set user-favorites
      { user: tx-sender, event-id: event-id }
      true
    )
    
    (map-set user-favorite-count tx-sender (+ user-fav-count u1))
    
    (map-set events
      { event-id: event-id }
      (merge event { favorites: (+ (get favorites event) u1) })
    )
    
    (ok true)
  )
)

(define-public (remove-favorite (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (user-fav-count (default-to u0 (map-get? user-favorite-count tx-sender)))
    )
    
    (map-delete user-favorites
      { user: tx-sender, event-id: event-id }
    )
    
    (map-set user-favorite-count tx-sender (if (> user-fav-count u0) (- user-fav-count u1) u0))
    
    (map-set events
      { event-id: event-id }
      (merge event { 
        favorites: (if (> (get favorites event) u0) 
                     (- (get favorites event) u1) 
                     u0
                   )
      })
    )
    
    (ok true)
  )
)

(define-public (feature-event (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (featured-count (var-get featured-counter))
    )
    
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set featured-events featured-count event-id)
    (var-set featured-counter (+ featured-count u1))
    
    (map-set events
      { event-id: event-id }
      (merge event { is-featured: true })
    )
    
    (ok true)
  )
)

(define-public (update-mint-stats (event-id uint) (quantity uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (new-total (+ (get total-minted event) quantity))
    )
    
    (asserts! 
      (or 
        (is-eq tx-sender (get contract-address event))
        (is-eq tx-sender (get creator event))
      )
      ERR-UNAUTHORIZED
    )
    
    (asserts! (<= new-total (get total-supply event)) ERR-INVALID-INPUT)
    
    (map-set events
      { event-id: event-id }
      (merge event { 
        total-minted: new-total
      })
    )
    
    (ok true)
  )
)

(define-public (update-sale-stats (event-id uint) (sale-price uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (new-volume (+ (get total-volume event) sale-price))
      (new-sales (+ (get total-sales event) u1))
      (current-floor (get floor-price event))
      (new-floor (if (or (is-eq current-floor u0) (< sale-price current-floor))
                    sale-price
                    current-floor))
    )
    
    (asserts! 
      (or 
        (is-eq tx-sender (get contract-address event))
        (is-eq tx-sender (get creator event))
      )
      ERR-UNAUTHORIZED
    )
    
    (asserts! (> sale-price u0) ERR-INVALID-INPUT)
    
    (map-set events
      { event-id: event-id }
      (merge event {
        total-volume: new-volume,
        total-sales: new-sales,
        floor-price: new-floor
      })
    )
    
    (ok true)
  )
)

(define-read-only (get-event (event-id uint))
  (ok (map-get? events { event-id: event-id }))
)

(define-read-only (get-event-by-contract (contract-address principal))
  (let
    (
      (event-id (map-get? contract-to-event-id contract-address))
    )
    (if (is-some event-id)
      (ok (map-get? events { event-id: (unwrap-panic event-id) }))
      (ok none)
    )
  )
)

(define-read-only (get-creator-events (creator principal) (offset uint) (limit uint))
  (ok {
    total: (default-to u0 (map-get? creator-event-count creator)),
    offset: offset,
    limit: limit
  })
)

(define-read-only (get-category-events (category (string-ascii 64)) (offset uint) (limit uint))
  (ok {
    total: (default-to u0 (map-get? category-event-count category)),
    offset: offset,
    limit: limit
  })
)

(define-read-only (get-featured-events)
  (ok {
    total: (var-get featured-counter)
  })
)

(define-read-only (is-favorited (user principal) (event-id uint))
  (ok (default-to false (map-get? user-favorites { user: user, event-id: event-id })))
)

(define-read-only (get-platform-stats)
  (ok {
    total-events: (var-get event-counter),
    total-featured: (var-get featured-counter),
    platform-treasury: (var-get platform-treasury)
  })
)

(define-read-only (get-verification-request (event-id uint))
  (ok (map-get? verification-requests event-id))
)

(define-read-only (get-total-events)
  (ok (var-get event-counter))
)

(define-public (withdraw-treasury (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (<= amount (var-get platform-treasury)) ERR-INSUFFICIENT-FEE)
    
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (var-set platform-treasury (- (var-get platform-treasury) amount))
    
    (ok true)
  )
)

(define-public (unfeature-event (event-id uint))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
    )
    
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set events
      { event-id: event-id }
      (merge event { is-featured: false })
    )
    
    (ok true)
  )
)

(define-public (revoke-verification (event-id uint) (reason (string-utf8 512)))
  (let
    (
      (event (unwrap! (map-get? events { event-id: event-id }) ERR-NOT-FOUND))
      (request (map-get? verification-requests event-id))
      (current-time burn-block-height)
    )
    
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set events
      { event-id: event-id }
      (merge event { is-verified: false })
    )
    
    (if (is-some request)
      (map-set verification-requests event-id
        (merge (unwrap-panic request) {
          status: "revoked",
          reviewed-at: (some current-time),
          reviewer: (some tx-sender),
          notes: (some reason)
        })
      )
      true
    )
    
    (ok true)
  )
)

(define-read-only (is-event-active (event-id uint))
  (match (map-get? events { event-id: event-id })
    event-data (ok (get is-active event-data))
    (err ERR-NOT-FOUND)
  )
)

(define-read-only (is-event-verified (event-id uint))
  (match (map-get? events { event-id: event-id })
    event-data (ok (get is-verified event-data))
    (err ERR-NOT-FOUND)
  )
)

(define-read-only (get-event-creator (event-id uint))
  (match (map-get? events { event-id: event-id })
    event-data (ok (get creator event-data))
    (err ERR-NOT-FOUND)
  )
)

(define-read-only (get-user-favorite-count (user principal))
  (ok (default-to u0 (map-get? user-favorite-count user)))
)

(define-read-only (get-events-batch (event-ids (list 50 uint)))
  (ok (map get-event-data event-ids))
)

(define-private (get-event-data (event-id uint))
  (map-get? events { event-id: event-id })
)

(define-read-only (search-events (category (optional (string-ascii 64))) (verified-only bool) (active-only bool))
  (ok {
    category: category,
    verified-only: verified-only,
    active-only: active-only,
    total-events: (var-get event-counter)
  })
)

(define-read-only (get-trending-events (limit uint))
  (ok {
    limit: limit,
    total-events: (var-get event-counter)
  })
)

(define-read-only (get-upcoming-events (from-date uint) (limit uint))
  (ok {
    from-date: from-date,
    limit: limit,
    total-events: (var-get event-counter)
  })
)
