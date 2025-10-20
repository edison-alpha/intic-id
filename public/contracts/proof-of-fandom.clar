;; Proof of Fandom Contract for INTIC Pulse Robot Platform
;; Implements SIP-013 Semi-Fungible Token Standard
;; Features: Multi-tier badge system, achievement tracking, community rewards

(impl-trait .sip-013-semi-fungible-token-trait.sip013-semi-fungible-token-trait)

;; Define tokens
(define-fungible-token intic-fandom-token)
(define-non-fungible-token intic-badge-id {
  token-id: uint,
  owner: principal,
})

;; Data Maps
(define-map token-balances
  {
    token-id: uint,
    owner: principal,
  }
  uint
)
(define-map token-supplies uint uint)
(define-map badge-types uint {
  badge-id: uint,
  name: (string-utf8 128),
  description: (string-utf8 512),
  category: (string-utf8 64),
  max-tier: uint,
  is-transferable: bool,
  metadata-uri: (string-utf8 256)
})
(define-map user-badges {
  user: principal,
  badge-id: uint
} {
  tier: uint,
  amount: uint,
  earned-date: uint,
  metadata: (string-utf8 512)
})
(define-map achievements uint {
  achievement-id: uint,
  name: (string-utf8 128),
  description: (string-utf8 512),
  points-reward: uint,
  requirements: (string-utf8 512)
})
(define-map user-achievements {
  user: principal,
  achievement-id: uint
} bool)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-SENDER (err u102))
(define-constant ERR-BADGE-NOT-FOUND (err u103))
(define-constant ERR-ACHIEVEMENT-NOT-FOUND (err u104))
(define-constant ERR-ALREADY-EARNED (err u105))
(define-constant ERR-REQUIREMENTS-NOT-MET (err u106))
(define-constant ERR-NOT-TRANSFERABLE (err u107))
(define-constant ERR-INVALID-RANKING (err u108))

;; Data Variables
(define-data-var badge-counter uint u0)
(define-data-var achievement-counter uint u0)

;; User engagement and ranking
(define-map user-engagement-stats principal {
  total-points: uint,
  activity-score: uint,
  rank: uint,
  last-active: uint,
  level: uint,
  experience: uint,
  next-level-exp: uint
})

(define-map user-referrals principal {
  referrer: principal,
  referral-count: uint,
  rewards-earned: uint
})

(define-map user-contributions {
  user: principal,
  contribution-type: (string-utf8 64)  ;; "event-attendance", "governance", "staking", etc.
} uint)

(define-map leaderboard-positions uint principal)  ;; rank -> user

;; Community stats
(define-data-var total-community-points uint u0)
(define-data-var total-active-users uint u0)
(define-data-var daily-active-users uint u0)

;; Achievement categories
(define-constant ACHIEVEMENT-CATEGORY-ATTENDANCE "attendance")
(define-constant ACHIEVEMENT-CATEGORY-GOVERNANCE "governance")
(define-constant ACHIEVEMENT-CATEGORY-STAKING "staking")
(define-constant ACHIEVEMENT-CATEGORY-COMMUNITY "community")

;; User levels
(define-constant LEVEL-BRONZE u1)
(define-constant LEVEL-SILVER u2)
(define-constant LEVEL-GOLD u3)
(define-constant LEVEL-PLATINUM u4)
(define-constant LEVEL-DIAMOND u5)

;; Helper functions
(define-private (set-balance
  (token-id uint)
  (balance uint)
  (owner principal)
)
  (map-set token-balances {
    token-id: token-id,
    owner: owner,
  } balance)
)

(define-private (get-balance-uint
  (token-id uint)
  (who principal)
)
  (default-to u0
    (map-get? token-balances {
      token-id: token-id,
      owner: who,
    })
  )
)

;; SIP-013: Get balance
(define-read-only (get-balance (token-id uint) (who principal))
  (ok (get-balance-uint token-id who))
)

;; SIP-013: Get overall balance
(define-read-only (get-overall-balance (who principal))
  (ok (ft-get-balance intic-fandom-token who))
)

;; SIP-013: Get total supply
(define-read-only (get-total-supply (token-id uint))
  (ok (default-to u0 (map-get? token-supplies token-id)))
)

;; SIP-013: Get overall supply
(define-read-only (get-overall-supply)
  (ok (ft-get-supply intic-fandom-token))
)

;; SIP-013: Get token URI
(define-read-only (get-token-uri (token-id uint))
  (let ((badge (unwrap! (map-get? badge-types token-id) ERR-BADGE-NOT-FOUND)))
    (ok (some (get metadata-uri badge)))
  )
)

;; SIP-013: Get decimals (always 0 for NFTs)
(define-read-only (get-decimals (token-id uint))
  (ok u0)
)

;; SIP-013: Get name
(define-read-only (get-name (token-id uint))
  (let ((badge (unwrap! (map-get? badge-types token-id) ERR-BADGE-NOT-FOUND)))
    (ok (get name badge))
  )
)

;; SIP-013: Transfer
(define-public (transfer
  (token-id uint)
  (amount uint)
  (from principal)
  (to principal)
  (memo (optional (buff 34)))
)
  (begin
    (asserts! (is-eq from tx-sender) ERR-INVALID-SENDER)
    (let ((badge (unwrap! (map-get? badge-types token-id) ERR-BADGE-NOT-FOUND)))
      (asserts! (get is-transferable badge) ERR-NOT-TRANSFERABLE)
      (try! (transfer-token token-id amount from to))
      (print memo)
      (ok true)
    )
  )
)

;; SIP-013: Transfer many
(define-public (transfer-memo?
  (token-id uint)
  (amount uint)
  (from principal)
  (to principal)
  (memo (buff 34))
)
  (transfer token-id amount from to (some memo))
)

;; Internal transfer function
(define-private (transfer-token
  (token-id uint)
  (amount uint)
  (from principal)
  (to principal)
)
  (let (
    (from-balance (get-balance-uint token-id from))
    (to-balance (get-balance-uint token-id to))
  )
    (asserts! (>= from-balance amount) ERR-INSUFFICIENT-BALANCE)
    (set-balance token-id (- from-balance amount) from)
    (set-balance token-id (+ to-balance amount) to)
    (ok true)
  )
)

;; Create badge type
(define-public (create-badge-type
  (name (string-utf8 128))
  (description (string-utf8 512))
  (category (string-utf8 64))
  (max-tier uint)
  (is-transferable bool)
  (metadata-uri (string-utf8 256))
)
  (let ((badge-id (+ (var-get badge-counter) u1)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)

    (map-set badge-types badge-id {
      badge-id: badge-id,
      name: name,
      description: description,
      category: category,
      max-tier: max-tier,
      is-transferable: is-transferable,
      metadata-uri: metadata-uri
    })

    (var-set badge-counter badge-id)
    (ok badge-id)
  )
)

;; Award badge to user
(define-public (award-badge
  (user principal)
  (badge-id uint)
  (tier uint)
  (amount uint)
  (metadata (string-utf8 512))
)
  (let (
    (badge (unwrap! (map-get? badge-types badge-id) ERR-BADGE-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (current-balance (get-balance-uint badge-id user))
  )
    (asserts! (<= tier (get max-tier badge)) ERR-INVALID-SENDER)

    ;; Update user badge record
    (map-set user-badges { user: user, badge-id: badge-id } {
      tier: tier,
      amount: (+ current-balance amount),
      earned-date: current-time,
      metadata: metadata
    })

    ;; Update balance
    (set-balance badge-id (+ current-balance amount) user)

    ;; Update total supply
    (map-set token-supplies badge-id
      (+ (default-to u0 (map-get? token-supplies badge-id)) amount)
    )

    (ok true)
  )
)

;; Create achievement
(define-public (create-achievement
  (name (string-utf8 128))
  (description (string-utf8 512))
  (points-reward uint)
  (requirements (string-utf8 512))
)
  (let ((achievement-id (+ (var-get achievement-counter) u1)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)

    (map-set achievements achievement-id {
      achievement-id: achievement-id,
      name: name,
      description: description,
      points-reward: points-reward,
      requirements: requirements
    })

    (var-set achievement-counter achievement-id)
    (ok achievement-id)
  )
)

;; Unlock achievement
(define-public (unlock-achievement (user principal) (achievement-id uint))
  (let ((achievement (unwrap! (map-get? achievements achievement-id) ERR-ACHIEVEMENT-NOT-FOUND)))
    (asserts! (is-none (map-get? user-achievements { user: user, achievement-id: achievement-id })) ERR-ALREADY-EARNED)

    ;; Record achievement unlock
    (map-set user-achievements { user: user, achievement-id: achievement-id } true)

    ;; Award points (could be used for future features)
    (ok (get points-reward achievement))
  )
)

;; Get badge type details
(define-read-only (get-badge-type (badge-id uint))
  (map-get? badge-types badge-id)
)

;; Get user badge
(define-read-only (get-user-badge (user principal) (badge-id uint))
  (map-get? user-badges { user: user, badge-id: badge-id })
)

;; Get achievement details
(define-read-only (get-achievement (achievement-id uint))
  (map-get? achievements achievement-id)
)

;; Check if user has achievement
(define-read-only (has-achievement (user principal) (achievement-id uint))
  (is-some (map-get? user-achievements { user: user, achievement-id: achievement-id }))
)

;; Initialize default badge types
(define-private (initialize-badge-types)
  (begin
    ;; Bronze Fan Badge
    (try! (create-badge-type
      "Bronze Fan"
      "Attend 5 events - Entry level supporter"
      "attendance"
      u1
      true
      "https://api.intic.com/badges/bronze-fan"
    ))

    ;; Silver Fan Badge
    (try! (create-badge-type
      "Silver Fan"
      "Attend 15 events - Dedicated supporter with early access"
      "attendance"
      u2
      true
      "https://api.intic.com/badges/silver-fan"
    ))

    ;; Gold Fan Badge
    (try! (create-badge-type
      "Gold Fan"
      "Attend 50 events - VIP supporter with exclusive benefits"
      "attendance"
      u3
      true
      "https://api.intic.com/badges/gold-fan"
    ))

    ;; Platinum Fan Badge
    (try! (create-badge-type
      "Platinum Fan"
      "Attend 100 events - Elite supporter with governance power"
      "attendance"
      u4
      true
      "https://api.intic.com/badges/platinum-fan"
    ))

    (ok true)
  )
)

;; Update user engagement stats
(define-public (update-engagement-stats 
  (user principal) 
  (points-earned uint) 
  (activity-type (string-utf8 64))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (let (
      (current-stats (default-to {
        total-points: u0,
        activity-score: u0,
        rank: u0,
        last-active: u0,
        level: LEVEL-BRONZE,
        experience: u0,
        next-level-exp: u100
      } (map-get? user-engagement-stats user)))
      (current-time (unwrap-panic (get-block-info? time u0)))
      (new-points (+ (get total-points current-stats) points-earned))
      (new-exp (+ (get experience current-stats) points-earned))
    )
      ;; Calculate new level based on experience
      (let (
        (new-level (calculate-user-level new-exp))
        (new-next-level-exp (calculate-next-level-exp new-level))
      )
        (map-set user-engagement-stats user {
          total-points: new-points,
          activity-score: (+ (get activity-score current-stats) points-earned),
          rank: (get rank current-stats), ;; Will be updated separately
          last-active: current-time,
          level: new-level,
          experience: new-exp,
          next-level-exp: new-next-level-exp
        })
        
        ;; Update contribution tracking
        (let (
          (current-contributions (default-to u0 (map-get? user-contributions {
            user: user,
            contribution-type: activity-type
          })))
        )
          (map-set user-contributions {
            user: user,
            contribution-type: activity-type
          } (+ current-contributions u1))
        )
        
        ;; Update community stats
        (var-set total-community-points (+ (var-get total-community-points) points-earned))
        
        (ok {
          new-level: new-level,
          total-points: new-points,
          experience: new-exp
        })
      )
    )
  )
)

;; Calculate user level based on experience
(define-private (calculate-user-level (exp uint))
  (if (< exp u100)
    LEVEL-BRONZE
    (if (< exp u500)
      LEVEL-SILVER
      (if (< exp u1000)
        LEVEL-GOLD
        (if (< exp u5000)
          LEVEL-PLATINUM
          LEVEL-DIAMOND
        )
      )
    )
  )
)

;; Calculate experience needed for next level
(define-private (calculate-next-level-exp (current-level uint))
  (if (is-eq current-level LEVEL-BRONZE)
    u100
    (if (is-eq current-level LEVEL-SILVER)
      u500
      (if (is-eq current-level LEVEL-GOLD)
        u1000
        (if (is-eq current-level LEVEL-PLATINUM)
          u5000
          u10000  ;; For diamond level
        )
      )
    )
  )
)

;; Get enhanced user profile
(define-read-only (get-enhanced-user-profile (user principal))
  (let (
    (basic-stats (get-balance-uint u1 user))  ;; Assuming badge ID 1 for basic stats
    (engagement-stats (map-get? user-engagement-stats user))
    (badges-owned (get-user-badges-all user)) ;; Would need to implement this
    (achievements-earned (get-user-achievements-all user)) ;; Would need to implement this
  )
    (ok {
      user: user,
      total-badges: basic-stats,
      engagement-stats: engagement-stats,
      badges-owned: badges-owned,
      achievements-earned: achievements-earned,
      level: (if (is-none engagement-stats) LEVEL-BRONZE (get level (unwrap-panic engagement-stats))),
      experience: (if (is-none engagement-stats) u0 (get experience (unwrap-panic engagement-stats))),
      next-level-exp: (if (is-none engagement-stats) u100 (get next-level-exp (unwrap-panic engagement-stats)))
    })
  )
)

;; Get leaderboard
(define-read-only (get-leaderboard (limit uint))
  (ok true)  ;; Simplified - would return top users by engagement
)

;; Get user referrals
(define-read-only (get-user-referrals (user principal))
  (map-get? user-referrals user)
)

;; Record referral
(define-public (record-referral (referrer principal) (referral principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (let (
      (current-referral-data (default-to {
        referrer: referrer,
        referral-count: u0,
        rewards-earned: u0
      } (map-get? user-referrals referrer)))
    )
      (map-set user-referrals referrer {
        referrer: referrer,
        referral-count: (+ (get referral-count current-referral-data) u1),
        rewards-earned: (get rewards-earned current-referral-data)
      })
      
      (ok true)
    )
  )
)

;; Get user badges with details
(define-read-only (get-user-badges-all (user principal))
  (ok true)  ;; Simplified - would return all badges owned by user
)

;; Get user achievements with details
(define-read-only (get-user-achievements-all (user principal))
  (ok true)  ;; Simplified - would return all achievements earned by user
)

;; Get global stats
(define-read-only (get-global-community-stats)
  (ok {
    total-community-points: (var-get total-community-points),
    total-active-users: (var-get total-active-users),
    daily-active-users: (var-get daily-active-users),
    total-badges-awarded: u0,  ;; Would calculate from token supplies
    total-achievements-unlocked: u0  ;; Would calculate from achievement records
  })
)

;; Contract initialization
(begin
  (try! (initialize-badge-types))
)</content>
<parameter name="filePath">D:\BAHAN PROJECT\pulse-robot-template-87267\contracts\intic-smart-contracts\proof-of-fandom.clar