# Platform Architecture - 2 Transaction Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Wallet
    participant Stacks
    participant EventContract
    participant Registry

    Note over User,Registry: FULL DEPLOYMENT FLOW

    User->>Frontend: 1. Click "Launch Event"
    Frontend->>Frontend: Validate form & balance
    Frontend->>Frontend: Upload to IPFS (image + metadata)
    Frontend->>Frontend: Generate contract code
    
    Note over Frontend,Wallet: TRANSACTION #1: DEPLOY CONTRACT
    Frontend->>Wallet: deployContract(name, code)
    Wallet->>User: Sign Transaction #1 (0.25 STX)
    User->>Wallet: ✅ Approve
    Wallet->>Stacks: Broadcast deploy TX
    Stacks->>EventContract: Create contract
    EventContract-->>Stacks: Contract deployed
    Stacks-->>Wallet: TX confirmed
    Wallet-->>Frontend: deployTxId
    
    Note over Frontend,Registry: TRANSACTION #2: AUTO-REGISTER
    Frontend->>Frontend: Wait 2s for indexing
    Frontend->>Frontend: Prepare registry params
    Frontend->>Wallet: registerEventToRegistry(params)
    Wallet->>User: Sign Transaction #2 (0.01 STX)
    User->>Wallet: ✅ Approve
    Wallet->>Stacks: Broadcast register TX
    Stacks->>Registry: Call register-event
    Registry->>Registry: Validate & store event
    Registry-->>Stacks: Event registered
    Stacks-->>Wallet: TX confirmed
    Wallet-->>Frontend: registryTxId
    
    Frontend->>Frontend: Update localStorage
    Frontend->>User: ✅ Event Launched! 🎉
    
    Note over User,Registry: EVENT NOW DISCOVERABLE
```

## Component Interaction

```mermaid
graph TB
    subgraph Frontend
        A[CreateEventNFT.tsx]
        B[eventRegistryService.ts]
        C[contracts.ts Config]
    end
    
    subgraph Blockchain
        D[Event Contract<br/>user.event-name]
        E[Event Registry<br/>ST1X7M...event-registry]
        F[NFT Marketplace<br/>Not deployed yet]
    end
    
    subgraph Storage
        G[IPFS/Pinata<br/>Images & Metadata]
        H[LocalStorage<br/>Deployment Queue]
    end
    
    A -->|1. Upload| G
    A -->|2. Deploy TX #1| D
    A -->|3. Calls| B
    B -->|Uses| C
    B -->|4. Register TX #2| E
    E -->|References| D
    D -.->|Can be listed on| F
    A -->|Backup| H
    
    style D fill:#4ade80
    style E fill:#60a5fa
    style F fill:#f59e0b
```

## Transaction Flow Detail

```mermaid
stateDiagram-v2
    [*] --> FormFilled: User fills event details
    FormFilled --> IPFS_Upload: Click "Launch Event"
    IPFS_Upload --> ContractGenerated: Upload image & metadata
    ContractGenerated --> WalletPopup1: Generate contract code
    
    WalletPopup1 --> DeployPending: User signs TX #1
    DeployPending --> DeployConfirmed: Wait ~30-60s
    
    DeployConfirmed --> WalletPopup2: Auto-trigger registry
    WalletPopup2 --> RegisterPending: User signs TX #2
    RegisterPending --> RegisterConfirmed: Wait ~30-60s
    
    RegisterConfirmed --> [*]: ✅ Event Live & Discoverable
    
    WalletPopup1 --> Cancelled1: User cancels
    Cancelled1 --> [*]: ❌ Deployment cancelled
    
    WalletPopup2 --> Cancelled2: User cancels
    Cancelled2 --> PartialSuccess: ⚠️ Deployed but not registered
    PartialSuccess --> RetryQueue: Save to retry queue
    RetryQueue --> [*]: Can register later
```

## Cost Breakdown

```
┌─────────────────────────────────────────────────┐
│          TRANSACTION COSTS                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  TX #1: Contract Deployment                     │
│  ├─ Base Fee: ~0.20 STX                        │
│  └─ Gas: ~0.05 STX                             │
│     Total: ~0.25 STX ────────────────┐         │
│                                       │         │
│  TX #2: Registry Registration         │         │
│  ├─ Registry Fee: 0.01 STX            │         │
│  └─ Gas: ~0.001 STX                   │         │
│     Total: ~0.011 STX ────────────────┤         │
│                                       │         │
│  ─────────────────────────────────────┤         │
│  GRAND TOTAL: ~0.26 STX ◄─────────────┘         │
│                                                 │
│  User pays: 2 separate transactions             │
│  User clicks: 1 button ("Launch Event")         │
│  User signs: 2 times (auto-triggered)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Data Flow

```
Event Data Flow:
================

1. Form Input (User)
   ├─ Event Name
   ├─ Date, Time, Venue
   ├─ Price, Supply
   ├─ Image
   └─ Description

2. IPFS Storage (Pinata)
   ├─ Image → ipfs://Qm...image
   └─ Metadata → ipfs://Qm...metadata

3. Contract Generation (Frontend)
   ├─ Template + User Data
   └─ Clarity Code (1000+ lines)

4. Blockchain Storage (Stacks)
   ├─ Event Contract
   │  ├─ NFT Definition
   │  ├─ Minting Logic
   │  └─ Metadata URIs
   │
   └─ Registry Contract
      ├─ Event Mapping
      ├─ Category Index
      ├─ Creator Index
      └─ Stats Tracking

5. Discovery (BrowseEvents)
   ├─ Read from Registry
   ├─ Display to All Users
   └─ Enable Minting
```

## Error Handling

```
Error Scenarios:
================

Scenario 1: Insufficient Balance
├─ Detection: Before TX #1
├─ Action: Show error, redirect to faucet
└─ Impact: ❌ No deployment

Scenario 2: Deployment Failed
├─ Detection: TX #1 fails
├─ Action: Show error, save to retry queue
└─ Impact: ❌ No contract, no registration

Scenario 3: User Cancels Deployment
├─ Detection: TX #1 cancelled
├─ Action: Show cancellation message
└─ Impact: ❌ No contract, no registration

Scenario 4: Deployment OK, Registry Fails
├─ Detection: TX #2 fails
├─ Action: Show warning, save to retry queue
└─ Impact: ✅ Contract deployed, ⚠️ Not discoverable

Scenario 5: User Cancels Registration
├─ Detection: TX #2 cancelled
├─ Action: Show warning, save to retry queue
└─ Impact: ✅ Contract deployed, ⚠️ Not discoverable

Scenario 6: Both Success
├─ Detection: Both TXs confirmed
├─ Action: Show success, redirect to event
└─ Impact: ✅ Fully functional & discoverable
```

## Files Modified/Created

```
Project Structure Changes:
==========================

✅ Created/Modified:
├─ src/config/contracts.ts
│  └─ Added EVENT_REGISTRY_CONTRACT config
│  └─ Updated DEPLOYMENT_COSTS
│
├─ src/services/eventRegistryService.ts [NEW]
│  └─ registerEventToRegistry()
│  └─ timestampToBlockHeight()
│  └─ getCurrentBlockHeight()
│
├─ src/pages/CreateEventNFT.tsx
│  └─ Import eventRegistryService
│  └─ Auto-register after deploy (line 982-1048)
│  └─ Updated cost display
│  └─ Enhanced error handling
│
├─ docs/TWO_TRANSACTION_FLOW.md [NEW]
│  └─ Complete documentation
│
├─ docs/ARCHITECTURE_DIAGRAMS.md [NEW]
│  └─ Visual diagrams (this file)
│
└─ docs/REGISTRY_DEPLOYED_NEXT_STEPS.md
   └─ Implementation guide

Contract Deployed:
==================
✅ ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.event-registry-event

Pending Deployment:
===================
⏳ nft-marketplace.clar (for resale functionality)
```

---

**Status**: 🟢 **IMPLEMENTATION COMPLETE - READY FOR TESTING**
