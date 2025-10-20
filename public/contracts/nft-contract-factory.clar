;; NFT Contract Factory for INTIC Pulse Robot Platform
;; Allows event organizers to deploy custom NFT ticket contracts

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant DEPLOYMENT-FEE u5000000) ;; 0.05 STX deployment fee
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-INSUFFICIENT-FEE (err u101))
(define-constant ERR-INVALID-TEMPLATE (err u102))
(define-constant ERR-DEPLOYMENT-FAILED (err u103))

;; Contract templates
(define-constant TEMPLATE-BASIC "basic")
(define-constant TEMPLATE-PREMIUM "premium")
(define-constant TEMPLATE-FESTIVAL "festival")

;; Data Maps
(define-map deployed-contracts principal {
  contract-address: (string-utf8 256),
  template: (string-utf8 64),
  deployment-time: uint,
  event-count: uint
})

(define-map contract-registry (string-utf8 256) {
  owner: principal,
  template: (string-utf8 64),
  is-active: bool,
  deployment-fee: uint
})

;; Data Variables
(define-data-var total-deployments uint u0)

;; Deploy basic event contract
(define-public (deploy-basic-contract
  (event-name (string-utf8 256))
  (event-description (string-utf8 1024))
  (ticket-price uint)
  (total-supply uint)
)
  (let ((contract-address (generate-contract-address tx-sender (var-get total-deployments))))
    ;; Charge deployment fee
    (try! (stx-transfer? DEPLOYMENT-FEE tx-sender CONTRACT-OWNER))

    ;; Deploy contract (simplified - would generate actual contract code)
    (try! (deploy-contract-template contract-address TEMPLATE-BASIC))

    ;; Register deployment
    (map-set deployed-contracts tx-sender {
      contract-address: contract-address,
      template: TEMPLATE-BASIC,
      deployment-time: (unwrap-panic (get-block-info? time u0)),
      event-count: u1
    })

    (map-set contract-registry contract-address {
      owner: tx-sender,
      template: TEMPLATE-BASIC,
      is-active: true,
      deployment-fee: DEPLOYMENT-FEE
    })

    (var-set total-deployments (+ (var-get total-deployments) u1))

    (ok contract-address)
  )
)

;; Deploy premium event contract
(define-public (deploy-premium-contract
  (event-name (string-utf8 256))
  (event-description (string-utf8 1024))
  (ticket-price uint)
  (total-supply uint)
  (royalty-percentage uint)
  (early-access-enabled bool)
)
  (let (
    (contract-address (generate-contract-address tx-sender (var-get total-deployments)))
    (premium-fee (* DEPLOYMENT-FEE u4)) ;; 4x fee for premium
  )
    ;; Charge premium deployment fee
    (try! (stx-transfer? premium-fee tx-sender CONTRACT-OWNER))

    ;; Deploy contract
    (try! (deploy-contract-template contract-address TEMPLATE-PREMIUM))

    ;; Register deployment
    (map-set deployed-contracts tx-sender {
      contract-address: contract-address,
      template: TEMPLATE-PREMIUM,
      deployment-time: (unwrap-panic (get-block-info? time u0)),
      event-count: u1
    })

    (map-set contract-registry contract-address {
      owner: tx-sender,
      template: TEMPLATE-PREMIUM,
      is-active: true,
      deployment-fee: premium-fee
    })

    (var-set total-deployments (+ (var-get total-deployments) u1))

    (ok contract-address)
  )
)

;; Deploy festival event contract
(define-public (deploy-festival-contract
  (event-name (string-utf8 256))
  (event-description (string-utf8 1024))
  (ticket-price uint)
  (total-supply uint)
  (royalty-percentage uint)
  (multi-day-access uint)
)
  (let (
    (contract-address (generate-contract-address tx-sender (var-get total-deployments)))
    (festival-fee (* DEPLOYMENT-FEE u10)) ;; 10x fee for festival
  )
    ;; Charge festival deployment fee
    (try! (stx-transfer? festival-fee tx-sender CONTRACT-OWNER))

    ;; Deploy contract
    (try! (deploy-contract-template contract-address TEMPLATE-FESTIVAL))

    ;; Register deployment
    (map-set deployed-contracts tx-sender {
      contract-address: contract-address,
      template: TEMPLATE-FESTIVAL,
      deployment-time: (unwrap-panic (get-block-info? time u0)),
      event-count: u1
    })

    (map-set contract-registry contract-address {
      owner: tx-sender,
      template: TEMPLATE-FESTIVAL,
      is-active: true,
      deployment-fee: festival-fee
    })

    (var-set total-deployments (+ (var-get total-deployments) u1))

    (ok contract-address)
  )
)

;; Internal function to deploy contract template
(define-private (deploy-contract-template (contract-address (string-utf8 256)) (template (string-utf8 64)))
  (begin
    ;; In a real implementation, this would generate and deploy the actual contract code
    ;; For now, just validate the template
    (asserts! (or
      (is-eq template TEMPLATE-BASIC)
      (is-eq template TEMPLATE-PREMIUM)
      (is-eq template TEMPLATE-FESTIVAL)
    ) ERR-INVALID-TEMPLATE)

    (ok true)
  )
)

;; Generate unique contract address
(define-private (generate-contract-address (owner principal) (nonce uint))
  (concat
    "SP"
    (concat
      (principal-to-string owner)
      (concat "." (concat "event-contract-" (uint-to-string nonce)))
    )
  )
)

;; Update contract status (admin only)
(define-public (update-contract-status (contract-address (string-utf8 256)) (is-active bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (let ((contract-info (unwrap! (map-get? contract-registry contract-address) ERR-INVALID-TEMPLATE)))
      (map-set contract-registry contract-address
        (merge contract-info { is-active: is-active })
      )
      (ok true)
    )
  )
)

;; Get deployment info
(define-read-only (get-deployment-info (owner principal))
  (map-get? deployed-contracts owner)
)

;; Get contract info
(define-read-only (get-contract-info (contract-address (string-utf8 256)))
  (map-get? contract-registry contract-address)
)

;; Get total deployments
(define-read-only (get-total-deployments)
  (var-get total-deployments)
)

;; Get deployment fee for template
(define-read-only (get-deployment-fee (template (string-utf8 64)))
  (if (is-eq template TEMPLATE-BASIC)
    (ok DEPLOYMENT-FEE)
    (if (is-eq template TEMPLATE-PREMIUM)
      (ok (* DEPLOYMENT-FEE u4))
      (if (is-eq template TEMPLATE-FESTIVAL)
        (ok (* DEPLOYMENT-FEE u10))
        ERR-INVALID-TEMPLATE
      )
    )
  )
)

;; Check if contract is owned by user
(define-read-only (is-contract-owner (contract-address (string-utf8 256)) (user principal))
  (let ((contract-info (map-get? contract-registry contract-address)))
    (if (is-some contract-info)
      (is-eq (get owner (unwrap-panic contract-info)) user)
      false
    )
  )
)</content>
<parameter name="filePath">D:\BAHAN PROJECT\pulse-robot-template-87267\contracts\intic-smart-contracts\nft-contract-factory.clar