;; SIP-013 Semi-Fungible Token Trait Definition
;; Standard trait for Semi-Fungible Tokens on Stacks

(define-trait semi-fungible-token-trait
  (
    ;; Transfer from the sender to a new principal
    (transfer (uint uint principal principal) (response bool uint))

    ;; the balance of the passed principal for the given token
    (get-balance (uint principal) (response uint uint))

    ;; the current total supply of the given token (which does not need to be a constant)
    (get-overall-supply (uint) (response uint uint))

    ;; the current number of unique tokens
    (get-total-supply () (response uint uint))

    ;; the number of decimals used
    (get-decimals (uint) (response uint uint))

    ;; an optional URI that represents metadata for the token type
    (get-token-uri (uint) (response (optional (string-utf8 256)) uint))
  )
)