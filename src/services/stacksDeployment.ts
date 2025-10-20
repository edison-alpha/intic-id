import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  makeRandomPrivKey,
  getAddressFromPrivateKey,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import type { StacksNetwork } from '@stacks/network';

export interface ContractData {
  eventName: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  description?: string;
  category: string;
  royaltyPercentage: string;
  ticketCategories: Array<{
    id: string;
    name: string;
    price: string;
    supply: string;
    description: string;
  }>;
  totalSupply: number;
  totalRevenue: number;
  deployer: string;
  totalCost: number;
  metadataUri?: string;
  template: string;
}

export class StacksDeploymentService {
  private network: StacksNetwork;
  private isTestnet: boolean;

  constructor(isTestnet: boolean = true) {
    // Force testnet for now
    this.isTestnet = true;
    
    // Use official network objects from @stacks/network
    this.network = new StacksTestnet();
    
    console.log('🌐 Stacks Network configured:', {
      network: 'TESTNET (forced)',
      chainId: '0x' + this.network.chainId.toString(16),
      transactionVersion: '0x' + this.network.transactionVersion.toString(16),
    });
  }

  /**
   * Generate Clarity contract code for NFT ticketing (SIP-009 Compliant)
   * Uses a simplified, tested contract template
   */
  generateContractCode(contractData: ContractData): string {
    const { eventName, eventDate, ticketCategories, totalSupply, royaltyPercentage } = contractData;

    // Sanitize strings for Clarity - escape quotes and limit length
    const sanitizeString = (str: string, maxLength: number = 100) => {
      if (!str) return '';
      // Escape quotes and limit length
      return str.replace(/"/g, '\\"').substring(0, maxLength);
    };

    const safeEventName = sanitizeString(eventName || 'Event', 50);

    // Use first category for main pricing, or default
    const mainCategory = ticketCategories[0];
    const ticketPriceInMicroSTX = Math.floor((parseFloat(mainCategory?.price || '0.001')) * 1000000);
    const royaltyPercent = Math.floor((parseFloat(royaltyPercentage) || 5)); // 0-100 percentage

    // Use a simplified, tested contract template
    return `;; NFT Ticket Event Contract - SIP-009 Compliant
;; Simplified contract for individual event deployment via Turnkey
;; Each event gets its own contract deployment

(impl-trait .sip-009-nft-trait.nft-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-TICKET-USED (err u103))
(define-constant ERR-SOLD-OUT (err u104))
(define-constant ERR-INVALID-PRICE (err u105))
(define-constant ERR-EVENT-ENDED (err u106))
(define-constant ERR-UNAUTHORIZED (err u107))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var event-name (string-utf8 256) u"${safeEventName}")
(define-data-var event-description (string-utf8 1024) u"Event organized via Pulse Robot Platform")
(define-data-var event-venue (string-utf8 256) u"TBA")
(define-data-var event-date uint u${Date.now()})
(define-data-var event-time (string-utf8 32) u"TBA")
(define-data-var event-category (string-utf8 64) u"general")
(define-data-var ticket-price uint u${ticketPriceInMicroSTX})
(define-data-var total-supply uint u${totalSupply})
(define-data-var available-tickets uint u${totalSupply})
(define-data-var royalty-percentage uint u${royaltyPercent})
(define-data-var metadata-base-uri (string-ascii 256) "ipfs://placeholder/")

;; NFT Definition
(define-non-fungible-token event-ticket uint)

;; Ticket Data
(define-map tickets uint {
  owner: principal,
  tier: (string-utf8 32),
  purchase-price: uint,
  purchase-date: uint,
  is-used: bool,
  seat-number: (optional (string-utf8 32))
})

;; Marketplace
(define-map listings uint {
  price: uint,
  seller: principal
})

;; SIP-009 Trait Implementation
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get metadata-base-uri))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? event-ticket token-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
    (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
      (asserts! (not (get is-used ticket)) ERR-TICKET-USED)
      (try! (nft-transfer? event-ticket token-id sender recipient))
      (map-set tickets token-id (merge ticket { owner: recipient }))
      (ok true))))

;; Mint ticket
(define-public (mint-ticket)
  (let (
    (token-id (+ (var-get last-token-id) u1))
    (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
  )
    ;; Check if tickets still available
    (asserts! (> (var-get available-tickets) u0) ERR-SOLD-OUT)

    ;; Transfer payment
    (try! (stx-transfer? (var-get ticket-price) tx-sender CONTRACT-OWNER))

    ;; Mint NFT
    (try! (nft-mint? event-ticket token-id tx-sender))

    ;; Store ticket data
    (map-set tickets token-id {
      owner: tx-sender,
      tier: u"General",
      purchase-price: (var-get ticket-price),
      purchase-date: current-time,
      is-used: false,
      seat-number: none
    })

    ;; Update counters
    (var-set last-token-id token-id)
    (var-set available-tickets (- (var-get available-tickets) u1))

    (ok token-id)))

;; Use ticket (mark as used)
(define-public (use-ticket (token-id uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? event-ticket token-id)) ERR-NOT-TOKEN-OWNER)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)
    (map-set tickets token-id (merge ticket { is-used: true }))
    (ok true)))

;; List ticket for sale
(define-public (list-ticket (token-id uint) (price uint))
  (let ((ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (some tx-sender) (nft-get-owner? event-ticket token-id)) ERR-NOT-TOKEN-OWNER)
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)
    (map-set listings token-id { price: price, seller: tx-sender })
    (ok true)))

;; Buy listed ticket
(define-public (buy-ticket (token-id uint))
  (let (
    (listing (unwrap! (map-get? listings token-id) ERR-NOT-FOUND))
    (ticket (unwrap! (map-get? tickets token-id) ERR-NOT-FOUND))
    (seller (get seller listing))
    (price (get price listing))
  )
    (asserts! (not (get is-used ticket)) ERR-TICKET-USED)

    ;; Pay seller
    (try! (stx-transfer? price tx-sender seller))

    ;; Transfer NFT
    (try! (transfer token-id seller tx-sender))

    ;; Remove listing
    (map-delete listings token-id)

    (ok true)))

;; Admin functions
(define-public (set-ticket-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set ticket-price new-price)
    (ok true)))

;; Read-only functions
(define-read-only (get-ticket-info (token-id uint))
  (ok (map-get? tickets token-id)))

(define-read-only (get-listing (token-id uint))
  (ok (map-get? listings token-id)))

(define-read-only (get-event-info)
  (ok {
    name: (var-get event-name),
    description: (var-get event-description),
    venue: (var-get event-venue),
    date: (var-get event-date),
    ticket-price: (var-get ticket-price),
    total-supply: (var-get total-supply),
    available: (var-get available-tickets),
    sold: (var-get last-token-id)
  }))`;
  }

  /**
   * Deploy contract to Stacks network - REAL DEPLOYMENT
   * Broadcasts transaction to Stacks Testnet/Mainnet
   */
  async deployContract(contractData: ContractData, privateKey: string): Promise<{
    txId: string;
    contractName: string;
    contractAddress: string;
    transaction: any;
    network: string;
    explorerUrl: string;
    apiStatusUrl: string;
  }> {
    try {
      if (!privateKey) {
        throw new Error('Private key is required for deployment');
      }

      // Generate contract code
      const contractCode = this.generateContractCode(contractData);

      // Generate unique contract name (shorter to avoid length limits)
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 6);
      const contractName = `pulse-${timestamp}-${random}`;

      // Get sender address
      const senderAddress = getAddressFromPrivateKey(privateKey, this.network);

      // Create contract deploy transaction using network string
      // v7.x accepts 'testnet' | 'mainnet' | 'devnet' | 'mocknet' as string
      const txOptions = {
        contractName,
        codeBody: contractCode,
        senderKey: privateKey,
        network: 'testnet' as const,  // Use const assertion for literal type
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 200000, // 0.2 STX fee for contract deployment
      };
      const transaction = await makeContractDeploy(txOptions);
      
      console.log('✅ Transaction created:', {
        txType: transaction.payload?.payloadType,
        auth: transaction.auth?.authType,
        fee: transaction.auth?.spendingCondition?.fee?.toString(),
      });
      console.log('Network details:', {
        isTestnet: this.isTestnet,
        chainId: this.network.chainId,
        coreApiUrl: (this.network as any).coreApiUrl,
        broadcastEndpoint: (this.network as any).getBroadcastApiUrl?.() || 'unknown'
      });

      // Use the official broadcastTransaction function from @stacks/transactions
      // In v7.x, broadcastTransaction expects an object with transaction and network
      let broadcastResponse;
      try {
        broadcastResponse = await broadcastTransaction({
          transaction,
          network: 'testnet' as const  // Use string literal for network
        });
        
      } catch (broadcastError: any) {
        console.error('❌ Broadcast failed:', {
          error: broadcastError.message,
          details: broadcastError,
          stack: broadcastError.stack
        });
        throw new Error(`Failed to broadcast transaction: ${broadcastError.message}`);
      }

      // Validate we got a txid back
      if (!broadcastResponse || !broadcastResponse.txid) {
        console.error('❌ Invalid broadcast response:', broadcastResponse);
        throw new Error('Broadcast did not return a transaction ID');
      }
      
      const txId = broadcastResponse.txid;
      const contractAddress = `${senderAddress}.${contractName}`;

      // Get the correct explorer URL and API URL for status checking
      const networkName = this.isTestnet ? 'testnet' : 'mainnet';
      const apiBaseUrl = this.isTestnet ? 'https://api.testnet.hiro.so' : 'https://api.hiro.so';
      const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=${networkName}`;
      
      // Immediately verify transaction was received by checking API
      try {
        const verifyResponse = await fetch(`${apiBaseUrl}/extended/v1/tx/${txId}`);
        if (verifyResponse.ok) {
          const txData = await verifyResponse.json();
        } else if (verifyResponse.status === 404) {
          console.warn('⚠️  Transaction not found immediately (this may be normal for first few seconds)');
        } else {
          console.warn('⚠️  Could not verify transaction:', verifyResponse.status);
        }
      } catch (verifyError) {
        console.warn('⚠️  Verification check failed:', verifyError);
      }

      // Log instructions for user

      return {
        txId,
        contractName,
        contractAddress,
        transaction,
        network: networkName,
        explorerUrl,
        apiStatusUrl: `${apiBaseUrl}/extended/v1/tx/${txId}`
      };

    } catch (error: any) {
      console.error('❌ Contract deployment error:', error);
      
      // Provide more detailed error messages
      if (error.message?.includes('NotEnoughFunds')) {
        throw new Error('Insufficient STX balance for deployment. You need at least 0.2 STX.');
      } else if (error.message?.includes('ConflictingNonceInMempool')) {
        throw new Error('Previous transaction still pending. Please wait a moment and try again.');
      } else if (error.message?.includes('BadNonce')) {
        throw new Error('Transaction nonce error. Please refresh and try again.');
      }
      
      throw new Error(`Failed to deploy contract: ${error.message}`);
    }
  }

  /**
   * Generate a random private key for demo purposes
   */
  private generateRandomPrivateKey(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Estimate deployment cost
   */
  async estimateDeploymentCost(contractData: ContractData): Promise<number> {
    try {
      const contractCode = this.generateContractCode(contractData);

      // Base cost calculation (simplified)
      const baseCost = 100000; // 0.1 STX base fee
      const codeSizeCost = contractCode.length * 10; // Additional cost based on code size

      return baseCost + codeSizeCost;
    } catch (error) {
      console.error('Error estimating deployment cost:', error);
      return 100000; // Fallback to base cost
    }
  }

  /**
   * Get contract info from deployed contract
   */
  async getContractInfo(contractAddress: string): Promise<any> {
    try {
      const apiUrl = this.isTestnet
        ? 'https://api.testnet.hiro.so'
        : 'https://api.hiro.so';

      const response = await fetch(
        `${apiUrl}/v2/contracts/interface/${contractAddress}`
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch contract info: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error fetching contract info:', error);
      throw new Error(`Failed to get contract info: ${error.message}`);
    }
  }

  /**
   * Check transaction status on the blockchain
   * Returns the current status of a transaction
   */
  async checkTransactionStatus(txId: string): Promise<{
    status: 'pending' | 'success' | 'failed' | 'not_found';
    tx_status: string;
    tx_result?: any;
    block_height?: number;
    burn_block_time?: number;
    error?: string;
  }> {
    try {
      const apiBaseUrl = this.isTestnet 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so';
      
      const response = await fetch(`${apiBaseUrl}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: 'not_found',
            tx_status: 'Transaction not found yet. It may still be propagating.',
            error: 'Transaction not found in API. Wait a few seconds and try again.'
          };
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const txData = await response.json();
      
      // Map Stacks API status to our simplified status
      let status: 'pending' | 'success' | 'failed' | 'not_found' = 'pending';
      
      if (txData.tx_status === 'success') {
        status = 'success';
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        status = 'failed';
      } else if (txData.tx_status === 'pending') {
        status = 'pending';
      }

      return {
        status,
        tx_status: txData.tx_status,
        tx_result: txData.tx_result,
        block_height: txData.block_height,
        burn_block_time: txData.burn_block_time,
      };
    } catch (error: any) {
      console.error('Error checking transaction status:', error);
      return {
        status: 'not_found',
        tx_status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Wait for transaction to be confirmed
   * Polls the API until transaction is no longer pending
   */
  async waitForTransactionConfirmation(
    txId: string, 
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onStatusUpdate?: (status: any) => void;
    } = {}
  ): Promise<any> {
    const { 
      maxAttempts = 30,  // 30 attempts 
      intervalMs = 10000, // 10 seconds between checks
      onStatusUpdate 
    } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkTransactionStatus(txId);
      
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }

      if (status.status === 'success') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Transaction failed: ${status.tx_result || 'Unknown error'}`);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Transaction confirmation timeout. Please check explorer manually.');
  }

  /**
   * Deploy governance contract
   */
  async deployGovernanceContract(
    privateKey: string
  ): Promise<{
    txId: string;
    contractName: string;
    contractAddress: string;
    transaction: any;
    network: string;
    explorerUrl: string;
    apiStatusUrl: string;
  }> {
    try {
      if (!privateKey) {
        throw new Error('Private key is required for deployment');
      }

      // Read governance contract code
      const contractCode = `
;; Governance Contract for Pulse Robot Platform
;; DAO governance system with proposal creation, voting, and execution

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
(define-data-var proposal-threshold uint u1000000)
(define-data-var voting-period uint u2016)
(define-data-var quorum-percentage uint u1000)
(define-data-var execution-delay uint u144)
(define-data-var proposal-deposit uint u100000)

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
  status: (string-ascii 32),
  executed: bool,
  created-at: uint
})

;; Voting power (based on NFT holdings and staking)
(define-map voting-power principal uint)

;; User votes on proposals
(define-map user-votes {user: principal, proposal-id: uint} {
  vote: (string-ascii 16),
  voting-power: uint,
  voted-at: uint
})

;; ============================================
;; Read-only functions
;; ============================================

(define-read-only (get-proposal (proposal-id uint))
  (ok (map-get? proposals proposal-id)))

(define-read-only (get-voting-power (user principal))
  (ok (default-to u0 (map-get? voting-power user))))

(define-read-only (get-user-vote (user principal) (proposal-id uint))
  (ok (map-get? user-votes {user: user, proposal-id: proposal-id})))

(define-read-only (get-total-voting-power)
  (ok (var-get total-voting-power)))

(define-read-only (get-governance-params)
  (ok {
    proposal-threshold: (var-get proposal-threshold),
    voting-period: (var-get voting-period),
    quorum-percentage: (var-get quorum-percentage),
    execution-delay: (var-get execution-delay),
    proposal-deposit: (var-get proposal-deposit)
  }))

;; ============================================
;; Governance functions
;; ============================================

(define-public (create-proposal
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type (string-utf8 64))
  (target-contract (optional principal))
  (function-name (optional (string-ascii 128)))
  (parameters (optional (string-utf8 512)))
  (amount (optional uint))
  (recipient (optional principal))
)
  (let (
    (proposal-id (var-get next-proposal-id))
    (user-voting-power (default-to u0 (map-get? voting-power tx-sender)))
    (deposit-amount (var-get proposal-deposit))
  )
    ;; Validations
    (asserts! (>= user-voting-power (var-get proposal-threshold)) ERR-INSUFFICIENT-VOTING-POWER)

    ;; Pay deposit
    (try! (stx-transfer? deposit-amount tx-sender CONTRACT-OWNER))

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
      execution-block: (+ block-height (var-get voting-period) (var-get execution-delay)),
      votes-for: u0,
      votes-against: u0,
      votes-abstain: u0,
      total-votes: u0,
      status: "active",
      executed: false,
      created-at: block-height
    })

    ;; Increment proposal ID
    (var-set next-proposal-id (+ proposal-id u1))

    (ok proposal-id)))

(define-public (vote-on-proposal (proposal-id uint) (vote-type (string-ascii 16)))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-NOT-FOUND))
    (user-voting-power (default-to u0 (map-get? voting-power tx-sender)))
    (existing-vote (map-get? user-votes {user: tx-sender, proposal-id: proposal-id}))
  )
    ;; Validations
    (asserts! (is-eq (get status proposal) "active") ERR-VOTING-ENDED)
    (asserts! (<= block-height (get end-block proposal)) ERR-VOTING-ENDED)
    (asserts! (is-none existing-vote) ERR-ALREADY-VOTED)
    (asserts! (> user-voting-power u0) ERR-INSUFFICIENT-VOTING-POWER)

    ;; Record vote
    (map-set user-votes {user: tx-sender, proposal-id: proposal-id} {
      vote: vote-type,
      voting-power: user-voting-power,
      voted-at: block-height
    })

    ;; Update proposal votes
    (if (is-eq vote-type "for")
      (map-set proposals proposal-id (merge proposal {
        votes-for: (+ (get votes-for proposal) user-voting-power),
        total-votes: (+ (get total-votes proposal) user-voting-power)
      }))
      (if (is-eq vote-type "against")
        (map-set proposals proposal-id (merge proposal {
          votes-against: (+ (get votes-against proposal) user-voting-power),
          total-votes: (+ (get total-votes proposal) user-voting-power)
        }))
        (if (is-eq vote-type "abstain")
          (map-set proposals proposal-id (merge proposal {
            votes-abstain: (+ (get votes-abstain proposal) user-voting-power),
            total-votes: (+ (get total-votes proposal) user-voting-power)
          }))
          ERR-UNAUTHORIZED)))

    (ok true)))

(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-NOT-FOUND))
    (total-votes (get total-votes proposal))
    (quorum-required (* (var-get total-voting-power) (var-get quorum-percentage)))
  )
    ;; Validations
    (asserts! (>= block-height (get execution-block proposal)) ERR-VOTING-ACTIVE)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (>= total-votes (/ quorum-required u10000)) ERR-QUORUM-NOT-MET)
    (asserts! (> (get votes-for proposal) (get votes-against proposal)) ERR-PROPOSAL-REJECTED)

    ;; Mark as executed
    (map-set proposals proposal-id (merge proposal { executed: true, status: "executed" }))

    ;; Execute proposal based on type
    ;; For now, just return success - extend based on proposal types
    (ok true)))

;; ============================================
;; Admin functions
;; ============================================

(define-public (set-voting-power (user principal) (power uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set voting-power user power)
    (var-set total-voting-power (+ (var-get total-voting-power) power))
    (ok true)))

(define-public (update-governance-params
  (new-threshold uint)
  (new-voting-period uint)
  (new-quorum uint)
  (new-delay uint)
  (new-deposit uint)
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set proposal-threshold new-threshold)
    (var-set voting-period new-voting-period)
    (var-set quorum-percentage new-quorum)
    (var-set execution-delay new-delay)
    (var-set proposal-deposit new-deposit)
    (ok true)))
`;

      // Get sender address
      const senderAddress = getAddressFromPrivateKey(privateKey, this.network);

      // Create contract deploy transaction
      const txOptions = {
        contractName: 'pulse-governance',
        codeBody: contractCode,
        senderKey: privateKey,
        network: 'testnet' as const,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 200000, // 0.2 STX fee
      };
      const transaction = await makeContractDeploy(txOptions);

      // Broadcast to network

      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: 'testnet' as const
      });

      // Validate response
      if (!broadcastResponse || !broadcastResponse.txid) {
        console.error('❌ Invalid broadcast response:', broadcastResponse);
        throw new Error('Broadcast did not return a transaction ID');
      }

      const txId = broadcastResponse.txid;
      const contractAddress = `${senderAddress}.pulse-governance`;

      // Get explorer URL
      const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
      const apiStatusUrl = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

      return {
        txId,
        contractName: 'pulse-governance',
        contractAddress,
        transaction,
        network: 'testnet',
        explorerUrl,
        apiStatusUrl,
      };

    } catch (error: any) {
      console.error('❌ Governance contract deployment failed:', error);
      throw new Error(`Failed to deploy governance contract: ${error.message}`);
    }
  }

  /**
   * Deploy proof-of-fandom contract
   */
  async deployProofOfFandomContract(
    privateKey: string
  ): Promise<{
    txId: string;
    contractName: string;
    contractAddress: string;
    transaction: any;
    network: string;
    explorerUrl: string;
    apiStatusUrl: string;
  }> {
    try {
      if (!privateKey) {
        throw new Error('Private key is required for deployment');
      }

      // Read proof-of-fandom contract code
      const contractCode = `
;; Proof of Fandom Contract for Pulse Robot Platform
;; Implements SIP-013 SFT Standard for Proof of Fandom Badges

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

;; Achievement definitions
(define-map achievements uint {
  achievement-id: uint,
  name: (string-utf8 128),
  description: (string-utf8 512),
  category: (string-utf8 64),
  requirement-type: (string-ascii 32),
  requirement-value: uint,
  reward-badge-id: uint,
  reward-amount: uint,
  is-active: bool,
  created-at: uint
})

;; ============================================
;; SIP-013 Standard Functions
;; ============================================

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (var-get contract-uri)))

(define-read-only (get-owner (token-id uint) (owner principal))
  (ok (get balance (default-to {
    balance: u0,
    earned-at: u0,
    tier-level: u0,
    experience-points: u0,
    achievements: (list),
    metadata: ""
  } (map-get? user-badges {user: owner, token-id: token-id})))))

(define-read-only (get-balance (token-id uint) (owner principal))
  (ok (get balance (default-to {
    balance: u0,
    earned-at: u0,
    tier-level: u0,
    experience-points: u0,
    achievements: (list),
    metadata: ""
  } (map-get? user-badges {user: owner, token-id: token-id})))))

;; ============================================
;; Badge Management Functions
;; ============================================

(define-public (create-badge-type
  (type-id uint)
  (name (string-utf8 128))
  (description (string-utf8 512))
  (category (string-utf8 64))
  (max-tier uint)
  (is-transferable bool)
  (metadata-uri (string-utf8 256))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (is-none (map-get? badge-types type-id)) ERR-ALREADY-EXISTS)

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

    (ok true)))

(define-public (mint-badge
  (recipient principal)
  (badge-type-id uint)
  (tier-level uint)
  (amount uint)
  (metadata (string-utf8 512))
)
  (let (
    (badge-type (unwrap! (map-get? badge-types badge-type-id) ERR-NOT-FOUND))
    (token-id (+ (* badge-type-id u1000000000000) (* tier-level u1000000)))
    (current-balance (get balance (default-to {
      balance: u0,
      earned-at: u0,
      tier-level: u0,
      experience-points: u0,
      achievements: (list),
      metadata: ""
    } (map-get? user-badges {user: recipient, token-id: token-id}))))
  )
    ;; Validations
    (asserts! (<= tier-level (get max-tier badge-type)) ERR-INVALID-TIER)
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)

    ;; Mint badge
    (try! (contract-call? .sip-013-semi-fungible-token-trait transfer token-id amount tx-sender recipient none))

    ;; Update user badge data
    (map-set user-badges {user: recipient, token-id: token-id} {
      balance: (+ current-balance amount),
      earned-at: block-height,
      tier-level: tier-level,
      experience-points: u0,
      achievements: (list),
      metadata: metadata
    })

    ;; Update last token ID if needed
    (if (> token-id (var-get last-token-id))
      (var-set last-token-id token-id)
      true)

    (ok token-id)))

(define-public (transfer
  (token-id uint)
  (amount uint)
  (sender principal)
  (recipient principal)
  (memo (optional (buff 34)))
)
  (let (
    (badge-type-id (/ token-id u1000000000000))
    (badge-type (unwrap! (map-get? badge-types badge-type-id) ERR-NOT-FOUND))
    (sender-balance (get balance (default-to {
      balance: u0,
      earned-at: u0,
      tier-level: u0,
      experience-points: u0,
      achievements: (list),
      metadata: ""
    } (map-get? user-badges {user: sender, token-id: token-id}))))
  )
    ;; Validations
    (asserts! (is-eq tx-sender sender) ERR-UNAUTHORIZED)
    (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
    (asserts! (get is-transferable badge-type) ERR-BADGE-NOT-TRANSFERABLE)

    ;; Transfer badge
    (try! (contract-call? .sip-013-semi-fungible-token-trait transfer token-id amount sender recipient memo))

    ;; Update balances
    (map-set user-badges {user: sender, token-id: token-id}
      (merge (default-to {
        balance: u0,
        earned-at: u0,
        tier-level: u0,
        experience-points: u0,
        achievements: (list),
        metadata: ""
      } (map-get? user-badges {user: sender, token-id: token-id}))
      { balance: (- sender-balance amount) }))

    (map-set user-badges {user: recipient, token-id: token-id} {
      balance: amount,
      earned-at: block-height,
      tier-level: u0,
      experience-points: u0,
      achievements: (list),
      metadata: ""
    })

    (ok true)))

;; ============================================
;; Achievement System
;; ============================================

(define-public (create-achievement
  (achievement-id uint)
  (name (string-utf8 128))
  (description (string-utf8 512))
  (category (string-utf8 64))
  (requirement-type (string-ascii 32))
  (requirement-value uint)
  (reward-badge-id uint)
  (reward-amount uint)
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (is-none (map-get? achievements achievement-id)) ERR-ALREADY-EXISTS)

    (map-set achievements achievement-id {
      achievement-id: achievement-id,
      name: name,
      description: description,
      category: category,
      requirement-type: requirement-type,
      requirement-value: requirement-value,
      reward-badge-id: reward-badge-id,
      reward-amount: reward-amount,
      is-active: true,
      created-at: block-height
    })

    (ok true)))

(define-public (unlock-achievement (user principal) (achievement-id uint))
  (let (
    (achievement (unwrap! (map-get? achievements achievement-id) ERR-NOT-FOUND))
    (reward-badge-id (get reward-badge-id achievement))
    (reward-amount (get reward-amount achievement))
  )
    ;; Validations
    (asserts! (get is-active achievement) ERR-ACHIEVEMENT-LOCKED)
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)

    ;; Mint reward badge
    (try! (mint-badge user reward-badge-id u1 reward-amount ""))

    (ok true)))

;; ============================================
;; Read-only functions
;; ============================================

(define-read-only (get-badge-type (type-id uint))
  (ok (map-get? badge-types type-id)))

(define-read-only (get-user-badge (user principal) (token-id uint))
  (ok (map-get? user-badges {user: user, token-id: token-id})))

(define-read-only (get-achievement (achievement-id uint))
  (ok (map-get? achievements achievement-id)))

(define-read-only (get-user-achievements (user principal))
  (ok (list)))
`;

      // Get sender address
      const senderAddress = getAddressFromPrivateKey(privateKey, this.network);

      // Create contract deploy transaction
      const txOptions = {
        contractName: 'pulse-fandom',
        codeBody: contractCode,
        senderKey: privateKey,
        network: 'testnet' as const,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 200000, // 0.2 STX fee
      };
      const transaction = await makeContractDeploy(txOptions);

      // Broadcast to network

      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: 'testnet' as const
      });

      // Validate response
      if (!broadcastResponse || !broadcastResponse.txid) {
        console.error('❌ Invalid broadcast response:', broadcastResponse);
        throw new Error('Broadcast did not return a transaction ID');
      }

      const txId = broadcastResponse.txid;
      const contractAddress = `${senderAddress}.pulse-fandom`;

      // Get explorer URL
      const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
      const apiStatusUrl = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

      return {
        txId,
        contractName: 'pulse-fandom',
        contractAddress,
        transaction,
        network: 'testnet',
        explorerUrl,
        apiStatusUrl,
      };

    } catch (error: any) {
      console.error('❌ Proof-of-fandom contract deployment failed:', error);
      throw new Error(`Failed to deploy proof-of-fandom contract: ${error.message}`);
    }
  }
}

// Export singleton instance
export const stacksDeploymentService = new StacksDeploymentService(true); // Use testnet