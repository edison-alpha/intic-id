# Registry V2 Quick Reference

## 🎯 Quick Start

### Deploy & Register Event
```typescript
// 1. Deploy contract
const tx = await deployContract(contractCode);

// 2. Register (2 params only!)
await callContractFunction({
  contractAddress: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C',
  contractName: 'event-registry-v2',
  functionName: 'register-event',
  functionArgs: [
    principalCV(contractAddr),
    stringAsciiCV(contractName)
  ]
});
```

### Fetch Events for Discovery
```typescript
import { getAllRegistryEvents } from '@/services/registryService';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';

// Get addresses
const registryEvents = await getAllRegistryEvents();

// Fetch details
for (const regEvent of registryEvents) {
  const info = await callReadOnlyFunction({
    contractAddress: regEvent.contractAddress,
    contractName: regEvent.contractName,
    functionName: 'get-event-info',
    functionArgs: [],
    network: new StacksTestnet(),
    senderAddress: regEvent.contractAddress
  });
  
  const data = cvToJSON(info);
  // Use data.value.value for nested structures
}
```

### Load Event by ID
```typescript
import { getRegistryEvent } from '@/services/registryService';
import { getEventDataFromContract } from '@/services/nftIndexer';

// Get contract address from registry
const regData = await getRegistryEvent(5); // Event ID

// Fetch full details
const event = await getEventDataFromContract(
  `${regData.contractAddress}.${regData.contractName}`
);
```

---

## 📦 Registry Service Functions

```typescript
// Get total events
const total: number = await getTotalEvents();

// Get single event
const event: RegistryEvent = await getRegistryEvent(5);

// Get all events
const events: RegistryEvent[] = await getAllRegistryEvents();

// Get featured only
const featured: RegistryEvent[] = await getFeaturedEvents();

// Get by organizer
const myEvents: number[] = await getOrganizerEvents('ST1X7...');

// Platform stats
const stats = await getPlatformStats();
// { totalEvents, activeEvents, verifiedOrganizers, featuredEvents }
```

---

## 🏗️ RegistryEvent Interface

```typescript
interface RegistryEvent {
  eventId: number;
  contractAddress: string;
  contractName: string;
  organizer: string;
  registeredAt: number;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
}
```

---

## 🔧 Contract Functions

### Read-Only
```clarity
;; Get total
(get-total-events)

;; Get single event
(get-event (event-id uint))

;; Get range
(get-events-range (start uint) (end uint))

;; Get organizer events
(get-organizer-events (organizer principal))

;; Get featured
(get-featured-events)

;; Check verified
(is-organizer-verified (organizer principal))
```

### Write (Require Auth)
```clarity
;; Register new event
(register-event (contract-address principal) (contract-name (string-ascii 40)))

;; Toggle active
(set-event-active (event-id uint) (active bool))

;; Admin only
(verify-event (event-id uint))
(feature-event (event-id uint))
(transfer-ownership (new-owner principal))
```

---

## 🎨 UI Components

### Verified Badge
```tsx
{event.verified && (
  <Badge className="bg-blue-500/20 text-blue-400">
    <CheckCircle className="w-3 h-3 mr-1" />
    Verified
  </Badge>
)}
```

### Featured Badge
```tsx
{event.featured && (
  <Badge className="bg-yellow-500/20 text-yellow-400">
    ⭐ Featured
  </Badge>
)}
```

---

## ⚡ Performance Tips

1. **Cache registry data** (addresses change rarely)
2. **Batch fetch** contract details (Promise.all)
3. **Pagination** for large lists (10-20 per page)
4. **Skip inactive** events early
5. **Memoize** parsed data with React.useMemo

---

## 🐛 Common Issues

### "Event not found"
- Check `is-active = true` in registry
- Verify event ID exists
- Ensure on correct network (testnet)

### Stale data
- Always fetch from contract, not cache
- Registry only stores addresses, not details

### Gas estimation failed
- Use 2 params only for register-event
- Check contract-name is max 40 chars
- Verify principal format is correct

---

## 📝 Code Patterns

### Error Handling
```typescript
try {
  const event = await getRegistryEvent(id);
  if (!event) {
    toast.error('Event not found');
    return;
  }
  // Continue...
} catch (err) {
  console.error('Registry error:', err);
  // Fallback...
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(true);
const [events, setEvents] = useState<any[]>([]);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllRegistryEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

### Combining Data
```typescript
const event = {
  // From registry
  eventId: regData.eventId,
  verified: regData.isVerified,
  featured: regData.isFeatured,
  organizer: regData.organizer,
  
  // From contract
  title: contractData.name,
  price: contractData.price,
  supply: contractData.totalSupply,
  // ...
};
```

---

## 🔐 Security Notes

- ✅ Only contract owner can verify/feature events
- ✅ Only event organizer can deactivate their events
- ✅ Registry is immutable (events can't be deleted, only deactivated)
- ✅ Use `is-active` flag to hide events from discovery

---

## 🚀 Deployment

```bash
# Generate deployment wallet
node scripts/generate-deployment-wallet.js

# Deploy Registry V2
clarinet contract publish event-registry-v2 --testnet

# Update frontend config
# Edit src/config/contracts.ts
EVENT_REGISTRY_CONTRACT.testnet.address = 'ST1X7...v2'
```

---

## 📊 Monitoring

```typescript
// Check registry health
const stats = await getPlatformStats();
console.log('Total events:', stats.totalEvents);
console.log('Active events:', stats.activeEvents);
console.log('Verified organizers:', stats.verifiedOrganizers);

// Monitor specific event
const event = await getRegistryEvent(5);
console.log('Active:', event.isActive);
console.log('Verified:', event.isVerified);
console.log('Featured:', event.isFeatured);
```

---

## 📚 Resources

- [Registry V2 Contract](../contracts/intic-smart-contracts/event-registry-v2.clar)
- [Registry Service](../src/services/registryService.ts)
- [Integration Guide](./REGISTRY_V2_INTEGRATION.md)
- [Stacks Docs](https://docs.stacks.co)

---

**Contract:** `ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.event-registry-v2`  
**Network:** Testnet  
**Version:** 2.0
