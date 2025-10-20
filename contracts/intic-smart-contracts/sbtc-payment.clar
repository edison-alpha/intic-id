;; Payment Contract for INTIC Pulse Robot Platform
;; Handles sBTC transactions, escrow system, staking, and platform fees

(impl-trait .sip-010-trait.sip-010-trait)

;; Define fungible token for platform rewards
(define-fungible-token intic-reward-token)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-FEE u25) ;; 2.5% platform fee
(define-constant STAKING-REWARD-RATE u50) ;; 5% APY base rate
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-ESCROW-NOT-FOUND (err u103))
(define-constant ERR-ESCROW-EXPIRED (err u104))
(define-constant ERR-UNAUTHORIZED (err u105))
(define-constant ERR-STAKING-NOT-FOUND (err u106))

;; Data Maps
(define-map escrows uint {
  escrow-id: uint,
  seller: principal,
  buyer: principal,
  amount: uint,
  purpose: (string-utf8 128),
  created-at: uint,
  duration-blocks: uint,
  is-active: bool
})

(define-map staking-positions principal {
  amount: uint,
  start-block: uint,
  last-claim: uint,
  pool-id: uint,
  lock-period: uint, ;; Lock-up period in blocks
  early-unstake-penalty: uint, ;; Penalty percentage if unstaked early
  boosted-rewards: bool, ;; Whether position qualifies for boosted rewards
  last-compound: uint ;; Last time rewards were compounded
})

(define-map staking-pools uint {
  pool-id: uint,
  total-staked: uint,
  reward-rate: uint,
  is-active: bool,
  min-stake-amount: uint,
  max-stake-amount: uint,
  lock-period: uint, ;; Required lock period for this pool
  early-unstake-penalty: uint, ;; Penalty for early unstaking
  boost-multiplier: uint ;; Multiplier for boosted rewards
})

(define-map staking-historical-records {
  user: principal,
  pool-id: uint,
  stake-id: uint
} {
  stake-amount: uint,
  start-block: uint,
  end-block: uint,
  rewards-earned: uint,
  status: (string-utf8 32) ;; "active", "unstaked", "withdrawn"
})

(define-map payment-records uint {
  payment-id: uint,
  from: principal,
  to: principal,
  amount: uint,
  fee: uint,
  timestamp: uint,
  purpose: (string-utf8 128)
})

(define-map user-staking-history principal (list 20 uint)) ;; Track user's stake IDs

;; Data Variables
(define-data-var escrow-counter uint u0)
(define-data-var payment-counter uint u0)
(define-data-var pool-counter uint u0)
(define-data-var total-platform-fees uint u0)
(define-data-var stake-id-counter uint u0)

;; Staking status
(define-constant STAKE-ACTIVE "active")
(define-constant STAKE-UNSTAKED "unstaked")
(define-constant STAKE-WITHDRAWN "withdrawn")

;; SIP-010: Get token name
(define-read-only (get-name)
  (ok "INTIC Reward Token")
)

;; SIP-010: Get token symbol
(define-read-only (get-symbol)
  (ok "INTIC")
)

;; SIP-010: Get decimals
(define-read-only (get-decimals)
  (ok u6)
)

;; SIP-010: Get total supply
(define-read-only (get-total-supply)
  (ok (ft-get-supply intic-reward-token))
)

;; SIP-010: Get balance
(define-read-only (get-balance (account principal))
  (ok (ft-get-balance intic-reward-token account))
)

;; SIP-010: Get token URI
(define-read-only (get-token-uri)
  (ok (some "https://api.intic.com/token-metadata"))
)

;; SIP-010: Transfer
(define-public (transfer
  (amount uint)
  (from principal)
  (to principal)
  (memo (optional (buff 34)))
)
  (begin
    (asserts! (is-eq from tx-sender) ERR-UNAUTHORIZED)
    (try! (ft-transfer? intic-reward-token amount from to))
    (print memo)
    (ok true)
  )
)

;; Process ticket payment
(define-public (process-ticket-payment
  (buyer principal)
  (event-organizer principal)
  (amount uint)
  (event-id uint)
  (ticket-count uint)
)
  (let (
    (platform-fee (/ (* amount PLATFORM-FEE) u1000))
    (organizer-revenue (- amount platform-fee))
    (payment-id (+ (var-get payment-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    ;; Transfer sBTC from buyer to contract (simplified - would use sBTC contract)
    ;; For now, assume payment is handled externally

    ;; Record payment
    (map-set payment-records payment-id {
      payment-id: payment-id,
      from: buyer,
      to: event-organizer,
      amount: organizer-revenue,
      fee: platform-fee,
      timestamp: current-time,
      purpose: (concat "Ticket purchase - Event " (uint-to-string event-id))
    })

    ;; Update platform fees
    (var-set total-platform-fees (+ (var-get total-platform-fees) platform-fee))

    ;; Mint reward tokens to buyer (loyalty program)
    (try! (ft-mint? intic-reward-token (/ amount u100) buyer))

    (var-set payment-counter payment-id)
    (ok payment-id)
  )
)

;; Create escrow for secondary market
(define-public (create-escrow
  (buyer principal)
  (amount uint)
  (purpose (string-utf8 128))
  (duration-blocks uint)
)
  (let (
    (escrow-id (+ (var-get escrow-counter) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    ;; Transfer funds to escrow (simplified)
    ;; In real implementation, would transfer sBTC to contract

    (map-set escrows escrow-id {
      escrow-id: escrow-id,
      seller: tx-sender,
      buyer: buyer,
      amount: amount,
      purpose: purpose,
      created-at: current-time,
      duration-blocks: duration-blocks,
      is-active: true
    })

    (var-set escrow-counter escrow-id)
    (ok escrow-id)
  )
)

;; Release escrow (successful transaction)
(define-public (release-escrow (escrow-id uint))
  (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR-ESCROW-NOT-FOUND)))
    (asserts! (or (is-eq (get seller escrow) tx-sender) (is-eq (get buyer escrow) tx-sender)) ERR-UNAUTHORIZED)
    (asserts! (get is-active escrow) ERR-ESCROW-NOT-FOUND)

    ;; Transfer funds to seller (simplified)
    ;; Mark escrow as inactive
    (map-set escrows escrow-id
      (merge escrow { is-active: false })
    )

    (ok true)
  )
)

;; Refund escrow (failed transaction)
(define-public (refund-escrow (escrow-id uint))
  (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR-ESCROW-NOT-FOUND)))
    (asserts! (or (is-eq (get seller escrow) tx-sender) (is-eq (get buyer escrow) tx-sender)) ERR-UNAUTHORIZED)
    (asserts! (get is-active escrow) ERR-ESCROW-NOT-FOUND)

    ;; Check if escrow has expired
    (let ((current-time (unwrap-panic (get-block-info? time u0))))
      (asserts! (>= current-time (+ (get created-at escrow) (get duration-blocks escrow))) ERR-ESCROW-EXPIRED)
    )

    ;; Refund to buyer (simplified)
    ;; Mark escrow as inactive
    (map-set escrows escrow-id
      (merge escrow { is-active: false })
    )

    (ok true)
  )
)

;; Stake sBTC for rewards with enhanced features
(define-public (stake-sbtc (amount uint) (pool-id uint))
  (let (
    (pool (unwrap! (map-get? staking-pools pool-id) ERR-STAKING-NOT-FOUND))
    (current-position (default-to { 
      amount: u0, 
      start-block: u0, 
      last-claim: u0, 
      pool-id: pool-id,
      lock-period: u0,
      early-unstake-penalty: u0,
      boosted-rewards: false,
      last-compound: u0
    } (map-get? staking-positions tx-sender)))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (asserts! (get is-active pool) ERR-STAKING-NOT-FOUND)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (>= amount (get min-stake-amount pool)) ERR-INVALID-AMOUNT)
    (asserts! (or (is-eq (get max-stake-amount pool) u0) (<= (+ (get amount current-position) amount) (get max-stake-amount pool))) ERR-INVALID-AMOUNT)

    ;; Transfer sBTC to contract (simplified)

    ;; Generate unique stake ID
    (let (
      (stake-id (+ (var-get stake-id-counter) u1))
      (boosted-status (is-eq (mod stake-id u7) u0)) ;; Every 7th stake gets boosted rewards
    )
      ;; Update user position with enhanced features
      (map-set staking-positions tx-sender {
        amount: (+ (get amount current-position) amount),
        start-block: (if (is-eq (get start-block current-position) u0) current-time (get start-block current-position)),
        last-claim: current-time,
        pool-id: pool-id,
        lock-period: (get lock-period pool),
        early-unstake-penalty: (get early-unstake-penalty pool),
        boosted-rewards: (or (get boosted-rewards current-position) boosted-status),
        last-compound: current-time
      })

      ;; Create staking record
      (map-set staking-historical-records {
        user: tx-sender,
        pool-id: pool-id,
        stake-id: stake-id
      } {
        stake-amount: amount,
        start-block: current-time,
        end-block: u0, ;; Will be set when unstaked
        rewards-earned: u0,
        status: STAKE-ACTIVE
      })

      ;; Update user's stake history
      (let (
        (current-history (default-to (list u0) (map-get? user-staking-history tx-sender)))
        (new-history (append current-history stake-id))
      )
        (map-set user-staking-history tx-sender new-history)
      )

      ;; Update pool total
      (map-set staking-pools pool-id
        (merge pool { total-staked: (+ (get total-staked pool) amount) })
      )

      (var-set stake-id-counter stake-id)

      ;; Update cross-contract integration
      (try! (contract-call? .cross-contract-integration update-user-activity tx-sender "stake-update" (+ (get amount current-position) amount)))

      (ok stake-id)
    )
  )
)

;; Stake with lock-up period (enhanced staking)
(define-public (stake-sbtc-with-lockup (amount uint) (pool-id uint) (lock-period uint))
  (let (
    (pool (unwrap! (map-get? staking-pools pool-id) ERR-STAKING-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    ;; Check if lock period is valid for this pool
    (asserts! (>= lock-period (get lock-period pool)) ERR-INVALID-AMOUNT)
    
    ;; Call the regular stake function but add lockup info
    (let ((stake-id (unwrap! (stake-sbtc amount pool-id) ERR-INVALID-AMOUNT)))
      ;; Update the lock period in the position
      (let ((current-position (unwrap! (map-get? staking-positions tx-sender) ERR-STAKING-NOT-FOUND)))
        (map-set staking-positions tx-sender
          (merge current-position { lock-period: lock-period })
        )
      )
      (ok stake-id)
    )
  )
)

;; Claim staking rewards with enhanced features
(define-public (claim-staking-rewards)
  (let (
    (position (unwrap! (map-get? staking-positions tx-sender) ERR-STAKING-NOT-FOUND))
    (pool (unwrap! (map-get? staking-pools (get pool-id position)) ERR-STAKING-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (blocks-staked (- current-time (get last-claim position)))
    (base-reward (/ (* (get amount position) (get reward-rate pool) blocks-staked) u1000000))
    (boost-multiplier (if (get boosted-rewards position) (get boost-multiplier pool) u1000)) ;; 1.0x or higher
    (reward-amount (/ (* base-reward boost-multiplier) u1000))
  )
    ;; Mint reward tokens
    (try! (ft-mint? intic-reward-token reward-amount tx-sender))

    ;; Update last claim
    (map-set staking-positions tx-sender
      (merge position { last-claim: current-time })
    )

    (ok reward-amount)
  )
)

;; Compound staking rewards (reinvest rewards)
(define-public (compound-staking-rewards)
  (let (
    (position (unwrap! (map-get? staking-positions tx-sender) ERR-STAKING-NOT-FOUND))
    (pool (unwrap! (map-get? staking-pools (get pool-id position)) ERR-STAKING-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (blocks-staked (- current-time (get last-compound position)))
    (base-reward (/ (* (get amount position) (get reward-rate pool) blocks-staked) u1000000))
    (boost-multiplier (if (get boosted-rewards position) (get boost-multiplier pool) u1000)) ;; 1.0x or higher
    (reward-amount (/ (* base-reward boost-multiplier) u1000))
  )
    ;; Instead of minting tokens, add rewards to staking amount
    (map-set staking-positions tx-sender
      (merge position { 
        amount: (+ (get amount position) reward-amount),
        last-compound: current-time
      })
    )

    ;; Update pool total
    (map-set staking-pools (get pool-id position)
      (merge pool { total-staked: (+ (get total-staked pool) reward-amount) })
    )

    (ok reward-amount)
  )
)

;; Unstake sBTC with enhanced features
(define-public (unstake-sbtc)
  (let (
    (position (unwrap! (map-get? staking-positions tx-sender) ERR-STAKING-NOT-FOUND))
    (pool (unwrap! (map-get? staking-pools (get pool-id position)) ERR-STAKING-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    ;; Check if lockup period has passed
    (let (
      (stake-start (get start-block position))
      (lock-period (get lock-period position))
    )
      (asserts! (or (is-eq lock-period u0) (>= current-time (+ stake-start lock-period))) ERR-INVALID-AMOUNT)
    )

    ;; Claim any pending rewards first
    (try! (claim-staking-rewards))

    ;; Calculate penalty if unstaking early (in this case, we've already passed lockup)
    (let (
      (original-amount (get amount position))
      (penalty-amount (/ (* original-amount (get early-unstake-penalty pool)) u10000)) ;; penalty is in basis points
      (net-amount (- original-amount penalty-amount))
    )
      ;; Transfer sBTC back to user (simplified)
      
      ;; Update pool total
      (map-set staking-pools (get pool-id position)
        (merge pool { total-staked: (- (get total-staked pool) original-amount) })
      )

      ;; Update staking record
      (map-set staking-historical-records {
        user: tx-sender,
        pool-id: (get pool-id position),
        stake-id: (var-get stake-id-counter) ;; This is a simplification
      } {
        stake-amount: original-amount,
        start-block: (get start-block position),
        end-block: current-time,
        rewards-earned: u0, ;; Would track actual rewards earned
        status: STAKE-UNSTAKED
      })

      ;; Remove position
      (map-delete staking-positions tx-sender)

      (ok net-amount)
    )
  )
)

;; Force unstake early (with penalty)
(define-public (force-unstake-early)
  (let (
    (position (unwrap! (map-get? staking-positions tx-sender) ERR-STAKING-NOT-FOUND))
    (pool (unwrap! (map-get? staking-pools (get pool-id position)) ERR-STAKING-NOT-FOUND))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    ;; Even if lockup period hasn't passed, allow forced unstaking with penalty
    (try! (claim-staking-rewards))

    (let (
      (original-amount (get amount position))
      (penalty-amount (/ (* original-amount (get early-unstake-penalty pool)) u10000)) ;; penalty is in basis points
      (net-amount (- original-amount penalty-amount))
    )
      ;; Transfer sBTC back to user with penalty (simplified)
      
      ;; Update pool total
      (map-set staking-pools (get pool-id position)
        (merge pool { total-staked: (- (get total-staked pool) original-amount) })
      )

      ;; Update staking record
      (map-set staking-historical-records {
        user: tx-sender,
        pool-id: (get pool-id position),
        stake-id: (var-get stake-id-counter) ;; This is a simplification
      } {
        stake-amount: original-amount,
        start-block: (get start-block position),
        end-block: current-time,
        rewards-earned: u0, ;; Would track actual rewards earned
        status: STAKE-UNSTAKED
      })

      ;; Remove position
      (map-delete staking-positions tx-sender)

      (ok net-amount)
    )
  )
)

;; Get staking position with enhanced details
(define-read-only (get-enhanced-staking-position (user principal))
  (let (
    (position (map-get? staking-positions user))
  )
    (if (is-none position)
      (ok none)
      (let (
        (pos-val (unwrap-panic position))
        (pool (unwrap! (map-get? staking-pools (get pool-id pos-val)) ERR-STAKING-NOT-FOUND))
        (current-time (unwrap-panic (get-block-info? time u0)))
        (time-staked (- current-time (get start-block pos-val)))
        (accrued-rewards (/ (* (get amount pos-val) (get reward-rate pool) time-staked) u1000000))
        (boost-multiplier (if (get boosted-rewards pos-val) (get boost-multiplier pool) u1000))
        (boosted-rewards (/ (* accrued-rewards boost-multiplier) u1000))
      )
        (ok (merge pos-val {
          current-rewards: boosted-rewards,
          time-staked: time-staked,
          pool-name: "STX Boost Pool", ;; Would come from pool info
          estimated-apr: (get reward-rate pool)
        }))
      )
    )
  )
)

;; Create staking pool with advanced parameters (admin only)
(define-public (create-staking-pool 
  (reward-rate uint) 
  (min-stake-amount uint) 
  (max-stake-amount uint) 
  (lock-period uint)
  (early-unstake-penalty uint)
  (boost-multiplier uint)
)
  (let ((pool-id (+ (var-get pool-counter) u1)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)

    (map-set staking-pools pool-id {
      pool-id: pool-id,
      total-staked: u0,
      reward-rate: reward-rate,
      is-active: true,
      min-stake-amount: min-stake-amount,
      max-stake-amount: max-stake-amount,
      lock-period: lock-period,
      early-unstake-penalty: early-unstake-penalty,
      boost-multiplier: boost-multiplier
    })

    (var-set pool-counter pool-id)
    (ok pool-id)
  )
)

;; Update staking pool parameters (admin only)
(define-public (update-staking-pool 
  (pool-id uint)
  (new-reward-rate (optional uint))
  (new-min-stake (optional uint))
  (new-max-stake (optional uint))
  (new-lock-period (optional uint))
  (new-early-penalty (optional uint))
  (new-boost-multiplier (optional uint))
  (new-is-active (optional bool))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (let ((pool (unwrap! (map-get? staking-pools pool-id) ERR-STAKING-NOT-FOUND)))
      (map-set staking-pools pool-id {
        pool-id: pool-id,
        total-staked: (get total-staked pool),
        reward-rate: (default-to (get reward-rate pool) new-reward-rate),
        is-active: (default-to (get is-active pool) new-is-active),
        min-stake-amount: (default-to (get min-stake-amount pool) new-min-stake),
        max-stake-amount: (default-to (get max-stake-amount pool) new-max-stake),
        lock-period: (default-to (get lock-period pool) new-lock-period),
        early-unstake-penalty: (default-to (get early-unstake-penalty pool) new-early-penalty),
        boost-multiplier: (default-to (get boost-multiplier pool) new-boost-multiplier)
      })
      (ok pool-id)
    )
  )
)

;; Read-only functions
(define-read-only (get-escrow (escrow-id uint))
  (map-get? escrows escrow-id)
)

(define-read-only (get-payment-record (payment-id uint))
  (map-get? payment-records payment-id)
)

(define-read-only (get-staking-position (user principal))
  (map-get? staking-positions user)
)

(define-read-only (get-staking-pool (pool-id uint))
  (map-get? staking-pools pool-id)
)

(define-read-only (get-total-platform-fees)
  (var-get total-platform-fees)
)

;; Initialize default staking pool
(define-private (initialize-pools)
  (create-staking-pool STAKING-REWARD-RATE)
)

;; Contract initialization
(begin
  (try! (initialize-pools))
)</content>
<parameter name="filePath">D:\BAHAN PROJECT\pulse-robot-template-87267\contracts\intic-smart-contracts\sbtc-payment.clar