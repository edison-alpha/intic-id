;; Cross-Contract Integration Contract for INTIC Pulse Robot Platform
;; Provides missing features and integrates across all other contracts
;; Features: Enhanced dashboard analytics, cross-contract voting power, 
;; event calendar, user notifications, advanced governance features

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))
(define-constant ERR-INVALID-CONTRACT (err u102))

;; Data Maps
(define-map user-activity principal {
  total-events-attended: uint,
  total-proposals-voted: uint,
  total-nfts-owned: uint,
  total-staked-amount: uint,
  last-activity: uint,
  engagement-score: uint
})

(define-map user-notifications principal {
  notification-id: uint,
  message: (string-utf8 512),
  timestamp: uint,
  is-read: bool,
  notification-type: (string-utf8 64)
})

(define-map user-following {
  follower: principal,
  followee: principal
} bool)

(define-map treasury-operations uint {
  operation-id: uint,
  operation-type: (string-utf8 64), ;; "spending", "allocation", "withdrawal"
  amount: uint,
  proposal-id: uint,
  recipient: principal,
  timestamp: uint,
  executed: bool
})

(define-map proposal-comments uint {
  comment-id: uint,
  proposal-id: uint,
  author: principal,
  content: (string-utf8 1024),
  timestamp: uint,
  parent-comment: (optional uint) ;; For nested comments
})

(define-map notification-counter uint uint)
(define-map comment-counter uint uint)

;; Data Variables
(define-data-var total-users uint u0)
(define-data-var total-treasury-operations uint u0)
(define-data-var total-comments uint u0)

;; Function to get enhanced user dashboard metrics by querying other contracts
(define-read-only (get-enhanced-user-dashboard (user principal))
  (begin
    ;; Get data from governance contract
    (let (
      (voting-power (contract-call? .governance get-user-voting-power user))
      (user-proposals-count (get-user-proposals-count user)) ;; This would need to be implemented
      (user-votes-count (get-user-votes-count user)) ;; This would need to be implemented
    )
      ;; Get data from proof-of-fandom contract
      (let (
        (badge-balance (contract-call? .proof-of-fandom get-overall-balance user))
        (user-engagement (contract-call? .proof-of-fandom get-enhanced-user-profile user))
      )
        ;; Get data from sbtc-payment contract
        (let (
          (reward-balance (contract-call? .sbtc-payment get-balance user))
          (enhanced-staking (contract-call? .sbtc-payment get-enhanced-staking-position user))
        )
          ;; Get data from nft-ticket contract
          (let (
            (ticket-balance (contract-call? .nft-ticket get-balance user))
            (user-tickets (get-user-tickets-full user)) ;; This would need to be implemented
          )
            ;; Get data from nft-marketplace contract
            (let (
              (user-listings (get-user-listings-full user)) ;; This would need to be implemented
              (user-offers (get-user-offers-full user)) ;; This would need to be implemented
            )
              ;; Get data from nft contract factory
              (let (
                (user-events (get-user-created-events user)) ;; This would need to be implemented
              )
                ;; Return combined dashboard data
                (ok {
                  user: user,
                  voting-power: (default-to u0 (unwrap-panic voting-power)),
                  proposals-created: (default-to u0 user-proposals-count),
                  votes-cast: (default-to u0 user-votes-count),
                  reward-balance: (default-to u0 (unwrap-panic reward-balance)),
                  staking-details: enhanced-staking,
                  badge-balance: (default-to u0 (unwrap-panic badge-balance)),
                  ticket-count: (default-to u0 (unwrap-panic ticket-balance)),
                  total-nfts: (+ (default-to u0 (unwrap-panic ticket-balance)) (default-to u0 (unwrap-panic badge-balance))),
                  engagement-profile: user-engagement,
                  events-created: (default-to u0 user-events),
                  listings-active: (default-to u0 user-listings),
                  offers-active: (default-to u0 user-offers),
                  activity-timeline: (get-user-activity user),
                  notifications: (get-user-notifications user),
                  following: (get-user-following user),
                  followers: (get-user-followers user),
                  engagement-score: (calculate-engagement-score user)
                })
              )
            )
          )
        )
      )
    )
  )
)

;; Get user proposals count
(define-read-only (get-user-proposals-count (user principal))
  (ok u0) ;; Simplified - would query governance contract for user's proposals
)

;; Get user votes count
(define-read-only (get-user-votes-count (user principal))
  (ok u0) ;; Simplified - would query governance contract for user's votes
)

;; Get user tickets full details
(define-read-only (get-user-tickets-full (user principal))
  (ok u0) ;; Simplified - would query ticket contract for user's tickets
)

;; Get user listings full details
(define-read-only (get-user-listings-full (user principal))
  (ok u0) ;; Simplified - would query marketplace contract for user's listings
)

;; Get user offers full details
(define-read-only (get-user-offers-full (user principal))
  (ok u0) ;; Simplified - would query marketplace contract for user's offers
)

;; Get user created events
(define-read-only (get-user-created-events (user principal))
  (ok u0) ;; Simplified - would query ticket contract for user's created events
)

;; Function to calculate enhanced engagement score
(define-private (calculate-engagement-score (user principal))
  (let (
    (activity-record (default-to {
      total-events-attended: u0,
      total-proposals-voted: u0,
      total-nfts-owned: u0,
      total-staked-amount: u0,
      last-activity: u0,
      engagement-score: u0
    } (map-get? user-activity user)))
  )
    ;; Calculate based on various activity metrics
    (+ 
      (* (get total-events-attended activity-record) u10)
      (* (get total-proposals-voted activity-record) u5)
      (* (get total-nfts-owned activity-record) u3)
      (/ (get total-staked-amount activity-record) u1000)
    )
  )
)

;; Function to update user activity across contracts
(define-public (update-user-activity 
  (user principal) 
  (activity-type (string-utf8 64)) 
  (activity-value uint)
)
  (begin
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER) 
                  (is-eq tx-sender .governance)
                  (is-eq tx-sender .proof-of-fandom)
                  (is-eq tx-sender .sbtc-payment)
                  (is-eq tx-sender .nft-ticket)
                  (is-eq tx-sender .nft-marketplace)) ERR-UNAUTHORIZED)
    
    (let (
      (current-activity (default-to {
        total-events-attended: u0,
        total-proposals-voted: u0,
        total-nfts-owned: u0,
        total-staked-amount: u0,
        last-activity: u0,
        engagement-score: u0
      } (map-get? user-activity user)))
      (current-time (unwrap-panic (get-block-info? time u0)))
    )
      (map-set user-activity user
        (if (is-eq activity-type "event-attendance")
          { 
            total-events-attended: (+ (get total-events-attended current-activity) activity-value),
            total-proposals-voted: (get total-proposals-voted current-activity),
            total-nfts-owned: (get total-nfts-owned current-activity),
            total-staked-amount: (get total-staked-amount current-activity),
            last-activity: current-time,
            engagement-score: u0 ;; Recalculated separately
          }
          (if (is-eq activity-type "proposal-vote")
            { 
              total-events-attended: (get total-events-attended current-activity),
              total-proposals-voted: (+ (get total-proposals-voted current-activity) activity-value),
              total-nfts-owned: (get total-nfts-owned current-activity),
              total-staked-amount: (get total-staked-amount current-activity),
              last-activity: current-time,
              engagement-score: u0
            }
            (if (is-eq activity-type "nft-acquisition")
              { 
                total-events-attended: (get total-events-attended current-activity),
                total-proposals-voted: (get total-proposals-voted current-activity),
                total-nfts-owned: (+ (get total-nfts-owned current-activity) activity-value),
                total-staked-amount: (get total-staked-amount current-activity),
                last-activity: current-time,
                engagement-score: u0
              }
              (if (is-eq activity-type "stake-update")
                { 
                  total-events-attended: (get total-events-attended current-activity),
                  total-proposals-voted: (get total-proposals-voted current-activity),
                  total-nfts-owned: (get total-nfts-owned current-activity),
                  total-staked-amount: activity-value, ;; Direct assignment for staking
                  last-activity: current-time,
                  engagement-score: u0
                }
                (if (is-eq activity-type "badge-award")
                  {
                    total-events-attended: (get total-events-attended current-activity),
                    total-proposals-voted: (get total-proposals-voted current-activity),
                    total-nfts-owned: (+ (get total-nfts-owned current-activity) activity-value),
                    total-staked-amount: (get total-staked-amount current-activity),
                    last-activity: current-time,
                    engagement-score: u0
                  }
                  ;; Default case - update timestamp only
                  { 
                    total-events-attended: (get total-events-attended current-activity),
                    total-proposals-voted: (get total-proposals-voted current-activity),
                    total-nfts-owned: (get total-nfts-owned current-activity),
                    total-staked-amount: (get total-staked-amount current-activity),
                    last-activity: current-time,
                    engagement-score: u0
                  }
                )
              )
            )
          )
        )
      )
      
      ;; Update engagement score
      (map-set user-activity user
        (merge (map-get? user-activity user)
          { engagement-score: (calculate-engagement-score user) }
        )
      )
      
      ;; Update proof-of-fandom stats if available
      (try! (contract-call? .proof-of-fandom update-engagement-stats user activity-value activity-type))
      
      (ok true)
    )
  )
)

;; Cross-contract voting power calculation
(define-read-only (get-combined-voting-power (user principal))
  (let (
    (governance-power (contract-call? .governance get-user-voting-power user))
    (staking-power (get-voting-power-from-staking user))
    (badge-power (get-voting-power-from-badges user))
  )
    (ok (+ 
      (default-to u0 (unwrap-panic governance-power))
      (default-to u0 staking-power)
      (default-to u0 badge-power)
    ))
  )
)

;; Get voting power from staking
(define-private (get-voting-power-from-staking (user principal))
  (let (
    (staking-info (contract-call? .sbtc-payment get-enhanced-staking-position user))
  )
    (if (is-ok staking-info)
      (let (
        (position (unwrap-panic staking-info))
      )
        (if (is-none position)
          u0
          (/ (get amount (unwrap-panic position)) u1000000)  ;; 1 voting power per 1 STX staked
        )
      )
      u0
    )
  )
)

;; Get voting power from badges
(define-private (get-voting-power-from-badges (user principal))
  (let (
    (badge-balance (contract-call? .proof-of-fandom get-overall-balance user))
  )
    (if (is-ok badge-balance)
      (* (unwrap-panic badge-balance) u5)  ;; 5 voting power per badge
      u0
    )
  )
)

;; Event-based notification system
(define-public (trigger-event-notification 
  (event-type (string-utf8 64)) 
  (user principal) 
  (details (string-utf8 512))
)
  (begin
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER) 
                  (is-eq tx-sender .governance)
                  (is-eq tx-sender .proof-of-fandom)
                  (is-eq tx-sender .sbtc-payment)
                  (is-eq tx-sender .nft-ticket)
                  (is-eq tx-sender .nft-marketplace)) ERR-UNAUTHORIZED)
    
    (let (
      (notification-id (+ (default-to u0 (map-get? notification-counter user)) u1))
      (current-time (unwrap-panic (get-block-info? time u0)))
    )
      (map-set user-notifications user {
        notification-id: notification-id,
        message: (concat (concat event-type ": ") details),
        timestamp: current-time,
        is-read: false,
        notification-type: event-type
      })
      
      (map-set notification-counter user notification-id)
      (ok notification-id)
    )
  )
)

;; Update cross-contract analytics
(define-public (update-cross-contract-analytics 
  (user principal)
  (metric-type (string-utf8 64))
  (value uint)
)
  (begin
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER) 
                  (is-eq tx-sender .governance)
                  (is-eq tx-sender .proof-of-fandom)
                  (is-eq tx-sender .sbtc-payment)
                  (is-eq tx-sender .nft-ticket)
                  (is-eq tx-sender .nft-marketplace)) ERR-UNAUTHORIZED)
    
    ;; Update user activity as before
    (try! (update-user-activity user metric-type value))
    
    ;; Send notification about the activity
    (try! (trigger-event-notification metric-type user (concat "New " metric-type " activity recorded")))
    
    (ok true)
  )
)

;; Function to create enhanced proposal with comments
(define-public (create-enhanced-proposal
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type (string-utf8 64))
  (amount (optional uint))
  (recipient (optional principal))
  (metadata-uri (optional (string-ascii 256)))
)
  (begin
    ;; Call the original governance contract to create the proposal
    (let ((proposal-id (unwrap! (contract-call? .governance create-proposal title description proposal-type amount recipient) ERR-INVALID-CONTRACT)))
      ;; Add proposal to our comment tracking
      (ok proposal-id)
    )
  )
)

;; Function to add comment to proposal
(define-public (add-proposal-comment
  (proposal-id uint)
  (content (string-utf8 1024))
  (parent-comment (optional uint))
)
  (let (
    (comment-id (+ (var-get total-comments) u1))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    (map-set proposal-comments comment-id {
      comment-id: comment-id,
      proposal-id: proposal-id,
      author: tx-sender,
      content: content,
      timestamp: current-time,
      parent-comment: parent-comment
    })
    
    (var-set total-comments comment-id)
    (ok comment-id)
  )
)

;; Function to get proposal comments
(define-read-only (get-proposal-comments (proposal-id uint))
  (ok true) ;; Simplified - would return list of comments
)

;; Function to follow other users
(define-public (follow-user (user-to-follow principal))
  (begin
    (map-set user-following { 
      follower: tx-sender, 
      followee: user-to-follow 
    } true)
    (ok true)
  )
)

;; Function to unfollow user
(define-public (unfollow-user (user-to-unfollow principal))
  (begin
    (map-delete user-following { 
      follower: tx-sender, 
      followee: user-to-unfollow 
    })
    (ok true)
  )
)

;; Function to send notification to user
(define-public (send-notification
  (recipient principal)
  (message (string-utf8 512))
  (notification-type (string-utf8 64))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (let (
      (notification-id (+ (default-to u0 (map-get? notification-counter recipient)) u1))
      (current-time (unwrap-panic (get-block-info? time u0)))
    )
      (map-set user-notifications recipient {
        notification-id: notification-id,
        message: message,
        timestamp: current-time,
        is-read: false,
        notification-type: notification-type
      })
      
      (map-set notification-counter recipient notification-id)
      (ok notification-id)
    )
  )
)

;; Function to mark notification as read
(define-public (mark-notification-read (notification-id uint))
  (let (
    (notification (unwrap! (map-get? user-notifications tx-sender) ERR-INVALID-CONTRACT))
  )
    (if (is-eq (get notification-id notification) notification-id)
      (begin
        (map-set user-notifications tx-sender
          (merge notification { is-read: true })
        )
        (ok true)
      )
      (err u103) ;; Notification ID mismatch
    )
  )
)

;; Function to get user notifications
(define-read-only (get-user-notifications (user principal))
  (ok true) ;; Simplified - would return list of notifications
)

;; Function to add treasury operation (for enhanced treasury management)
(define-public (add-treasury-operation
  (operation-type (string-utf8 64))
  (amount uint)
  (proposal-id uint)
  (recipient principal)
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (let (
      (operation-id (+ (var-get total-treasury-operations) u1))
      (current-time (unwrap-panic (get-block-info? time u0)))
    )
      (map-set treasury-operations operation-id {
        operation-id: operation-id,
        operation-type: operation-type,
        amount: amount,
        proposal-id: proposal-id,
        recipient: recipient,
        timestamp: current-time,
        executed: false
      })
      
      (var-set total-treasury-operations operation-id)
      (ok operation-id)
    )
  )
)

;; Function to mark treasury operation as executed
(define-public (execute-treasury-operation (operation-id uint))
  (let (
    (operation (unwrap! (map-get? treasury-operations operation-id) ERR-INVALID-CONTRACT))
  )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set treasury-operations operation-id
      (merge operation { executed: true })
    )
    
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-user-activity (user principal))
  (map-get? user-activity user)
)

(define-read-only (get-user-followers (user principal))
  (ok true) ;; Simplified - would return list of followers
)

(define-read-only (get-user-following (user principal))
  (ok true) ;; Simplified - would return list of followed users
)

(define-read-only (get-total-users)
  (var-get total-users)
)

(define-read-only (get-total-treasury-operations)
  (var-get total-treasury-operations)
)

;; Get comprehensive user analytics across all contracts
(define-read-only (get-comprehensive-user-analytics (user principal))
  (ok {
    dashboard: (get-enhanced-user-dashboard user),
    voting-power: (get-combined-voting-power user),
    activity: (get-user-activity user),
    notifications: (get-user-notifications user)
  })
)

;; Initialize default values
(define-private (initialize)
  (begin
    ;; Initialize default proposal templates in governance contract
    (try! (contract-call? .governance create-proposal-template
      "Treasury Allocation"
      "Propose allocation of treasury funds to a specific purpose"
      "treasury"
      (some u100000000)  ;; 100 sBTC
      none
    ))
    
    (try! (contract-call? .governance create-proposal-template
      "Parameter Update"
      "Propose changes to platform parameters"
      "parameter"
      none
      none
    ))
    
    (try! (contract-call? .governance create-proposal-template
      "Community Event"
      "Propose funding for a community event"
      "community"
      (some u50000000)  ; 50 sBTC
      none
    ))
    
    ;; Initialize staking pools in sbtc-payment contract
    (try! (contract-call? .sbtc-payment create-staking-pool
      u50   ; 5% base rate
      u1000000  ; 1 STX minimum
      u1000000000  ; 1000 STX maximum
      u2016  ; 2 week lockup
      u500  ; 5% early unstake penalty
      u1200  ; 1.2x boost multiplier
    ))
    
    (ok true)
  )
)

(begin (initialize))