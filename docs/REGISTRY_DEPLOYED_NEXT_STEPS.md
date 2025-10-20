# 🎉 Event Registry Deployed - Next Steps

## Contract Details
- **Contract Address**: `ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.event-registry-event`
- **Network**: Stacks Testnet
- **Status**: ✅ Deployed and Live
- **Registration Fee**: 0.01 STX
- **Verification Fee**: 0.05 STX

---

## ✅ Completed
1. ✅ Event Registry contract deployed successfully
2. ✅ Contract address updated in `src/config/contracts.ts`
3. ✅ Registry service created at `src/services/eventRegistryService.ts`
4. ✅ Helper functions for block height conversion added

---

## 🔴 CRITICAL - Missing Integration

### Current State
**CreateEventNFT.tsx does NOT register events to the blockchain registry!**

Events are only saved to `localStorage`, which means:
- ❌ Events are NOT discoverable by other users
- ❌ Events won't appear in BrowseEvents page for others
- ❌ Events cannot be listed on marketplace
- ❌ Events are only visible on YOUR browser

### What Needs to be Done

#### 1. Update CreateEventNFT.tsx

Add this import at the top:
```typescript
import { registerEventToRegistry, timestampToBlockHeight } from '../services/eventRegistryService';
import { DEPLOYMENT_COSTS } from '../config/contracts';
```

#### 2. After Successful Contract Deployment

Find the section after contract deployment (around line 850-950) and add:

```typescript
// After contract deployment success
const handleDeploySuccess = async (deployedContractAddress: string) => {
  try {
    // Save to localStorage (existing code)
    const savedEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
    savedEvents.push(newEventData);
    localStorage.setItem('userEvents', JSON.stringify(savedEvents));
    
    // ===== NEW CODE: Register to on-chain registry =====
    toast({
      title: "Registering to Event Registry...",
      description: "Making your event discoverable platform-wide",
    });
    
    // Convert event date to block height
    const eventBlockHeight = await timestampToBlockHeight(eventDetails.eventDate);
    
    // Register to blockchain registry
    const registryResult = await registerEventToRegistry({
      contractAddress: deployedContractAddress,
      contractName: contractName,
      eventName: eventDetails.eventName,
      eventDescription: eventDetails.description,
      category: eventDetails.category || 'general',
      venue: eventDetails.venue,
      venueAddress: eventDetails.venueAddress,
      venueCoordinates: eventDetails.venueCoordinates || '0,0',
      eventDate: eventBlockHeight,
      ticketPrice: Math.floor(eventDetails.ticketPrice * 1_000_000), // Convert to micro-STX
      totalSupply: eventDetails.totalSupply,
      imageUri: ipfsImageUrl,
      metadataUri: ipfsMetadataUrl,
      userAddress: userSession.loadUserData().profile.stxAddress.testnet,
    });
    
    console.log('✅ Registered to registry, TX:', registryResult.txId);
    
    toast({
      title: "Event Registered! 🎉",
      description: "Your event is now discoverable on the platform",
      variant: "success",
    });
    
    // Navigate to event page
    navigate(`/event/${deployedContractAddress}`);
    
  } catch (error) {
    console.error('Registry registration failed:', error);
    toast({
      title: "Registry Registration Failed",
      description: "Event deployed but not registered. You can register manually later.",
      variant: "warning",
    });
  }
};
```

#### 3. Update Cost Display

Show users they need to pay registration fee:

```typescript
const totalCost = DEPLOYMENT_COSTS.eventContract + DEPLOYMENT_COSTS.registryFee;

// In your UI:
<div className="cost-breakdown">
  <p>Contract Deployment: {DEPLOYMENT_COSTS.eventContract} STX</p>
  <p>Registry Registration: {DEPLOYMENT_COSTS.registryFee} STX</p>
  <p className="font-bold">Total: {totalCost} STX</p>
</div>
```

---

## 📋 Testing Checklist

### Before Testing
- [ ] Ensure you have at least 0.5 STX in your testnet wallet
- [ ] Get testnet STX from https://explorer.hiro.so/sandbox/faucet
- [ ] Verify Event Registry contract is deployed

### Test Flow
1. [ ] Deploy a new event via CreateEventNFT.tsx
2. [ ] Confirm contract deployment transaction
3. [ ] Confirm registry registration transaction (0.01 STX)
4. [ ] Wait for both transactions to confirm
5. [ ] Check event appears in BrowseEvents page
6. [ ] Verify event can be viewed by other users
7. [ ] Test minting a ticket
8. [ ] Test listing ticket on marketplace

### Expected Transactions
- **Transaction 1**: Contract deployment (~0.25 STX + gas)
- **Transaction 2**: Registry registration (0.01 STX)
- **Total**: ~0.26-0.30 STX

---

## 🔍 How to Verify Registration

### Check on Explorer
1. Go to https://explorer.hiro.so/txid/YOUR_TX_ID?chain=testnet
2. Wait for "Success" status
3. Check contract calls show `register-event` function

### Check via API
```bash
curl -X POST https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/event-registry-event/get-total-events \
  -H 'Content-Type: application/json' \
  -d '{
    "sender": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C",
    "arguments": []
  }'
```

### Check in Console
```javascript
import { getRegistryContract } from './config/contracts';

const registry = getRegistryContract();
console.log('Registry:', registry);
// Should show: { address: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.event-registry-event', name: 'event-registry-event' }
```

---

## 🚀 Next Steps After Integration

### 1. Update BrowseEvents.tsx
Fetch events from registry instead of localStorage:

```typescript
// Instead of localStorage
const events = JSON.parse(localStorage.getItem('userEvents') || '[]');

// Use registry contract read-only calls
// This will show ALL platform events, not just yours
```

### 2. Deploy NFT Marketplace Contract
```bash
# Deploy nft-marketplace.clar
clarinet contract deploy contracts/intic-smart-contracts/nft-marketplace.clar --testnet
```

### 3. Test Complete Flow
- User A: Deploy event + register
- User B: Browse events, see User A's event
- User B: Mint ticket from User A's event
- User B: List ticket on marketplace
- User A: Buy ticket from marketplace

---

## 📝 Important Notes

### Registration Fee (0.01 STX)
- Goes to Event Registry contract treasury
- Platform owner can withdraw via `withdraw-treasury` function
- Required for spam prevention

### Block Height vs Timestamp
- Event dates must be in Bitcoin block height format
- Helper function `timestampToBlockHeight` handles conversion
- ~10 minutes per Bitcoin block
- Example: Event in 30 days ≈ current block + 4320 blocks

### Transaction Ordering
1. **First**: Deploy event contract (user signs once)
2. **Second**: Register to registry (user signs again)
3. **Important**: Both must succeed for full functionality

### Error Handling
- If deployment succeeds but registration fails:
  - Event exists but isn't discoverable
  - User can manually register later (build UI for this)
  - Or re-deploy completely

---

## 🐛 Troubleshooting

### "Event Registry contract not configured"
- Check `src/config/contracts.ts`
- Verify `EVENT_REGISTRY_CONTRACT.testnet.address` has the correct value

### "User cancelled transaction"
- Normal if user clicks "Cancel" in wallet
- Deployment succeeded, but registration cancelled
- Build retry mechanism

### "Insufficient funds"
- User needs minimum 0.3 STX for deployment + registration
- Direct them to faucet

### Registration succeeds but event doesn't show
- Check BrowseEvents.tsx is reading from registry, not localStorage
- Verify event-id was returned from register-event
- Check transaction actually confirmed on-chain

---

## 📚 Additional Resources

- [Event Registry Contract](../contracts/intic-smart-contracts/event-registry.clar)
- [Registry Service](../src/services/eventRegistryService.ts)
- [Stacks Explorer](https://explorer.hiro.so/?chain=testnet)
- [Hiro API Docs](https://docs.hiro.so/api)

---

## ✨ Success Criteria

Your integration is complete when:
- ✅ User deploys event → 2 transactions (deploy + register)
- ✅ Event appears in BrowseEvents for ALL users
- ✅ Event shows in registry contract (call get-total-events)
- ✅ Other users can mint tickets
- ✅ Tickets can be listed on marketplace
- ✅ Platform stats update correctly

**Current Status**: 🔴 Needs CreateEventNFT.tsx integration

**Priority**: CRITICAL - Platform won't work without this!
