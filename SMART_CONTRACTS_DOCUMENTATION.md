# Smart Contracts Documentation for Pulse Robot Platform

## Overview

This document provides comprehensive documentation for the smart contract system powering the Pulse Robot NFT ticketing platform. The platform consists of 4 main contracts that work together to provide a complete Web3 ticketing ecosystem on the Stacks blockchain.

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Pulse Robot Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   NFT Ticket    │    │ Proof of Fandom │                │
│  │   Contract      │    │    Contract     │                │
│  │   (SIP-009)     │    │   (SIP-013)     │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           │              ┌─────────────────┐               │
│           └──────────────▶│ sBTC Payment    │               │
│                          │   Contract      │               │
│                          │   (SIP-010)     │               │
│                          └─────────────────┘               │
│                                   │                        │
│                          ┌─────────────────┐               │
│                          │   Governance    │               │
│                          │   Contract      │               │
│                          │     (DAO)       │               │
│                          └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Contract Details

### 1. NFT Ticket Contract (`nft-ticket.clar`)

**Purpose**: Core ticketing functionality using SIP-009 NFT standard

**Key Features**:
- Event creation and management
- NFT ticket minting with unique access codes
- Secondary market trading with royalties
- Tier-based pricing and early access
- Ticket validation and usage tracking

**Main Functions**:

#### Event Management
```clarity
(define-public (create-event
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (venue (string-utf8 256))
  (date uint)
  (ticket-price uint)
  (total-supply uint)
  (royalty-percentage uint)
  (early-access-enabled bool)
  (metadata-uri (string-utf8 256))))
```

#### Ticket Purchase
```clarity
(define-public (buy-ticket
  (event-id uint)
  (seat-number (optional (string-utf8 32)))
  (tier (string-utf8 32))))
```

#### Secondary Market
```clarity
(define-public (list-ticket (token-id uint) (price uint))
(define-public (buy-listed-ticket (token-id uint))
```

#### Validation
```clarity
(define-public (use-ticket (token-id uint))
(define-public (validate-access-code (token-id uint) (provided-code (string-utf8 64))))
```

**Data Structures**:

**Events**:
```clarity
{
  event-id: uint,
  organizer: principal,
  name: (string-utf8 256),
  description: (string-utf8 1024),
  venue: (string-utf8 256),
  date: uint,
  ticket-price: uint,
  total-supply: uint,
  available-tickets: uint,
  royalty-percentage: uint,
  is-active: bool,
  early-access-enabled: bool,
  metadata-uri: (string-utf8 256)
}
```

**Tickets**:
```clarity
{
  ticket-id: uint,
  event-id: uint,
  owner: principal,
  seat-number: (optional (string-utf8 32)),
  tier: (string-utf8 32),
  purchase-price: uint,
  purchase-date: uint,
  is-used: bool,
  metadata-uri: (string-utf8 256),
  access-code: (string-utf8 64)
}
```

### 2. Proof of Fandom Contract (`proof-of-fandom.clar`)

**Purpose**: Tier-based badge system using SIP-013 Semi-Fungible Token standard

**Key Features**:
- Multi-tier badge system
- Achievement tracking
- Community interaction scoring
- Referral system
- Reward distribution
- Leaderboards

**Main Functions**:

#### Badge Management
```clarity
(define-public (create-badge-type
  (name (string-utf8 128))
  (description (string-utf8 512))
  (category (string-utf8 64))
  (max-tier uint)
  (is-transferable bool)
  (metadata-uri (string-utf8 256))))
```

#### Badge Earning
```clarity
(define-public (award-badge
  (user principal)
  (badge-type uint)
  (tier uint)
  (amount uint)
  (metadata (string-utf8 512))))
```

#### Achievement System
```clarity
(define-public (create-achievement
  (name (string-utf8 128))
  (description (string-utf8 512))
  (points-reward uint)
  (requirements (string-utf8 512))))

(define-public (unlock-achievement (user principal) (achievement-id uint))
```

**Tier System**:
- **Bronze**: Entry level, 0% discount, no early access
- **Silver**: 5% discount, early access enabled
- **Gold**: 10% discount, early access + exclusive events
- **Platinum**: 15% discount, all benefits + governance power

### 3. sBTC Payment Contract (`sbtc-payment.clar`)

**Purpose**: Handle all sBTC transactions, escrow, and staking

**Key Features**:
- Ticket purchase processing
- Secondary market payments
- Escrow system for secure transactions
- Staking pools with rewards
- Platform fee management
- Payment tracking and analytics

**Main Functions**:

#### Payment Processing
```clarity
(define-public (process-ticket-payment
  (buyer principal)
  (event-organizer principal)
  (amount uint)
  (event-id uint)
  (ticket-count uint)))
```

#### Escrow System
```clarity
(define-public (create-escrow
  (seller principal)
  (amount uint)
  (purpose (string-utf8 128))
  (duration-blocks uint)))

(define-public (release-escrow (escrow-id uint))
(define-public (refund-escrow (escrow-id uint))
```

#### Staking
```clarity
(define-public (stake-sbtc (amount uint) (pool-id uint))
(define-public (claim-staking-rewards)
(define-public (unstake-sbtc)
```

**Fee Structure**:
- Platform fee: 2.5% of transaction value
- Event organizer royalty: Configurable per event (default 5%)
- Staking rewards: Variable APY based on pool

### 4. Governance Contract (`governance.clar`)

**Purpose**: DAO governance for platform parameters and treasury management

**Key Features**:
- Proposal creation and voting
- Voting power based on sBTC holdings and badges
- Delegation system
- Treasury management
- Emergency governance
- Proposal execution with time delays

**Main Functions**:

#### Proposal Management
```clarity
(define-public (create-proposal
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type (string-utf8 64))
  (amount (optional uint))
  (recipient (optional principal))))
```

#### Voting
```clarity
(define-public (vote (proposal-id uint) (vote-type (string-utf8 16)))
(define-public (delegate-vote (delegate principal))
```

#### Execution
```clarity
(define-public (execute-proposal (proposal-id uint))
```

**Governance Parameters**:
- Proposal threshold: 10 sBTC minimum to create proposals
- Voting period: 2 weeks (2016 blocks)
- Quorum: 10% of total voting power
- Execution delay: 1 day after voting ends

## Integration Flow

### 1. Event Creation Flow
```
Event Organizer → NFT Ticket Contract → Create Event
                                    ↓
                           Set Royalty Recipients
                                    ↓
                           Event Available for Purchase
```

### 2. Ticket Purchase Flow
```
User → sBTC Payment Contract → Process Payment
                            ↓
     NFT Ticket Contract → Mint Ticket NFT
                            ↓
     Proof of Fandom → Update User Tier
```

### 3. Secondary Market Flow
```
Seller → NFT Ticket Contract → List Ticket
                            ↓
Buyer → sBTC Payment Contract → Process Secondary Sale
                            ↓
      NFT Ticket Contract → Transfer Ownership
                            ↓
      Distribute Royalties (Organizer + Platform)
```

### 4. Governance Flow
```
Token Holder → Governance Contract → Create Proposal
                                  ↓
            Community Voting (2 weeks)
                                  ↓
            Proposal Execution (if passed)
                                  ↓
            Update Platform Parameters
```

## Security Features

### 1. Access Control
- **Owner-only functions**: Contract upgrades, emergency functions
- **Role-based permissions**: Event organizers, authorized minters
- **Voter validation**: Minimum voting power requirements

### 2. Input Validation
- **Amount checks**: Prevent zero or negative values
- **Time validation**: Event dates, voting periods
- **Balance verification**: Sufficient funds before transactions

### 3. State Protection
- **Reentrancy protection**: Single-transaction state changes
- **Atomic operations**: All-or-nothing transaction processing
- **Event immutability**: Core event data cannot be modified after creation

### 4. Emergency Functions
- **Circuit breakers**: Pause functionality in emergencies
- **Admin overrides**: Emergency refunds and corrections
- **Upgrade paths**: Safe contract upgrade mechanisms

## Error Codes

### NFT Ticket Contract (100-199)
- `u100`: Owner only
- `u101`: Not token owner
- `u102`: Not found
- `u103`: Ticket already used
- `u104`: Event not found
- `u105`: Sale inactive
- `u106`: Insufficient payment
- `u107`: Event ended
- `u108`: Unauthorized
- `u109`: Invalid price
- `u110`: Sold out

### Proof of Fandom Contract (200-299)
- `u200`: Owner only
- `u201`: Unauthorized
- `u202`: Not found
- `u203`: Already exists
- `u204`: Insufficient balance
- `u205`: Invalid amount
- `u206`: Badge not transferable
- `u207`: Achievement locked
- `u208`: Invalid tier

### sBTC Payment Contract (300-399)
- `u300`: Owner only
- `u301`: Unauthorized
- `u302`: Not found
- `u303`: Insufficient balance
- `u304`: Invalid amount
- `u305`: Payment failed
- `u306`: Escrow not found
- `u307`: Escrow expired
- `u308`: Escrow already released
- `u309`: Staking not found
- `u310`: Staking locked
- `u311`: Invalid duration

### Governance Contract (400-499)
- `u400`: Owner only
- `u401`: Unauthorized
- `u402`: Not found
- `u403`: Already voted
- `u404`: Voting ended
- `u405`: Voting active
- `u406`: Insufficient voting power
- `u407`: Proposal expired
- `u408`: Quorum not met
- `u409`: Proposal rejected
- `u410`: Already executed
- `u411`: Invalid duration

## Deployment Instructions

### Prerequisites
1. **Stacks CLI**: Install the latest Stacks CLI
2. **Node.js**: Version 16 or higher
3. **Environment Setup**: Configure `.env` file with proper keys

### Deployment Steps

1. **Setup Environment**:
```bash
npm run setup:env
```

2. **Deploy to Testnet**:
```bash
npm run deploy:testnet
```

3. **Deploy to Mainnet**:
```bash
npm run deploy:mainnet
```

### Post-Deployment Configuration

1. **Update Frontend**: Add contract addresses to environment variables
2. **Initialize Contracts**: Create default badge types and staking pools
3. **Test Integration**: Verify all contract interactions work correctly

## Frontend Integration

### Contract Service Example

```typescript
// services/contractService.ts
import { StacksNetwork } from '@stacks/network';
import { contractPrincipalCV, uintCV, stringUtf8CV } from '@stacks/transactions';

export class PulseRobotContracts {
  constructor(
    private network: StacksNetwork,
    private contractAddress: string
  ) {}

  async createEvent(eventData: EventData) {
    return await contractCall({
      network: this.network,
      contractAddress: this.contractAddress,
      contractName: 'nft-ticket',
      functionName: 'create-event',
      functionArgs: [
        stringUtf8CV(eventData.name),
        stringUtf8CV(eventData.description),
        // ... other parameters
      ]
    });
  }

  async buyTicket(eventId: number, tier: string) {
    return await contractCall({
      network: this.network,
      contractAddress: this.contractAddress,
      contractName: 'nft-ticket',
      functionName: 'buy-ticket',
      functionArgs: [
        uintCV(eventId),
        stringUtf8CV(tier)
      ]
    });
  }
}
```

## Testing

### Unit Tests
Each contract includes comprehensive unit tests covering:
- Function behavior
- Edge cases
- Error conditions
- State transitions

### Integration Tests
Full workflow testing:
- Event creation to ticket purchase
- Secondary market transactions
- Governance proposal lifecycle
- Badge earning and tier progression

### Security Tests
- Reentrancy attack prevention
- Access control validation
- Input sanitization
- Economic attack resistance

## Monitoring and Analytics

### Key Metrics to Track
1. **Platform Usage**:
   - Total events created
   - Total tickets sold
   - Secondary market volume
   - Active users

2. **Financial Metrics**:
   - Revenue generated
   - Platform fees collected
   - Staking rewards distributed
   - Treasury balance

3. **Governance Metrics**:
   - Proposals created
   - Voting participation
   - Proposal success rate
   - Voting power distribution

4. **User Engagement**:
   - Badge distribution
   - Tier progression
   - Achievement unlocks
   - Community interactions

## Future Enhancements

### Phase 2 Features
1. **Advanced Ticketing**:
   - Season passes
   - VIP experiences
   - Dynamic pricing
   - Waitlist management

2. **Enhanced Governance**:
   - Quadratic voting
   - Conviction voting
   - Multi-sig proposals
   - Cross-chain governance

3. **Social Features**:
   - Event reviews
   - Attendee networking
   - Social proof of attendance
   - Community-driven events

4. **Analytics Dashboard**:
   - Real-time metrics
   - Revenue analytics
   - User behavior insights
   - Performance monitoring

## Support and Maintenance

### Contract Upgrades
- Use proxy pattern for upgradeable contracts
- Implement timelock for critical changes
- Community governance for major updates

### Bug Reporting
- GitHub issues for technical problems
- Discord for community support
- Email for security vulnerabilities

### Documentation Updates
- Keep documentation in sync with code changes
- Version control for documentation
- Community contributions welcome

---

**Built for Stacks Builders Challenge 2025**
**Platform**: Stacks Blockchain with sBTC Integration
**Standards**: SIP-009 (NFT), SIP-010 (Fungible Token), SIP-013 (Semi-Fungible Token)
**License**: MIT