;; Governance Contract for Pulse Robot Platform
;; DAO governance system with proposal creation, voting, and execution
;; Features: Proposal lifecycle, voting power, quorum, execution

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u400))
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u402))
(define-constant ERR-ALREADY-VOTED (err u403))
(define-constant ERR-VOTING-ENDED (err u404))
(define-constant ERR-VOTING-ACTIVE (err u405))
(define-constant ERR-INSUFFICIENT-VOTING-POWER (err u406))
(define-constant ERR-PROPOSAL-EXPIRED (err u407))
(define-constant ERR-QUORUM-NOT-MET (err u408))
(define-constant ERR-PROPOSAL-REJECTED (err u409))
(define-constant ERR-ALREADY-EXECUTED (err u410))
(define-constant ERR-INVALID-DURATION (err u411))

;; Governance parameters
(define-data-var proposal-threshold uint u1000000) ;; Minimum tokens to create proposal (10 sBTC)
(define-data-var voting-period uint u2016) ;; ~2 weeks in blocks
(define-data-var quorum-percentage uint u1000) ;; 10% of total voting power
(define-data-var execution-delay uint u144) ;; ~1 day delay before execution
(define-data-var proposal-deposit uint u100000) ;; 1 sBTC deposit for proposals

;; Data variables
(define-data-var next-proposal-id uint u1)
(define-data-var total-voting-power uint u0)
(define-data-var treasury-balance uint u0)

;; Proposal structure
(define-map proposals uint {
  proposal-id: uint,
  proposer: principal,
  title: (string-utf8 256),
  description: (string-utf8 1024),
  proposal-type: (string-utf8 64),
  target-contract: (optional principal),
  function-name: (optional (string-ascii 128)),
  parameters: (optional (string-utf8 512)),
  amount: (optional uint),
  recipient: (optional principal),
  start-block: uint,
  end-block: uint,
  execution-block: uint,
  votes-for: uint,
  votes-against: uint,
  votes-abstain: uint,
  total-votes: uint,
  status: (string-utf8 32),
  executed: bool,
  created-at: uint,
  metadata-uri: (optional (string-utf8 256))
})

;; Voting records
(define-map votes {proposal-id: uint, voter: principal} {
  voting-power: uint,
  vote-type: (string-utf8 16), ;; "for", "against", "abstain"
  voted-at: uint,
  delegate: (optional principal)
})

;; Voting power (based on sBTC holdings and proof of fandom badges)
(define-map voting-power principal {
  base-power: uint,
  badge-multiplier: uint,
  delegated-power: uint,
  total-power: uint,
  last-updated: uint
})

;; Delegation system
(define-map delegates principal principal) ;; delegator -> delegate
(define-map delegate-votes principal uint) ;; delegate -> total delegated votes

;; Proposal types and their requirements
(define-map proposal-types (string-utf8 64) {
  min-voting-power: uint,
  quorum-required: uint,
  execution-delay: uint,
  requires-super-majority: bool
})

;; Emergency proposals (shorter voting period)
(define-map emergency-proposals uint bool)

;; Proposal execution queue
(define-map execution-queue uint {
  proposal-id: uint,
  execution-block: uint,
  executor: (optional principal)
})

;; Treasury operations
(define-map treasury-operations uint {
  operation-id: uint,
  operation-type: (string-utf8 64),
  amount: uint,
  recipient: principal,
  description: (string-utf8 256),
  approved: bool,
  executed: bool
})

;; Governance Functions

(define-public (create-proposal
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type (string-utf8 64))
  (target-contract (optional principal))
  (function-name (optional (string-ascii 128)))
  (parameters (optional (string-utf8 512)))
  (amount (optional uint))
  (recipient (optional principal))
  (metadata-uri (optional (string-utf8 256))))
  (let ((proposal-id (var-get next-proposal-id))
        (voter-power (get-current-voting-power tx-sender))
        (type-requirements (default-to
          {min-voting-power: (var-get proposal-threshold), quorum-required: (var-get quorum-percentage),
           execution-delay: (var-get execution-delay), requires-super-majority: false}
          (map-get? proposal-types proposal-type))))

    ;; Check proposer has sufficient voting power
    (asserts! (>= voter-power (get min-voting-power type-requirements)) (err ERR-INSUFFICIENT-VOTING-POWER))

    ;; Create proposal
    (map-set proposals proposal-id {
      proposal-id: proposal-id,
      proposer: tx-sender,
      title: title,
      description: description,
      proposal-type: proposal-type,
      target-contract: target-contract,
      function-name: function-name,
      parameters: parameters,
      amount: amount,
      recipient: recipient,
      start-block: block-height,
      end-block: (+ block-height (var-get voting-period)),
      execution-block: (+ block-height (var-get voting-period) (get execution-delay type-requirements)),
      votes-for: u0,
      votes-against: u0,
      votes-abstain: u0,
      total-votes: u0,
      status: "active",
      executed: false,
      created-at: block-height,
      metadata-uri: metadata-uri
    })

    ;; Add to execution queue
    (map-set execution-queue proposal-id {
      proposal-id: proposal-id,
      execution-block: (+ block-height (var-get voting-period) (get execution-delay type-requirements)),
      executor: none
    })

    ;; Increment proposal counter
    (var-set next-proposal-id (+ proposal-id u1))

    (ok proposal-id)))

(define-public (vote (proposal-id uint) (vote-type (string-utf8 16)))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err ERR-NOT-FOUND)))
        (voter-power (get-current-voting-power tx-sender)))

    ;; Validations
    (asserts! (< block-height (get end-block proposal)) (err ERR-VOTING-ENDED))
    (asserts! (is-eq (get status proposal) "active") (err ERR-VOTING-ENDED))
    (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) (err ERR-ALREADY-VOTED))
    (asserts! (> voter-power u0) (err ERR-INSUFFICIENT-VOTING-POWER))

    ;; Record vote
    (map-set votes {proposal-id: proposal-id, voter: tx-sender} {
      voting-power: voter-power,
      vote-type: vote-type,
      voted-at: block-height,
      delegate: none
    })

    ;; Update proposal vote counts
    (let ((updated-proposal
      (if (is-eq vote-type "for")
        (merge proposal {
          votes-for: (+ (get votes-for proposal) voter-power),
          total-votes: (+ (get total-votes proposal) voter-power)
        })
        (if (is-eq vote-type "against")
          (merge proposal {
            votes-against: (+ (get votes-against proposal) voter-power),
            total-votes: (+ (get total-votes proposal) voter-power)
          })
          (merge proposal {
            votes-abstain: (+ (get votes-abstain proposal) voter-power),
            total-votes: (+ (get total-votes proposal) voter-power)
          })))))

      (map-set proposals proposal-id updated-proposal)
      (ok true))))

(define-public (delegate-vote (delegate principal))
  (begin
    (asserts! (not (is-eq tx-sender delegate)) (err ERR-UNAUTHORIZED))

    ;; Remove previous delegation
    (let ((current-delegate (map-get? delegates tx-sender)))
      (match current-delegate
        prev-delegate (map-set delegate-votes prev-delegate
          (- (default-to u0 (map-get? delegate-votes prev-delegate)) (get-current-voting-power tx-sender)))
        true))

    ;; Set new delegation
    (map-set delegates tx-sender delegate)
    (map-set delegate-votes delegate
      (+ (default-to u0 (map-get? delegate-votes delegate)) (get-current-voting-power tx-sender)))

    (ok true)))

(define-public (execute-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err ERR-NOT-FOUND)))
        (queue-item (unwrap! (map-get? execution-queue proposal-id) (err ERR-NOT-FOUND))))

    ;; Validations
    (asserts! (>= block-height (get execution-block queue-item)) (err ERR-PROPOSAL_EXPIRED))
    (asserts! (not (get executed proposal)) (err ERR-ALREADY-EXECUTED))
    (asserts! (>= block-height (get end-block proposal)) (err ERR-VOTING-ACTIVE))

    ;; Check if proposal passed
    (let ((quorum-met (>= (get total-votes proposal) (/ (* (var-get total-voting-power) (var-get quorum-percentage)) u10000)))
          (majority-met (> (get votes-for proposal) (get votes-against proposal))))

      (asserts! quorum-met (err ERR-QUORUM-NOT-MET))
      (asserts! majority-met (err ERR-PROPOSAL-REJECTED))

      ;; Execute based on proposal type
      (let ((execution-result
        (if (is-eq (get proposal-type proposal) "treasury-spend")
          (execute-treasury-spend proposal-id)
          (if (is-eq (get proposal-type proposal) "parameter-change")
            (execute-parameter-change proposal-id)
            (if (is-eq (get proposal-type proposal) "contract-upgrade")
              (execute-contract-upgrade proposal-id)
              (ok true))))))

        ;; Mark as executed
        (map-set proposals proposal-id (merge proposal { executed: true, status: "executed" }))

        ;; Remove from execution queue
        (map-delete execution-queue proposal-id)

        (ok true)))))

;; Execution Functions

(define-private (execute-treasury-spend (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err ERR-NOT-FOUND))))
    (match (get amount proposal)
      amount (match (get recipient proposal)
        recipient (begin
          ;; Transfer from treasury (simplified - would integrate with treasury contract)
          (var-set treasury-balance (- (var-get treasury-balance) amount))
          (ok true))
        (err ERR-NOT-FOUND))
      (err ERR-NOT-FOUND))))

(define-private (execute-parameter-change (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err ERR-NOT-FOUND))))
    ;; Parse parameters and update governance settings
    ;; This would parse the parameters string and update relevant variables
    (ok true)))

(define-private (execute-contract-upgrade (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err ERR-NOT-FOUND))))
    ;; Execute contract upgrade
    ;; This would call the target contract with specified function and parameters
    (ok true)))

;; Voting Power Calculation

(define-public (update-voting-power (user principal) (sbtc-balance uint) (badge-multiplier uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (let ((current-power (default-to
      {base-power: u0, badge-multiplier: u100, delegated-power: u0, total-power: u0, last-updated: u0}
      (map-get? voting-power user))))

      (let ((base-power sbtc-balance)
            (multiplied-power (/ (* base-power badge-multiplier) u100))
            (delegated (get delegated-power current-power))
            (total (+ multiplied-power delegated)))

        (map-set voting-power user {
          base-power: base-power,
          badge-multiplier: badge-multiplier,
          delegated-power: delegated,
          total-power: total,
          last-updated: block-height
        })

        ;; Update total voting power
        (var-set total-voting-power
          (+ (- (var-get total-voting-power) (get total-power current-power)) total))

        (ok total)))))

(define-read-only (get-current-voting-power (user principal))
  (let ((power-data (map-get? voting-power user))
        (delegated-to-user (default-to u0 (map-get? delegate-votes user))))
    (match power-data
      data (+ (get total-power data) delegated-to-user)
      delegated-to-user)))

;; Emergency Functions

(define-public (create-emergency-proposal
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (justification (string-utf8 512)))
  (let ((proposal-id (var-get next-proposal-id)))

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    ;; Create with shorter voting period
    (map-set proposals proposal-id {
      proposal-id: proposal-id,
      proposer: tx-sender,
      title: title,
      description: description,
      proposal-type: "emergency",
      target-contract: none,
      function-name: none,
      parameters: none,
      amount: none,
      recipient: none,
      start-block: block-height,
      end-block: (+ block-height u288), ;; ~2 days
      execution-block: (+ block-height u432), ;; ~3 days
      votes-for: u0,
      votes-against: u0,
      votes-abstain: u0,
      total-votes: u0,
      status: "active",
      executed: false,
      created-at: block-height,
      metadata-uri: none
    })

    (map-set emergency-proposals proposal-id true)
    (var-set next-proposal-id (+ proposal-id u1))

    (ok proposal-id)))

;; Read-only Functions

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id))

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes {proposal-id: proposal-id, voter: voter}))

(define-read-only (get-voting-power-info (user principal))
  (map-get? voting-power user))

(define-read-only (get-delegate (user principal))
  (map-get? delegates user))

(define-read-only (get-governance-stats)
  {
    total-proposals: (- (var-get next-proposal-id) u1),
    total-voting-power: (var-get total-voting-power),
    proposal-threshold: (var-get proposal-threshold),
    voting-period: (var-get voting-period),
    quorum-percentage: (var-get quorum-percentage),
    treasury-balance: (var-get treasury-balance)
  })

(define-read-only (get-proposal-status (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err ERR-NOT-FOUND))))
    (if (get executed proposal)
      "executed"
      (if (>= block-height (get end-block proposal))
        (if (and
              (>= (get total-votes proposal) (/ (* (var-get total-voting-power) (var-get quorum-percentage)) u10000))
              (> (get votes-for proposal) (get votes-against proposal)))
          "passed"
          "rejected")
        "active"))))

;; Admin Functions

(define-public (set-governance-parameter (parameter (string-ascii 32)) (value uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (if (is-eq parameter "proposal-threshold")
      (var-set proposal-threshold value)
      (if (is-eq parameter "voting-period")
        (var-set voting-period value)
        (if (is-eq parameter "quorum-percentage")
          (var-set quorum-percentage value)
          (if (is-eq parameter "execution-delay")
            (var-set execution-delay value)
            false))))

    (ok true)))

(define-public (add-proposal-type
  (type-name (string-utf8 64))
  (min-voting-power uint)
  (quorum-required uint)
  (execution-delay uint)
  (requires-super-majority bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (map-set proposal-types type-name {
      min-voting-power: min-voting-power,
      quorum-required: quorum-required,
      execution-delay: execution-delay,
      requires-super-majority: requires-super-majority
    })

    (ok true)))

(define-public (emergency-pause (reason (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    ;; Pause all active proposals
    ;; Implementation would iterate through active proposals and pause them
    (ok true)))