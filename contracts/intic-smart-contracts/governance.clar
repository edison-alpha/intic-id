;; Governance Contract for INTIC Pulse Robot Platform
;; DAO functionality with proposal creation, voting, treasury management, and enhanced features

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PROPOSAL-THRESHOLD u10) ;; Minimum sBTC to create proposals
(define-constant VOTING-PERIOD u2016) ;; ~2 weeks in blocks
(define-constant QUORUM-THRESHOLD u10) ;; 10% quorum
(define-constant EXECUTION-DELAY u144) ;; ~1 day delay
(define-constant MIN-DEPOSIT u1000000) ;; 0.01 sBTC minimum deposit for proposals
(define-constant PROPOSAL-TEMPLATE-COUNT u5) ;; Number of available proposal templates
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-INSUFFICIENT-THRESHOLD (err u101))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u102))
(define-constant ERR-VOTING-CLOSED (err u103))
(define-constant ERR-ALREADY-VOTED (err u104))
(define-constant ERR-QUORUM-NOT-MET (err u105))
(define-constant ERR-EXECUTION-TOO-EARLY (err u106))
(define-constant ERR-PROPOSAL-FAILED (err u107))
(define-constant ERR-INVALID-VOTE (err u108))
(define-constant ERR-INSUFFICIENT-FUNDS (err u109))
(define-constant ERR-INVALID-TEMPLATE (err u110))
(define-constant ERR-INVALID-STATUS (err u111))

;; Data Maps
(define-map proposals uint {
  proposal-id: uint,
  proposer: principal,
  title: (string-utf8 256),
  description: (string-utf8 1024),
  proposal-type: (string-utf8 64),
  amount: (optional uint),
  recipient: (optional principal),
  start-block: uint,
  end-block: uint,
  for-votes: uint,
  against-votes: uint,
  executed: bool,
  cancelled: bool,
  deposit-amount: uint,
  metadata-uri: (optional (string-ascii 256)),
  total-participants: uint
})

(define-map votes {
  proposal-id: uint,
  voter: principal
} {
  vote: bool, ;; true = for, false = against
  voting-power: uint,
  timestamp: uint
})

(define-map voting-power principal uint)
(define-map delegations principal principal)

;; Proposal templates for common actions
(define-map proposal-templates uint {
  template-id: uint,
  name: (string-utf8 128),
  description: (string-utf8 512),
  default-type: (string-utf8 64),
  default-amount: (optional uint),
  default-recipient: (optional principal)
})

;; Proposal status tracking
(define-map proposal-status-tracker uint {
  proposal-id: uint,
  status-history: (list 10 { 
    status: (string-utf8 64), 
    timestamp: uint, 
    actor: principal 
  })
})

;; Data Variables
(define-data-var proposal-counter uint u0)
(define-data-var treasury-balance uint u0)
(define-data-var template-counter uint u0)

;; Proposal types
(define-constant PROPOSAL-TYPE-FUNDING "funding")
(define-constant PROPOSAL-TYPE-PARAMETER "parameter")
(define-constant PROPOSAL-TYPE-CONTRACT "contract")
(define-constant PROPOSAL-TYPE-TREASURY "treasury")
(define-constant PROPOSAL-TYPE-COMMUNITY "community")

;; Proposal statuses
(define-constant STATUS-DRAFT "draft")
(define-constant STATUS-PENDING "pending")
(define-constant STATUS-ACTIVE "active")
(define-constant STATUS-CANCELLED "cancelled")
(define-constant STATUS-PASSED "passed")
(define-constant STATUS-FAILED "failed")
(define-constant STATUS-EXECUTED "executed")

;; Create proposal
(define-public (create-proposal
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type (string-utf8 64))
  (amount (optional uint))
  (recipient (optional principal))
  (metadata-uri (optional (string-ascii 256)))
)
  (let (
    (proposal-id (+ (var-get proposal-counter) u1))
    (current-block (unwrap-panic (get-block-info? time u0)))
    (proposer-voting-power (get-voting-power tx-sender))
  )
    ;; Check threshold
    (asserts! (>= proposer-voting-power PROPOSAL-THRESHOLD) ERR-INSUFFICIENT-THRESHOLD)

    ;; Validate proposal type
    (asserts! (or
      (is-eq proposal-type PROPOSAL-TYPE-FUNDING)
      (is-eq proposal-type PROPOSAL-TYPE-PARAMETER)
      (is-eq proposal-type PROPOSAL-TYPE-CONTRACT)
      (is-eq proposal-type PROPOSAL-TYPE-TREASURY)
      (is-eq proposal-type PROPOSAL-TYPE-COMMUNITY)
    ) ERR-INVALID-VOTE)

    ;; Create proposal
    (map-set proposals proposal-id {
      proposal-id: proposal-id,
      proposer: tx-sender,
      title: title,
      description: description,
      proposal-type: proposal-type,
      amount: amount,
      recipient: recipient,
      start-block: current-block,
      end-block: (+ current-block VOTING-PERIOD),
      for-votes: u0,
      against-votes: u0,
      executed: false,
      cancelled: false,
      deposit-amount: MIN-DEPOSIT,
      metadata-uri: metadata-uri,
      total-participants: u0
    })

    ;; Add to status tracker
    (map-set proposal-status-tracker proposal-id {
      proposal-id: proposal-id,
      status-history: (list 
        { status: STATUS-PENDING, timestamp: current-block, actor: tx-sender }
      )
    })

    (var-set proposal-counter proposal-id)
    (ok proposal-id)
  )
)

;; Create proposal from template
(define-public (create-proposal-from-template
  (template-id uint)
  (custom-title (optional (string-utf8 256)))
  (custom-description (optional (string-utf8 1024)))
  (custom-amount (optional uint))
  (custom-recipient (optional principal))
)
  (let (
    (template (unwrap! (map-get? proposal-templates template-id) ERR-INVALID-TEMPLATE))
    (title (default-to (get name template) custom-title))
    (description (default-to (get description template) custom-description))
    (amount (default-to (get default-amount template) custom-amount))
    (recipient (default-to (get default-recipient template) custom-recipient))
    (proposal-type (get default-type template))
  )
    (create-proposal title description proposal-type amount recipient none)
  )
)

;; Create proposal template (admin only)
(define-public (create-proposal-template
  (name (string-utf8 128))
  (description (string-utf8 512))
  (default-type (string-utf8 64))
  (default-amount (optional uint))
  (default-recipient (optional principal))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (let (
      (template-id (+ (var-get template-counter) u1))
    )
      (map-set proposal-templates template-id {
        template-id: template-id,
        name: name,
        description: description,
        default-type: default-type,
        default-amount: default-amount,
        default-recipient: default-recipient
      })
      
      (var-set template-counter template-id)
      (ok template-id)
    )
  )
)

;; Vote on proposal
(define-public (vote (proposal-id uint) (support bool))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (current-block (unwrap-panic (get-block-info? time u0)))
    (voter-power (get-voting-power tx-sender))
  )
    ;; Check if voting is open
    (asserts! (and
      (>= current-block (get start-block proposal))
      (<= current-block (get end-block proposal))
    ) ERR-VOTING-CLOSED)

    ;; Check if already voted
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) ERR-ALREADY-VOTED)

    ;; Record vote
    (map-set votes { proposal-id: proposal-id, voter: tx-sender } {
      vote: support,
      voting-power: voter-power,
      timestamp: current-block
    })

    ;; Update proposal votes and participation count
    (let (
      (updated-proposal (if support
        (merge proposal { 
          for-votes: (+ (get for-votes proposal) voter-power),
          total-participants: (+ (get total-participants proposal) u1)
        })
        (merge proposal { 
          against-votes: (+ (get against-votes proposal) voter-power),
          total-participants: (+ (get total-participants proposal) u1)
        })
      ))
    )
      (map-set proposals proposal-id updated-proposal)
    )

    ;; Update cross-contract integration if available
    (try! (contract-call? .cross-contract-integration update-user-activity tx-sender "proposal-vote" u1))

    (ok true)
  )
)

;; Get proposal participation rate
(define-read-only (get-proposal-participation (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    (ok {
      total-participants: (get total-participants proposal),
      for-votes: (get for-votes proposal),
      against-votes: (get against-votes proposal),
      participation-rate: (if (> (get total-voting-power) u0)
        (/ (* (get total-participants proposal) u10000) (get total-voting-power))
        u0
      )
    })
  )
)

;; Execute proposal
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (current-block (unwrap-panic (get-block-info? time u0)))
    (total-votes (+ (get for-votes proposal) (get against-votes proposal)))
    (quorum-required (/ (* (get-total-voting-power) QUORUM-THRESHOLD) u100))
  )
    ;; Check if voting period has ended
    (asserts! (> current-block (get end-block proposal)) ERR-VOTING-CLOSED)

    ;; Check execution delay
    (asserts! (>= current-block (+ (get end-block proposal) EXECUTION-DELAY)) ERR-EXECUTION-TOO-EARLY)

    ;; Check quorum
    (asserts! (>= total-votes quorum-required) ERR-QUORUM-NOT-MET)

    ;; Check if proposal passed
    (asserts! (> (get for-votes proposal) (get against-votes proposal)) ERR-PROPOSAL-FAILED)

    ;; Check if already executed
    (asserts! (not (get executed proposal)) ERR-PROPOSAL-FAILED)

    ;; Execute based on proposal type
    (if (is-eq (get proposal-type proposal) PROPOSAL-TYPE-FUNDING)
      (try! (execute-funding-proposal proposal))
      (if (is-eq (get proposal-type proposal) PROPOSAL-TYPE-TREASURY)
        (try! (execute-treasury-proposal proposal))
        true
      )
    )

    ;; Mark as executed
    (let (
      (updated-proposal (merge proposal { executed: true }))
    )
      (map-set proposals proposal-id updated-proposal)
      
      ;; Update status tracker
      (append-proposal-status proposal-id STATUS-EXECUTED tx-sender)
    )

    (ok true)
  )
)

;; Execute treasury proposal
(define-private (execute-treasury-proposal (proposal {proposal-id: uint, proposer: principal, title: (string-utf8 256), description: (string-utf8 1024), proposal-type: (string-utf8 64), amount: (optional uint), recipient: (optional principal), start-block: uint, end-block: uint, for-votes: uint, against-votes: uint, executed: bool, cancelled: bool, deposit-amount: uint, metadata-uri: (optional (string-ascii 256)), total-participants: uint}))
  (let (
    (amount (unwrap! (get amount proposal) ERR-INVALID-VOTE))
    (recipient (unwrap! (get recipient proposal) ERR-INVALID-VOTE))
  )
    ;; Check treasury balance
    (asserts! (>= (var-get treasury-balance) amount) ERR-INSUFFICIENT-FUNDS)

    ;; Update treasury balance
    (var-set treasury-balance (- (var-get treasury-balance) amount))

    ;; In real implementation, transfer funds to recipient
    ;; This would require integration with payment system
    (ok true)
  )
)

;; Execute funding proposal
(define-private (execute-funding-proposal (proposal {proposal-id: uint, proposer: principal, title: (string-utf8 256), description: (string-utf8 1024), proposal-type: (string-utf8 64), amount: (optional uint), recipient: (optional principal), start-block: uint, end-block: uint, for-votes: uint, against-votes: uint, executed: bool, cancelled: bool}))
  (let (
    (amount (unwrap! (get amount proposal) ERR-INVALID-VOTE))
    (recipient (unwrap! (get recipient proposal) ERR-INVALID-VOTE))
  )
    ;; Transfer from treasury (simplified - would use actual treasury)
    (asserts! (>= (var-get treasury-balance) amount) ERR-INSUFFICIENT-THRESHOLD)

    ;; Update treasury balance
    (var-set treasury-balance (- (var-get treasury-balance) amount))

    ;; Transfer funds (would use sBTC transfer)
    (ok true)
  )
)

;; Delegate voting power
(define-public (delegate-vote (delegate principal))
  (begin
    (asserts! (not (is-eq delegate tx-sender)) ERR-INVALID-VOTE)
    (map-set delegations tx-sender delegate)
    (ok true)
  )
)

;; Update voting power (called by staking contract or badge contract)
(define-public (update-voting-power (user principal) (power uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set voting-power user power)
    (ok power)
  )
)

;; Get voting power (including delegations)
(define-private (get-voting-power (user principal))
  (let ((direct-power (default-to u0 (map-get? voting-power user))))
    (+ direct-power (get-delegated-power user))
  )
)

;; Get delegated power
(define-private (get-delegated-power (user principal))
  (let ((delegate (map-get? delegations user)))
    (if (is-some delegate)
      (get-voting-power (unwrap-panic delegate))
      u0
    )
  )
)

;; Append status to proposal history
(define-private (append-proposal-status (proposal-id uint) (status (string-utf8 64)) (actor principal))
  (let (
    (current-block (unwrap-panic (get-block-info? time u0)))
    (tracker (unwrap! (map-get? proposal-status-tracker proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (current-history (get status-history tracker))
  )
    ;; In a real implementation, we would append to the list
    ;; For now, we'll just update the tracker with a new history
    (map-set proposal-status-tracker proposal-id {
      proposal-id: proposal-id,
      status-history: (list 
        { status: status, timestamp: current-block, actor: actor }
      )
    })
  )
)

;; Get total voting power
(define-private (get-total-voting-power)
  ;; Simplified - would calculate total across all users
  u10000
)

;; Get proposal analytics
(define-read-only (get-proposal-analytics (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    (ok {
      proposal-id: proposal-id,
      title: (get title proposal),
      proposer: (get proposer proposal),
      proposal-type: (get proposal-type proposal),
      start-block: (get start-block proposal),
      end-block: (get end-block proposal),
      for-votes: (get for-votes proposal),
      against-votes: (get against-votes proposal),
      total-votes: (+ (get for-votes proposal) (get against-votes proposal)),
      total-participants: (get total-participants proposal),
      vote-distribution: (/ (* (get for-votes proposal) u10000) (+ (get for-votes proposal) (get against-votes proposal))),
      participation-rate: (if (> (get-total-voting-power) u0)
        (/ (* (+ (get for-votes proposal) (get against-votes proposal)) u10000) (get-total-voting-power))
        u0
      ),
      time-remaining: (if (< (unwrap-panic (get-block-info? time u0)) (get end-block proposal))
        (- (get end-block proposal) (unwrap-panic (get-block-info? time u0)))
        u0
      )
    })
  )
)

;; Get active proposals
(define-read-only (get-active-proposals)
  (ok true) ;; Simplified - would return list of active proposals
)

;; Get user proposals
(define-read-only (get-user-proposals (user principal))
  (ok true) ;; Simplified - would return list of user's proposals
)

;; Get user votes
(define-read-only (get-user-votes (user principal))
  (ok true) ;; Simplified - would return list of user's votes
)

;; Update voting power based on staking and badges
(define-public (update-voting-power-from-staking (user principal))
  (begin
    ;; This would integrate with sbtc-payment contract to calculate voting power
    ;; based on staking amount
    (let (
      (staking-info (contract-call? .sbtc-payment get-staking-position user))
      (base-power (default-to u0 (map-get? voting-power user)))
    )
      (if (is-ok staking-info)
        (let (
          (staked-amount (get amount (unwrap-panic staking-info)))
          (new-power (+ base-power (/ staked-amount u1000000))) ;; 1 voting power per 1 STX staked
        )
          (map-set voting-power user new-power)
          (ok new-power)
        )
        (ok base-power)
      )
    )
  )
)

;; Update voting power based on badges
(define-public (update-voting-power-from-badges (user principal))
  (begin
    ;; This would integrate with proof-of-fandom contract to calculate voting power
    ;; based on badge ownership
    (let (
      (badge-balance (contract-call? .proof-of-fandom get-overall-balance user))
      (base-power (default-to u0 (map-get? voting-power user)))
    )
      (if (is-ok badge-balance)
        (let (
          (badges-owned (unwrap-panic badge-balance))
          (badge-bonus (* badges-owned u5)) ;; 5 additional voting power per badge
          (new-power (+ base-power badge-bonus))
        )
          (map-set voting-power user new-power)
          (ok new-power)
        )
        (ok base-power)
      )
    )
  )
)

;; Cancel proposal (only by proposer)
(define-public (cancel-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND)))
    (asserts! (is-eq (get proposer proposal) tx-sender) ERR-OWNER-ONLY)
    (asserts! (not (get executed proposal)) ERR-PROPOSAL-FAILED)

    (map-set proposals proposal-id
      (merge proposal { cancelled: true })
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-user-voting-power (user principal))
  (get-voting-power user)
)

(define-read-only (get-delegation (user principal))
  (map-get? delegations user)
)

(define-read-only (get-treasury-balance)
  (var-get treasury-balance)
)

(define-read-only (get-proposal-count)
  (var-get proposal-counter)
)

;; Emergency governance (admin only)
(define-public (emergency-execute (proposal-id uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (let ((proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND)))
      (map-set proposals proposal-id
        (merge proposal { executed: true })
      )
      (ok true)
    )
  )
)</content>
<parameter name="filePath">D:\BAHAN PROJECT\pulse-robot-template-87267\contracts\intic-smart-contracts\governance.clar