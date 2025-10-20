;; INTIC User Profile Contract
;; Simple on-chain profile registry following Galxe approach
;; Stores minimal data on-chain, full metadata on IPFS

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-username-taken (err u101))
(define-constant err-profile-exists (err u102))
(define-constant err-profile-not-found (err u103))
(define-constant err-invalid-username (err u104))

;; Data Variables
(define-data-var total-profiles uint u0)

;; Profile Map
;; Stores: username + IPFS hash (points to full metadata)
(define-map profiles
  { user: principal }
  {
    username: (string-ascii 32),
    ipfs-hash: (string-ascii 64),
    created-at: uint,
    updated-at: uint
  }
)

;; Username Registry (for uniqueness check)
(define-map usernames
  { username: (string-ascii 32) }
  { owner: principal }
)

;; Read-only Functions

;; Get profile by wallet address
(define-read-only (get-profile (user principal))
  (map-get? profiles { user: user })
)

;; Get user by username
(define-read-only (get-user-by-username (username (string-ascii 32)))
  (match (map-get? usernames { username: username })
    entry (some (get owner entry))
    none
  )
)

;; Check if username is available
(define-read-only (is-username-available (username (string-ascii 32)))
  (is-none (map-get? usernames { username: username }))
)

;; Get total profiles
(define-read-only (get-total-profiles)
  (var-get total-profiles)
)

;; Public Functions

;; Create profile (first time only)
(define-public (create-profile
    (username (string-ascii 32))
    (ipfs-hash (string-ascii 64))
  )
  (let
    (
      (user tx-sender)
    )

    ;; Validations
    (asserts! (is-none (get-profile user)) err-profile-exists)
    (asserts! (is-username-available username) err-username-taken)
    (asserts! (> (len username) u0) err-invalid-username)

    ;; Create profile
    (map-set profiles
      { user: user }
      {
        username: username,
        ipfs-hash: ipfs-hash,
        created-at: burn-block-height,
        updated-at: burn-block-height
      }
    )

    ;; Register username
    (map-set usernames
      { username: username }
      { owner: user }
    )

    ;; Increment counter
    (var-set total-profiles (+ (var-get total-profiles) u1))

    (ok true)
  )
)

;; Update IPFS hash (when user updates email, bio, avatar, preferences)
(define-public (update-metadata (ipfs-hash (string-ascii 64)))
  (let
    (
      (user tx-sender)
      (existing-profile (unwrap! (get-profile user) err-profile-not-found))
    )

    ;; Update profile with new IPFS hash
    (map-set profiles
      { user: user }
      (merge existing-profile {
        ipfs-hash: ipfs-hash,
        updated-at: burn-block-height
      })
    )

    (ok true)
  )
)

;; Update username only
(define-public (update-username (new-username (string-ascii 32)))
  (let
    (
      (user tx-sender)
      (existing-profile (unwrap! (get-profile user) err-profile-not-found))
      (old-username (get username existing-profile))
    )

    ;; Validations
    (asserts! (> (len new-username) u0) err-invalid-username)
    (asserts! (is-username-available new-username) err-username-taken)

    ;; Delete old username mapping
    (map-delete usernames { username: old-username })

    ;; Update profile
    (map-set profiles
      { user: user }
      (merge existing-profile {
        username: new-username,
        updated-at: burn-block-height
      })
    )

    ;; Register new username
    (map-set usernames
      { username: new-username }
      { owner: user }
    )

    (ok true)
  )
)
