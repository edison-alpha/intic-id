;; sBTC Payment Integration Contract for Pulse Robot Platform
;; Handles sBTC payments for ticket purchases, staking, and rewards
;; Features: Payment processing, escrow, rewards distribution, staking

;; Import required traits
(use-trait sip-010-trait .sip-010-trait.sip-010-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u300))
(define-constant ERR-UNAUTHORIZED (err u301))
(define-constant ERR-NOT-FOUND (err u302))
(define-constant ERR-INSUFFICIENT-BALANCE (err u303))
(define-constant ERR-INVALID-AMOUNT (err u304))
(define-constant ERR-PAYMENT-FAILED (err u305))
(define-constant ERR-ESCROW-NOT-FOUND (err u306))
(define-constant ERR-ESCROW-EXPIRED (err u307))
(define-constant ERR-ESCROW-ALREADY-RELEASED (err u308))
(define-constant ERR-STAKING-NOT-FOUND (err u309))
(define-constant ERR-STAKING-LOCKED (err u310))
(define-constant ERR-INVALID-DURATION (err u311))

;; sBTC Token Contract (will be set during deployment)
(define-data-var sbtc-token-contract principal tx-sender)
(define-data-var platform-fee-percentage uint u250) ;; 2.5%
(define-data-var treasury-wallet principal CONTRACT-OWNER)

;; Payment tracking
(define-data-var payment-nonce uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-fees-collected uint u0)

;; Payment Records
(define-map payments uint {
  payment-id: uint,
  payer: principal,
  recipient: principal,
  amount: uint,
  fee-amount: uint,
  payment-type: (string-utf8 64),
  reference-id: uint, ;; event-id or ticket-id
  status: (string-utf8 32),
  created-at: uint,
  completed-at: (optional uint),
  metadata: (string-utf8 512)
})

;; Escrow System for Secure Transactions
(define-map escrows uint {
  escrow-id: uint,
  buyer: principal,
  seller: principal,
  amount: uint,
  fee-amount: uint,
  purpose: (string-utf8 128),
  reference-id: uint,
  expiry-block: uint,
  is-released: bool,
  created-at: uint,
  conditions: (string-utf8 512)
})

;; Staking System
(define-map stakes principal {
  staker: principal,
  amount: uint,
  start-block: uint,
  lock-duration: uint,
  end-block: uint,
  reward-rate: uint,
  accumulated-rewards: uint,
  last-claim-block: uint,
  is-active: bool
})

;; Staking Pools
(define-map staking-pools uint {
  pool-id: uint,
  name: (string-utf8 128),
  total-staked: uint,
  reward-rate: uint, ;; Annual percentage in basis points
  min-stake-amount: uint,
  lock-duration: uint,
  max-capacity: uint,
  is-active: bool,
  created-at: uint
})

;; Reward Distribution
(define-map pending-rewards principal uint)
(define-map reward-history {user: principal, block: uint} uint)

;; Payment Processing Functions

(define-public (process-ticket-payment
  (buyer principal)
  (event-organizer principal)
  (amount uint)
  (event-id uint)
  (ticket-count uint))
  (let ((payment-id (+ (var-get payment-nonce) u1))
        (platform-fee (/ (* amount (var-get platform-fee-percentage)) u10000))
        (organizer-amount (- amount platform-fee)))

    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (is-eq tx-sender buyer) (err ERR-UNAUTHORIZED))

    ;; Check buyer has sufficient sBTC balance
    (let ((buyer-balance (unwrap! (contract-call? (var-get sbtc-token-contract) get-balance buyer) (err ERR-PAYMENT-FAILED))))
      (asserts! (>= buyer-balance amount) (err ERR-INSUFFICIENT-BALANCE))

      ;; Transfer sBTC from buyer to contract
      (unwrap! (contract-call? (var-get sbtc-token-contract) transfer amount buyer (as-contract tx-sender) none) (err ERR-PAYMENT-FAILED))

      ;; Transfer organizer amount to event organizer
      (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer organizer-amount tx-sender event-organizer none)) (err ERR-PAYMENT-FAILED))

      ;; Transfer platform fee to treasury
      (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer platform-fee tx-sender (var-get treasury-wallet) none)) (err ERR-PAYMENT-FAILED))

      ;; Record payment
      (map-set payments payment-id {
        payment-id: payment-id,
        payer: buyer,
        recipient: event-organizer,
        amount: amount,
        fee-amount: platform-fee,
        payment-type: "ticket-purchase",
        reference-id: event-id,
        status: "completed",
        created-at: block-height,
        completed-at: (some block-height),
        metadata: (concat "Tickets: " (uint-to-string ticket-count))
      })

      ;; Update global stats
      (var-set payment-nonce payment-id)
      (var-set total-volume (+ (var-get total-volume) amount))
      (var-set total-fees-collected (+ (var-get total-fees-collected) platform-fee))

      (ok payment-id))))

(define-public (process-secondary-sale
  (seller principal)
  (buyer principal)
  (amount uint)
  (ticket-id uint)
  (royalty-recipient principal)
  (royalty-percentage uint))
  (let ((payment-id (+ (var-get payment-nonce) u1))
        (platform-fee (/ (* amount (var-get platform-fee-percentage)) u10000))
        (royalty-amount (/ (* amount royalty-percentage) u10000))
        (seller-amount (- amount platform-fee royalty-amount)))

    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (is-eq tx-sender buyer) (err ERR-UNAUTHORIZED))

    ;; Check buyer has sufficient balance
    (let ((buyer-balance (unwrap! (contract-call? (var-get sbtc-token-contract) get-balance buyer) (err ERR-PAYMENT-FAILED))))
      (asserts! (>= buyer-balance amount) (err ERR-INSUFFICIENT-BALANCE))

      ;; Transfer sBTC from buyer to contract
      (unwrap! (contract-call? (var-get sbtc-token-contract) transfer amount buyer (as-contract tx-sender) none) (err ERR-PAYMENT-FAILED))

      ;; Distribute payments
      (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer seller-amount tx-sender seller none)) (err ERR-PAYMENT-FAILED))
      (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer royalty-amount tx-sender royalty-recipient none)) (err ERR-PAYMENT-FAILED))
      (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer platform-fee tx-sender (var-get treasury-wallet) none)) (err ERR-PAYMENT-FAILED))

      ;; Record payment
      (map-set payments payment-id {
        payment-id: payment-id,
        payer: buyer,
        recipient: seller,
        amount: amount,
        fee-amount: platform-fee,
        payment-type: "secondary-sale",
        reference-id: ticket-id,
        status: "completed",
        created-at: block-height,
        completed-at: (some block-height),
        metadata: (concat "Royalty: " (uint-to-string royalty-amount))
      })

      ;; Update stats
      (var-set payment-nonce payment-id)
      (var-set total-volume (+ (var-get total-volume) amount))
      (var-set total-fees-collected (+ (var-get total-fees-collected) platform-fee))

      (ok payment-id))))

;; Escrow Functions for Secure Transactions

(define-public (create-escrow
  (seller principal)
  (amount uint)
  (purpose (string-utf8 128))
  (reference-id uint)
  (duration-blocks uint)
  (conditions (string-utf8 512)))
  (let ((escrow-id (+ (var-get payment-nonce) u1000))
        (platform-fee (/ (* amount (var-get platform-fee-percentage)) u10000))
        (total-amount (+ amount platform-fee)))

    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (> duration-blocks u0) (err ERR-INVALID-DURATION))

    ;; Transfer sBTC to escrow
    (let ((buyer-balance (unwrap! (contract-call? (var-get sbtc-token-contract) get-balance tx-sender) (err ERR-PAYMENT-FAILED))))
      (asserts! (>= buyer-balance total-amount) (err ERR-INSUFFICIENT-BALANCE))

      (unwrap! (contract-call? (var-get sbtc-token-contract) transfer total-amount tx-sender (as-contract tx-sender) none) (err ERR-PAYMENT-FAILED))

      ;; Create escrow record
      (map-set escrows escrow-id {
        escrow-id: escrow-id,
        buyer: tx-sender,
        seller: seller,
        amount: amount,
        fee-amount: platform-fee,
        purpose: purpose,
        reference-id: reference-id,
        expiry-block: (+ block-height duration-blocks),
        is-released: false,
        created-at: block-height,
        conditions: conditions
      })

      (ok escrow-id))))

(define-public (release-escrow (escrow-id uint))
  (let ((escrow (unwrap! (map-get? escrows escrow-id) (err ERR-ESCROW-NOT-FOUND))))

    (asserts! (or (is-eq tx-sender (get buyer escrow))
                  (is-eq tx-sender (get seller escrow))
                  (is-eq tx-sender CONTRACT-OWNER)) (err ERR-UNAUTHORIZED))
    (asserts! (not (get is-released escrow)) (err ERR-ESCROW-ALREADY-RELEASED))
    (asserts! (<= block-height (get expiry-block escrow)) (err ERR-ESCROW-EXPIRED))

    ;; Release funds to seller
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer (get amount escrow) tx-sender (get seller escrow) none)) (err ERR-PAYMENT-FAILED))

    ;; Transfer fee to treasury
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer (get fee-amount escrow) tx-sender (var-get treasury-wallet) none)) (err ERR-PAYMENT-FAILED))

    ;; Mark as released
    (map-set escrows escrow-id (merge escrow { is-released: true }))

    (ok true)))

(define-public (refund-escrow (escrow-id uint))
  (let ((escrow (unwrap! (map-get? escrows escrow-id) (err ERR-ESCROW-NOT-FOUND))))

    (asserts! (or (> block-height (get expiry-block escrow))
                  (is-eq tx-sender CONTRACT-OWNER)) (err ERR-UNAUTHORIZED))
    (asserts! (not (get is-released escrow)) (err ERR-ESCROW-ALREADY-RELEASED))

    ;; Refund to buyer (minus platform fee)
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer (get amount escrow) tx-sender (get buyer escrow) none)) (err ERR-PAYMENT-FAILED))

    ;; Keep platform fee
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer (get fee-amount escrow) tx-sender (var-get treasury-wallet) none)) (err ERR-PAYMENT-FAILED))

    ;; Mark as released
    (map-set escrows escrow-id (merge escrow { is-released: true }))

    (ok true)))

;; Staking Functions

(define-public (create-staking-pool
  (name (string-utf8 128))
  (reward-rate uint)
  (min-stake-amount uint)
  (lock-duration uint)
  (max-capacity uint))
  (let ((pool-id (+ (var-get payment-nonce) u2000)))

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (> reward-rate u0) (err ERR-INVALID-AMOUNT))
    (asserts! (> lock-duration u0) (err ERR-INVALID-DURATION))

    (map-set staking-pools pool-id {
      pool-id: pool-id,
      name: name,
      total-staked: u0,
      reward-rate: reward-rate,
      min-stake-amount: min-stake-amount,
      lock-duration: lock-duration,
      max-capacity: max-capacity,
      is-active: true,
      created-at: block-height
    })

    (ok pool-id)))

(define-public (stake-sbtc (amount uint) (pool-id uint))
  (let ((pool (unwrap! (map-get? staking-pools pool-id) (err ERR-NOT-FOUND)))
        (current-stake (map-get? stakes tx-sender)))

    (asserts! (get is-active pool) (err ERR-UNAUTHORIZED))
    (asserts! (>= amount (get min-stake-amount pool)) (err ERR-INVALID-AMOUNT))
    (asserts! (is-none current-stake) (err ERR-STAKING-NOT-FOUND)) ;; No existing stake

    ;; Check capacity
    (asserts! (<= (+ (get total-staked pool) amount) (get max-capacity pool)) (err ERR-INVALID-AMOUNT))

    ;; Transfer sBTC to contract
    (let ((staker-balance (unwrap! (contract-call? (var-get sbtc-token-contract) get-balance tx-sender) (err ERR-PAYMENT-FAILED))))
      (asserts! (>= staker-balance amount) (err ERR-INSUFFICIENT-BALANCE))

      (unwrap! (contract-call? (var-get sbtc-token-contract) transfer amount tx-sender (as-contract tx-sender) none) (err ERR-PAYMENT-FAILED))

      ;; Create stake record
      (map-set stakes tx-sender {
        staker: tx-sender,
        amount: amount,
        start-block: block-height,
        lock-duration: (get lock-duration pool),
        end-block: (+ block-height (get lock-duration pool)),
        reward-rate: (get reward-rate pool),
        accumulated-rewards: u0,
        last-claim-block: block-height,
        is-active: true
      })

      ;; Update pool total
      (map-set staking-pools pool-id
        (merge pool { total-staked: (+ (get total-staked pool) amount) }))

      (ok true))))

(define-public (claim-staking-rewards)
  (let ((stake (unwrap! (map-get? stakes tx-sender) (err ERR-STAKING-NOT-FOUND))))

    (asserts! (get is-active stake) (err ERR-STAKING-NOT-FOUND))

    (let ((blocks-elapsed (- block-height (get last-claim-block stake)))
          (reward-amount (calculate-staking-rewards stake blocks-elapsed)))

      (asserts! (> reward-amount u0) (err ERR-INVALID-AMOUNT))

      ;; Update stake record
      (map-set stakes tx-sender
        (merge stake {
          accumulated-rewards: (+ (get accumulated-rewards stake) reward-amount),
          last-claim-block: block-height
        }))

      ;; Add to pending rewards
      (map-set pending-rewards tx-sender
        (+ (default-to u0 (map-get? pending-rewards tx-sender)) reward-amount))

      (ok reward-amount))))

(define-public (unstake-sbtc)
  (let ((stake (unwrap! (map-get? stakes tx-sender) (err ERR-STAKING-NOT-FOUND))))

    (asserts! (get is-active stake) (err ERR-STAKING-NOT-FOUND))
    (asserts! (>= block-height (get end-block stake)) (err ERR-STAKING-LOCKED))

    ;; Claim final rewards
    (unwrap! (claim-staking-rewards) (err ERR-PAYMENT-FAILED))

    ;; Return staked amount
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer (get amount stake) tx-sender (get staker stake) none)) (err ERR-PAYMENT-FAILED))

    ;; Deactivate stake
    (map-set stakes tx-sender (merge stake { is-active: false }))

    (ok (get amount stake))))

(define-public (withdraw-rewards)
  (let ((reward-amount (default-to u0 (map-get? pending-rewards tx-sender))))

    (asserts! (> reward-amount u0) (err ERR-INVALID-AMOUNT))

    ;; Transfer rewards
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer reward-amount tx-sender tx-sender none)) (err ERR-PAYMENT-FAILED))

    ;; Clear pending rewards
    (map-delete pending-rewards tx-sender)

    ;; Record in history
    (map-set reward-history {user: tx-sender, block: block-height} reward-amount)

    (ok reward-amount)))

;; Helper Functions

(define-private (calculate-staking-rewards (stake {staker: principal, amount: uint, start-block: uint, lock-duration: uint, end-block: uint, reward-rate: uint, accumulated-rewards: uint, last-claim-block: uint, is-active: bool}) (blocks-elapsed uint))
  (let ((annual-blocks u52560) ;; Approximate blocks per year
        (annual-reward (/ (* (get amount stake) (get reward-rate stake)) u10000))
        (block-reward (/ annual-reward annual-blocks)))
    (* block-reward blocks-elapsed)))

(define-private (uint-to-string (value uint))
  "VALUE") ;; Simplified for demo

;; Read-only Functions

(define-read-only (get-payment (payment-id uint))
  (map-get? payments payment-id))

(define-read-only (get-escrow (escrow-id uint))
  (map-get? escrows escrow-id))

(define-read-only (get-stake (staker principal))
  (map-get? stakes staker))

(define-read-only (get-staking-pool (pool-id uint))
  (map-get? staking-pools pool-id))

(define-read-only (get-pending-rewards (user principal))
  (default-to u0 (map-get? pending-rewards user)))

(define-read-only (get-platform-stats)
  {
    total-volume: (var-get total-volume),
    total-fees: (var-get total-fees-collected),
    platform-fee: (var-get platform-fee-percentage),
    total-payments: (var-get payment-nonce)
  })

(define-read-only (calculate-purchase-total (amount uint))
  (let ((platform-fee (/ (* amount (var-get platform-fee-percentage)) u10000)))
    {
      subtotal: amount,
      platform-fee: platform-fee,
      total: (+ amount platform-fee)
    }))

;; Admin Functions

(define-public (set-sbtc-token-contract (contract principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set sbtc-token-contract contract)
    (ok true)))

(define-public (set-platform-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (<= new-fee u1000) (err ERR-INVALID-AMOUNT)) ;; Max 10%
    (var-set platform-fee-percentage new-fee)
    (ok true)))

(define-public (set-treasury-wallet (new-treasury principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set treasury-wallet new-treasury)
    (ok true)))

(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (unwrap! (as-contract (contract-call? (var-get sbtc-token-contract) transfer amount tx-sender recipient none)) (err ERR-PAYMENT-FAILED))
    (ok true)))

(define-public (pause-staking-pool (pool-id uint))
  (let ((pool (unwrap! (map-get? staking-pools pool-id) (err ERR-NOT-FOUND))))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (map-set staking-pools pool-id (merge pool { is-active: false }))
    (ok true)))