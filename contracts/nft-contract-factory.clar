;; NFT Contract Factory for Pulse Robot Platform
;; Allows users to deploy their own individual NFT ticket contracts
;; Each event gets its own smart contract with customizable parameters

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u200))
(define-constant ERR-UNAUTHORIZED (err u201))
(define-constant ERR-INVALID-PARAMS (err u202))
(define-constant ERR-CONTRACT-EXISTS (err u203))
(define-constant ERR-INSUFFICIENT-FEE (err u204))

;; Contract deployment fee (in sBTC)
(define-data-var deployment-fee uint u1000000) ;; 0.01 sBTC
(define-data-var platform-address principal CONTRACT-OWNER)

;; Track deployed contracts
(define-data-var total-deployed-contracts uint u0)

;; Registry of deployed contracts
(define-map deployed-contracts principal {
  contract-id: uint,
  deployer: principal,
  contract-address: principal,
  event-name: (string-utf8 256),
  deploy-block: uint,
  deploy-timestamp: uint,
  total-supply: uint,
  ticket-price: uint,
  is-active: bool,
  category: (string-utf8 64),
  metadata-uri: (string-utf8 256)
})

;; Deployer tracking
(define-map deployer-contracts principal (list 50 principal))
(define-map deployer-stats principal {
  total-deployed: uint,
  total-revenue: uint,
  first-deployment: uint,
  last-deployment: uint
})

;; Contract templates
(define-map contract-templates (string-utf8 64) {
  template-name: (string-utf8 64),
  template-code: (string-utf8 8192), ;; Simplified - in production, store IPFS hash
  base-fee: uint,
  features: (string-utf8 512),
  is-active: bool
})

;; Deployment queue for batch processing
(define-map deployment-queue uint {
  queue-id: uint,
  deployer: principal,
  template: (string-utf8 64),
  parameters: (string-utf8 1024),
  fee-paid: uint,
  status: (string-utf8 32), ;; "pending", "processing", "completed", "failed"
  created-at: uint,
  processed-at: (optional uint)
})

(define-data-var deployment-queue-counter uint u0)

;; Contract Factory Functions

;; Submit deployment request
(define-public (request-contract-deployment
  (template-name (string-utf8 64))
  (event-name (string-utf8 256))
  (event-description (string-utf8 1024))
  (event-date uint)
  (event-time uint)
  (venue (string-utf8 256))
  (image-uri (string-utf8 256))
  (metadata-uri (string-utf8 256))
  (total-supply uint)
  (ticket-price uint)
  (category (string-utf8 64)))
  (let ((queue-id (+ (var-get deployment-queue-counter) u1))
        (template (unwrap! (map-get? contract-templates template-name) (err ERR-INVALID-PARAMS)))
        (deployment-cost (+ (var-get deployment-fee) (get base-fee template))))

    ;; Validate parameters
    (asserts! (> total-supply u0) (err ERR-INVALID-PARAMS))
    (asserts! (> ticket-price u0) (err ERR-INVALID-PARAMS))
    (asserts! (get is-active template) (err ERR-INVALID-PARAMS))

    ;; Create deployment parameters string
    (let ((parameters (concat-params event-name event-description event-date event-time
                                    venue image-uri metadata-uri total-supply
                                    ticket-price category)))

      ;; Add to deployment queue
      (map-set deployment-queue queue-id {
        queue-id: queue-id,
        deployer: tx-sender,
        template: template-name,
        parameters: parameters,
        fee-paid: deployment-cost,
        status: "pending",
        created-at: block-height,
        processed-at: none
      })

      ;; Update counter
      (var-set deployment-queue-counter queue-id)

      ;; In production: integrate with payment processing here
      ;; For now, simulate payment success

      (ok queue-id))))

;; Process deployment (called by platform)
(define-public (process-deployment (queue-id uint))
  (let ((deployment (unwrap! (map-get? deployment-queue queue-id) (err ERR-INVALID-PARAMS))))

    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (asserts! (is-eq (get status deployment) "pending") (err ERR-INVALID-PARAMS))

    ;; Update status to processing
    (map-set deployment-queue queue-id
      (merge deployment { status: "processing" }))

    ;; In production: This would trigger actual contract deployment
    ;; For now, simulate successful deployment
    (let ((mock-contract-address (principal-of? (get deployer deployment))))

      (match mock-contract-address
        contract-addr (begin
          ;; Register deployed contract
          (try! (register-deployed-contract
            (get deployer deployment)
            contract-addr
            (get parameters deployment)
            (get fee-paid deployment)))

          ;; Update deployment status
          (map-set deployment-queue queue-id
            (merge deployment {
              status: "completed",
              processed-at: (some block-height)
            }))

          (ok contract-addr))
        (err ERR-INVALID-PARAMS)))))

;; Register successfully deployed contract
(define-private (register-deployed-contract
  (deployer principal)
  (contract-address principal)
  (parameters (string-utf8 1024))
  (fee-paid uint))
  (let ((contract-id (+ (var-get total-deployed-contracts) u1))
        (current-deployer-contracts (default-to (list) (map-get? deployer-contracts deployer)))
        (deployer-stats-data (default-to
          {total-deployed: u0, total-revenue: u0, first-deployment: u0, last-deployment: u0}
          (map-get? deployer-stats deployer))))

    ;; Parse parameters (simplified)
    (let ((event-name (extract-event-name parameters))
          (total-supply (extract-total-supply parameters))
          (ticket-price (extract-ticket-price parameters))
          (category (extract-category parameters)))

      ;; Register contract
      (map-set deployed-contracts contract-address {
        contract-id: contract-id,
        deployer: deployer,
        contract-address: contract-address,
        event-name: event-name,
        deploy-block: block-height,
        deploy-timestamp: (unwrap-panic (get-block-info? time (- block-height u1))),
        total-supply: total-supply,
        ticket-price: ticket-price,
        is-active: true,
        category: category,
        metadata-uri: "https://pulse-robot.com/metadata/"
      })

      ;; Update deployer tracking
      (map-set deployer-contracts deployer
        (unwrap! (as-max-len? (append current-deployer-contracts contract-address) u50) (err ERR-INVALID-PARAMS)))

      ;; Update deployer stats
      (map-set deployer-stats deployer {
        total-deployed: (+ (get total-deployed deployer-stats-data) u1),
        total-revenue: (+ (get total-revenue deployer-stats-data) fee-paid),
        first-deployment: (if (is-eq (get total-deployed deployer-stats-data) u0)
                             block-height
                             (get first-deployment deployer-stats-data)),
        last-deployment: block-height
      })

      ;; Update global counter
      (var-set total-deployed-contracts contract-id)

      (ok true))))

;; Template Management

(define-public (add-contract-template
  (template-name (string-utf8 64))
  (template-code (string-utf8 8192))
  (base-fee uint)
  (features (string-utf8 512)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (map-set contract-templates template-name {
      template-name: template-name,
      template-code: template-code,
      base-fee: base-fee,
      features: features,
      is-active: true
    })

    (ok true)))

(define-public (update-template-status (template-name (string-utf8 64)) (is-active bool))
  (let ((template (unwrap! (map-get? contract-templates template-name) (err ERR-INVALID-PARAMS))))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (map-set contract-templates template-name
      (merge template { is-active: is-active }))

    (ok true)))

;; Contract Management

(define-public (update-contract-status (contract-address principal) (is-active bool))
  (let ((contract-info (unwrap! (map-get? deployed-contracts contract-address) (err ERR-INVALID-PARAMS))))
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER)
                  (is-eq tx-sender (get deployer contract-info))) (err ERR-UNAUTHORIZED))

    (map-set deployed-contracts contract-address
      (merge contract-info { is-active: is-active }))

    (ok true)))

;; Batch deployment for events
(define-public (batch-deploy-contracts (deployment-requests (list 10 uint)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))

    (ok (map process-deployment deployment-requests))))

;; Helper Functions

(define-private (concat-params
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (date uint)
  (time uint)
  (venue (string-utf8 256))
  (image-uri (string-utf8 256))
  (metadata-uri (string-utf8 256))
  (supply uint)
  (price uint)
  (category (string-utf8 64)))
  ;; In production, use proper JSON encoding
  (concat name "|" description "|" venue "|" image-uri "|" metadata-uri "|" category))

;; Simplified parameter extraction functions
(define-private (extract-event-name (params (string-utf8 1024)))
  "Extracted Event Name") ;; Simplified

(define-private (extract-total-supply (params (string-utf8 1024)))
  u1000) ;; Simplified

(define-private (extract-ticket-price (params (string-utf8 1024)))
  u5000000) ;; Simplified

(define-private (extract-category (params (string-utf8 1024)))
  "concert") ;; Simplified

;; Read-only Functions

(define-read-only (get-deployed-contract (contract-address principal))
  (map-get? deployed-contracts contract-address))

(define-read-only (get-deployer-contracts (deployer principal))
  (map-get? deployer-contracts deployer))

(define-read-only (get-deployer-stats (deployer principal))
  (map-get? deployer-stats deployer))

(define-read-only (get-contract-template (template-name (string-utf8 64)))
  (map-get? contract-templates template-name))

(define-read-only (get-deployment-queue-item (queue-id uint))
  (map-get? deployment-queue queue-id))

(define-read-only (get-platform-stats)
  {
    total-contracts: (var-get total-deployed-contracts),
    deployment-fee: (var-get deployment-fee),
    queue-length: (var-get deployment-queue-counter)
  })

(define-read-only (get-active-templates)
  ;; In production, iterate through all templates
  (list "basic-event" "premium-event" "festival-event"))

;; Fee Management

(define-public (set-deployment-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    (var-set deployment-fee new-fee)
    (ok true)))

(define-public (withdraw-fees (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-OWNER-ONLY))
    ;; In production: integrate with treasury/payment system
    (ok true)))

;; Analytics and Reporting

(define-read-only (get-deployment-analytics (start-block uint) (end-block uint))
  {
    deployments-in-period: u10, ;; Calculate from actual data
    total-revenue: u50000000,   ;; Calculate from actual data
    avg-supply: u1500,          ;; Calculate from actual data
    avg-price: u7500000,        ;; Calculate from actual data
    top-category: "music"       ;; Calculate from actual data
  })

(define-read-only (get-contract-performance (contract-address principal))
  ;; In production: integrate with actual contract data
  {
    total-sold: u750,
    revenue: u37500000,
    secondary-sales: u120,
    avg-resale-price: u6000000
  })

;; Search and Discovery

(define-read-only (search-contracts-by-category (category (string-utf8 64)))
  ;; In production: filter contracts by category
  (list))

(define-read-only (get-trending-contracts (limit uint))
  ;; In production: return top performing contracts
  (list))

;; Initialize default templates
(define-private (initialize-default-templates)
  (begin
    ;; Basic Event Template
    (map-set contract-templates "basic-event" {
      template-name: "basic-event",
      template-code: "basic-nft-ticket-contract-code", ;; Simplified
      base-fee: u500000, ;; 0.005 sBTC
      features: "Basic NFT tickets, QR codes, simple validation",
      is-active: true
    })

    ;; Premium Event Template
    (map-set contract-templates "premium-event" {
      template-name: "premium-event",
      template-code: "premium-nft-ticket-contract-code", ;; Simplified
      base-fee: u2000000, ;; 0.02 sBTC
      features: "Advanced features, tiers, early access, royalties",
      is-active: true
    })

    ;; Festival Template
    (map-set contract-templates "festival-event" {
      template-name: "festival-event",
      template-code: "festival-nft-ticket-contract-code", ;; Simplified
      base-fee: u5000000, ;; 0.05 sBTC
      features: "Multi-day events, wristband NFTs, exclusive areas",
      is-active: true
    })))

;; Initialize on contract deployment
(initialize-default-templates)