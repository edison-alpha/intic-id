;; Proof of Fandom Contract for Pulse Robot Platform
;; Implements SIP-013 SFT Standard for Proof of Fandom Badges
;; Features: Tier-based badges, achievements, rewards, community building

(impl-trait .sip-013-semi-fungible-token-trait.semi-fungible-token-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u200))
(define-constant ERR-UNAUTHORIZED (err u201))
(define-constant ERR-NOT-FOUND (err u202))
(define-constant ERR-ALREADY-EXISTS (err u203))
(define-constant ERR-INSUFFICIENT-BALANCE (err u204))
(define-constant ERR-INVALID-AMOUNT (err u205))
(define-constant ERR-BADGE-NOT-TRANSFERABLE (err u206))
(define-constant ERR-ACHIEVEMENT-LOCKED (err u207))
(define-constant ERR-INVALID-TIER (err u208))

;; Token ID structure:
;; Bits 0-31: Badge Type ID
;; Bits 32-63: Tier Level
;; Bits 64-127: Achievement ID (if applicable)

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var contract-uri (optional (string-utf8 256)) none)

;; Badge Types
(define-map badge-types uint {
  type-id: uint,
  name: (string-utf8 128),
  description: (string-utf8 512),
  category: (string-utf8 64),
  max-tier: uint,
  is-transferable: bool,
  metadata-uri: (string-utf8 256),
  created-by: principal,
  created-at: uint
})

;; User Badge Holdings
(define-map user-badges {user: principal, token-id: uint} {
  balance: uint,
  earned-at: uint,
  tier-level: uint,
  experience-points: uint,
  achievements: (list 20 uint),
  metadata: (string-utf8 512)
})

;; Tier Requirements
(define-map tier-requirements {badge-type: uint, tier: uint} {
  tickets-required: uint,
  spending-required: uint,
  events-attended: uint,
  community-score: uint,
  time-requirement: uint,
  special-conditions: (string-utf8 256)
})

;; Achievement Definitions
(define-map achievements uint {
  achievement-id: uint,
  name: (string-utf8 128),
  description: (string-utf8 512),
  category: (string-utf8 64),
  points-reward: uint,
  badge-type: uint,
  requirements: (string-utf8 512),
  is-active: bool,
  rarity: (string-utf8 32),
  metadata-uri: (string-utf8 256)
})

;; User Statistics for Badge Calculations
(define-map user-stats principal {
  total-tickets-bought: uint,
  total-spent: uint,
  events-attended: uint,
  community-interactions: uint,
  referrals-made: uint,
  badges-earned: uint,
  total-experience: uint,
  join-date: uint,
  last-activity: uint,
  reputation-score: uint
})

;; Leaderboard Data
(define-map monthly-leaderboard {month: uint, rank: uint} {
  user: principal,
  score: uint,
  badges-earned: uint,
  achievements-unlocked: uint
})

;; Reward Pools
(define-map reward-pools uint {
  pool-id: uint,
  name: (string-utf8 128),
  total-rewards: uint,
  distributed-rewards: uint,
  eligible-badge-types: (list 10 uint),
  start-time: uint,
  end-time: uint,
  is-active: bool
})

;; SIP-013 Implementation
(define-non-fungible-token fandom-badge uint)

(define-public (transfer (token-id uint) (amount uint) (sender principal) (recipient principal))
  (let ((badge-info (unwrap! (get-badge-info token-id) (err ERR-NOT-FOUND)))
        (badge-type-info (unwrap! (map-get? badge-types (get-badge-type-id token-id)) (err ERR-NOT-FOUND))))

    (asserts! (is-eq tx-sender sender) (err ERR-UNAUTHORIZED))
    (asserts! (get is-transferable badge-type-info) (err ERR-BADGE-NOT-TRANSFERABLE))
    (asserts! (>= (get balance badge-info) amount) (err ERR-INSUFFICIENT-BALANCE))

    ;; Update sender balance
    (map-set user-badges {user: sender, token-id: token-id}
      (merge badge-info {balance: (- (get balance badge-info) amount)}))

    ;; Update recipient balance
    (let ((recipient-info (default-to
      {balance: u0, earned-at: block-height, tier-level: u1, experience-points: u0,
       achievements: (list), metadata: ""}
      (map-get? user-badges {user: recipient, token-id: token-id}))))

      (map-set user-badges {user: recipient, token-id: token-id}
        (merge recipient-info {balance: (+ (get balance recipient-info) amount)})))

    (ok true)))

;; Badge Management Functions

(define-public (create-badge-type
  (name (string-utf8 128))
  (description (string-utf8 512))
  (category (string-utf8 64))
  (max-tier uint)
  (is-transferable bool)
  (metadata-uri (string-utf8 256)))
  (let ((type-id (+ (var-get last-token-id) u1)))

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (> max-tier u0) (err ERR-INVALID-TIER))

    (map-set badge-types type-id {
      type-id: type-id,
      name: name,
      description: description,
      category: category,
      max-tier: max-tier,
      is-transferable: is-transferable,
      metadata-uri: metadata-uri,
      created-by: tx-sender,
      created-at: block-height
    })

    (var-set last-token-id type-id)
    (ok type-id)))

(define-public (set-tier-requirements
  (badge-type uint)
  (tier uint)
  (tickets-required uint)
  (spending-required uint)
  (events-attended uint)
  (community-score uint)
  (time-requirement uint)
  (special-conditions (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (is-some (map-get? badge-types badge-type)) (err ERR-NOT-FOUND))

    (map-set tier-requirements {badge-type: badge-type, tier: tier} {
      tickets-required: tickets-required,
      spending-required: spending-required,
      events-attended: events-attended,
      community-score: community-score,
      time-requirement: time-requirement,
      special-conditions: special-conditions
    })
    (ok true)))

;; Badge Earning Functions

(define-public (award-badge
  (user principal)
  (badge-type uint)
  (tier uint)
  (amount uint)
  (metadata (string-utf8 512)))
  (let ((token-id (create-token-id badge-type tier u0)))

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (is-some (map-get? badge-types badge-type)) (err ERR-NOT-FOUND))
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))

    ;; Check if user meets tier requirements
    (asserts! (check-tier-eligibility user badge-type tier) (err ERR-UNAUTHORIZED))

    (let ((current-badge (default-to
      {balance: u0, earned-at: block-height, tier-level: tier, experience-points: u0,
       achievements: (list), metadata: metadata}
      (map-get? user-badges {user: user, token-id: token-id}))))

      (map-set user-badges {user: user, token-id: token-id}
        (merge current-badge {
          balance: (+ (get balance current-badge) amount),
          tier-level: (max tier (get tier-level current-badge))
        }))

      ;; Update user stats
      (update-user-stats user badge-type tier)

      (ok token-id))))

(define-public (upgrade-badge-tier (user principal) (badge-type uint) (new-tier uint))
  (let ((current-token-id (create-token-id badge-type (get-user-current-tier user badge-type) u0))
        (new-token-id (create-token-id badge-type new-tier u0)))

    (asserts! (check-tier-eligibility user badge-type new-tier) (err ERR-UNAUTHORIZED))

    (let ((current-badge (unwrap! (map-get? user-badges {user: user, token-id: current-token-id}) (err ERR-NOT-FOUND))))

      ;; Transfer balance to new tier
      (map-set user-badges {user: user, token-id: new-token-id}
        (merge current-badge {tier-level: new-tier}))

      ;; Remove old tier badge
      (map-delete user-badges {user: user, token-id: current-token-id})

      (ok new-token-id))))

;; Achievement System

(define-public (create-achievement
  (name (string-utf8 128))
  (description (string-utf8 512))
  (category (string-utf8 64))
  (points-reward uint)
  (badge-type uint)
  (requirements (string-utf8 512))
  (rarity (string-utf8 32))
  (metadata-uri (string-utf8 256)))
  (let ((achievement-id (+ (var-get last-token-id) u1000))) ;; Offset achievements

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (map-set achievements achievement-id {
      achievement-id: achievement-id,
      name: name,
      description: description,
      category: category,
      points-reward: points-reward,
      badge-type: badge-type,
      requirements: requirements,
      is-active: true,
      rarity: rarity,
      metadata-uri: metadata-uri
    })

    (ok achievement-id)))

(define-public (unlock-achievement (user principal) (achievement-id uint))
  (let ((achievement (unwrap! (map-get? achievements achievement-id) (err ERR-NOT-FOUND))))

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (get is-active achievement) (err ERR-ACHIEVEMENT-LOCKED))

    ;; Award achievement badge
    (let ((token-id (create-token-id (get badge-type achievement) u1 achievement-id)))

      (let ((current-badge (default-to
        {balance: u0, earned-at: block-height, tier-level: u1, experience-points: u0,
         achievements: (list), metadata: ""}
        (map-get? user-badges {user: user, token-id: token-id}))))

        (map-set user-badges {user: user, token-id: token-id}
          (merge current-badge {
            balance: u1,
            experience-points: (+ (get experience-points current-badge) (get points-reward achievement)),
            achievements: (unwrap! (as-max-len? (append (get achievements current-badge) achievement-id) u20) (err ERR-INVALID-AMOUNT))
          }))

        (ok achievement-id)))))

;; Community & Social Features

(define-public (add-community-interaction (user principal) (interaction-type (string-utf8 64)) (points uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (let ((stats (default-to
      {total-tickets-bought: u0, total-spent: u0, events-attended: u0, community-interactions: u0,
       referrals-made: u0, badges-earned: u0, total-experience: u0, join-date: block-height,
       last-activity: block-height, reputation-score: u100}
      (map-get? user-stats user))))

      (map-set user-stats user
        (merge stats {
          community-interactions: (+ (get community-interactions stats) u1),
          total-experience: (+ (get total-experience stats) points),
          last-activity: block-height,
          reputation-score: (+ (get reputation-score stats) points)
        }))

      (ok true))))

(define-public (record-referral (referrer principal) (referee principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (let ((referrer-stats (default-to
      {total-tickets-bought: u0, total-spent: u0, events-attended: u0, community-interactions: u0,
       referrals-made: u0, badges-earned: u0, total-experience: u0, join-date: block-height,
       last-activity: block-height, reputation-score: u100}
      (map-get? user-stats referrer))))

      (map-set user-stats referrer
        (merge referrer-stats {
          referrals-made: (+ (get referrals-made referrer-stats) u1),
          total-experience: (+ (get total-experience referrer-stats) u50),
          reputation-score: (+ (get reputation-score referrer-stats) u25)
        }))

      ;; Award referral badge if milestone reached
      (if (is-eq (mod (+ (get referrals-made referrer-stats) u1) u5) u0)
        (unwrap! (award-badge referrer u100 u1 u1 "Referral milestone reached") (err ERR-OWNER-ONLY))
        (ok u0))

      (ok true))))

;; Reward System

(define-public (create-reward-pool
  (name (string-utf8 128))
  (total-rewards uint)
  (eligible-badge-types (list 10 uint))
  (duration-blocks uint))
  (let ((pool-id (+ (var-get last-token-id) u2000))) ;; Offset pools

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (map-set reward-pools pool-id {
      pool-id: pool-id,
      name: name,
      total-rewards: total-rewards,
      distributed-rewards: u0,
      eligible-badge-types: eligible-badge-types,
      start-time: block-height,
      end-time: (+ block-height duration-blocks),
      is-active: true
    })

    (ok pool-id)))

(define-public (claim-reward (user principal) (pool-id uint))
  (let ((pool (unwrap! (map-get? reward-pools pool-id) (err ERR-NOT-FOUND)))
        (user-badges-count (get-user-eligible-badges user (get eligible-badge-types pool))))

    (asserts! (get is-active pool) (err ERR-UNAUTHORIZED))
    (asserts! (>= block-height (get start-time pool)) (err ERR-UNAUTHORIZED))
    (asserts! (<= block-height (get end-time pool)) (err ERR-UNAUTHORIZED))
    (asserts! (> user-badges-count u0) (err ERR-UNAUTHORIZED))

    (let ((reward-amount (/ (get total-rewards pool) u100))) ;; Simplified calculation

      (map-set reward-pools pool-id
        (merge pool {distributed-rewards: (+ (get distributed-rewards pool) reward-amount)}))

      ;; Award experience points
      (let ((stats (default-to
        {total-tickets-bought: u0, total-spent: u0, events-attended: u0, community-interactions: u0,
         referrals-made: u0, badges-earned: u0, total-experience: u0, join-date: block-height,
         last-activity: block-height, reputation-score: u100}
        (map-get? user-stats user))))

        (map-set user-stats user
          (merge stats {total-experience: (+ (get total-experience stats) reward-amount)}))

        (ok reward-amount)))))

;; Helper Functions

(define-private (create-token-id (badge-type uint) (tier uint) (achievement uint))
  (+ (+ badge-type (* tier u100000000)) (* achievement u10000000000000000)))

(define-private (get-badge-type-id (token-id uint))
  (mod token-id u100000000))

(define-private (get-tier-from-token-id (token-id uint))
  (mod (/ token-id u100000000) u100000000))

(define-private (check-tier-eligibility (user principal) (badge-type uint) (tier uint))
  (let ((requirements (map-get? tier-requirements {badge-type: badge-type, tier: tier}))
        (user-stats-data (map-get? user-stats user)))

    (match requirements
      req-data (match user-stats-data
        stats (and
          (>= (get total-tickets-bought stats) (get tickets-required req-data))
          (>= (get total-spent stats) (get spending-required req-data))
          (>= (get events-attended stats) (get events-attended req-data))
          (>= (get reputation-score stats) (get community-score req-data)))
        false)
      true))) ;; No requirements set, allow

(define-private (get-user-current-tier (user principal) (badge-type uint))
  (fold check-user-tier-level (list u1 u2 u3 u4 u5) u1))

(define-private (check-user-tier-level (tier uint) (current-max uint))
  (if (check-tier-eligibility tx-sender u1 tier) ;; Simplified
    tier
    current-max))

(define-private (update-user-stats (user principal) (badge-type uint) (tier uint))
  (let ((stats (default-to
    {total-tickets-bought: u0, total-spent: u0, events-attended: u0, community-interactions: u0,
     referrals-made: u0, badges-earned: u0, total-experience: u0, join-date: block-height,
     last-activity: block-height, reputation-score: u100}
    (map-get? user-stats user))))

    (map-set user-stats user
      (merge stats {
        badges-earned: (+ (get badges-earned stats) u1),
        total-experience: (+ (get total-experience stats) (* tier u10)),
        last-activity: block-height
      }))
    true))

(define-private (get-user-eligible-badges (user principal) (eligible-types (list 10 uint)))
  (fold count-eligible-badges eligible-types u0))

(define-private (count-eligible-badges (badge-type uint) (current-count uint))
  (if (is-some (map-get? user-badges {user: tx-sender, token-id: (create-token-id badge-type u1 u0)}))
    (+ current-count u1)
    current-count))

;; Read-only Functions

(define-read-only (get-badge-info (token-id uint))
  (map-get? user-badges {user: tx-sender, token-id: token-id}))

(define-read-only (get-user-badge (user principal) (token-id uint))
  (map-get? user-badges {user: user, token-id: token-id}))

(define-read-only (get-badge-type-info (type-id uint))
  (map-get? badge-types type-id))

(define-read-only (get-user-statistics (user principal))
  (map-get? user-stats user))

(define-read-only (get-achievement-info (achievement-id uint))
  (map-get? achievements achievement-id))

(define-read-only (get-tier-requirements-info (badge-type uint) (tier uint))
  (map-get? tier-requirements {badge-type: badge-type, tier: tier}))

(define-read-only (get-reward-pool-info (pool-id uint))
  (map-get? reward-pools pool-id))

(define-read-only (get-user-tier-for-badge (user principal) (badge-type uint))
  (let ((token-id-tier-1 (create-token-id badge-type u1 u0))
        (token-id-tier-2 (create-token-id badge-type u2 u0))
        (token-id-tier-3 (create-token-id badge-type u3 u0))
        (token-id-tier-4 (create-token-id badge-type u4 u0))
        (token-id-tier-5 (create-token-id badge-type u5 u0)))

    (if (is-some (map-get? user-badges {user: user, token-id: token-id-tier-5})) u5
    (if (is-some (map-get? user-badges {user: user, token-id: token-id-tier-4})) u4
    (if (is-some (map-get? user-badges {user: user, token-id: token-id-tier-3})) u3
    (if (is-some (map-get? user-badges {user: user, token-id: token-id-tier-2})) u2
    (if (is-some (map-get? user-badges {user: user, token-id: token-id-tier-1})) u1
    u0)))))))

;; Admin Functions

(define-public (set-contract-uri (uri (optional (string-utf8 256))))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set contract-uri uri)
    (ok true)))

(define-public (toggle-achievement (achievement-id uint))
  (let ((achievement (unwrap! (map-get? achievements achievement-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (map-set achievements achievement-id
      (merge achievement {is-active: (not (get is-active achievement))}))
    (ok true)))

(define-public (update-badge-metadata (type-id uint) (new-metadata-uri (string-utf8 256)))
  (let ((badge-type (unwrap! (map-get? badge-types type-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (map-set badge-types type-id
      (merge badge-type {metadata-uri: new-metadata-uri}))
    (ok true)))