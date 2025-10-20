# Testing My Tickets Page - Quick Guide

## Overview
Halaman My Tickets menampilkan NFT tickets yang dimiliki user dari blockchain. Dokumen ini menjelaskan cara testing fitur tersebut.

## Prerequisites
1. Development server running (`npm run dev`)
2. Browser dengan developer console terbuka (F12)
3. Stacks wallet terinstall atau menggunakan WalletConnect

## Cara Kerja Data Flow

```
User Wallet Connected
    ↓
getUserNFTTickets(userAddress)
    ↓
1. Check Registry Contract (blockchain)
2. Check localStorage (fallback/demo)
    ↓
For each contract found:
  - Call get-last-token-id
  - Call get-owner for each token
  - Filter tokens owned by user
  - Get event details from contract
    ↓
Display Tickets
```

## Debugging - Console Logs

Buka browser console (F12 → Console tab) untuk melihat detailed logs:

### Expected Log Flow
```javascript
🎫 [UserTickets] Fetching tickets for: ST1XXX...
📦 Found N registered events from registry
💾 Found M contracts from localStorage
📊 Total contracts to check: X
  ✅ User owns Y tickets from contract-name
✅ [UserTickets] Total tickets found: Z
✅ [MyTickets] Loaded Z tickets in XXXms
```

### Common Issues & Logs

#### No Tickets Found
```javascript
⚠️ [MyTickets] No tickets found for this user
```
**Reasons:**
- User belum membeli ticket (tidak memiliki NFT)
- Registry contract kosong
- Contract belum deploy tickets

#### No Contracts Found
```javascript
⚠️ No contracts found in registry or localStorage
```
**Reasons:**
- Registry contract belum ada events registered
- Tidak ada deployed contracts di localStorage
- Network issue

#### Ownership Check Failed
```javascript
⚠️ Error checking token ownership
```
**Reasons:**
- Contract function `get-owner` tidak exist
- Network timeout
- Invalid contract address

## Testing Scenarios

### Scenario 1: User Dengan Tickets (Ideal Case)

**Setup:**
1. Deploy event contract dengan Create Event
2. Mint ticket (purchase ticket)
3. Go to My Tickets page

**Expected Result:**
- Loading spinner appears
- Toast: "Found N ticket(s)"
- Tickets displayed with:
  - Event image
  - Event name, date, time
  - Location
  - QR code button
  - Calendar button
  - Ticket status

**Console Logs:**
```javascript
📋 [MyTickets] Loading tickets for user: ST1XXX...
📦 Found 1 registered events from registry
📊 Total contracts to check: 1
✅ User owns 1 tickets from event-name
✅ [UserTickets] Total tickets found: 1
✅ [MyTickets] Loaded 1 tickets in 2500ms
```

### Scenario 2: User Tanpa Tickets (Empty State)

**Setup:**
1. Connect wallet yang belum pernah beli ticket
2. Go to My Tickets page

**Expected Result:**
- Loading spinner appears
- Toast: "No tickets found"
- Empty state message:
  - Icon QR code
  - "No tickets found"
  - Helpful tips
  - "Browse Events" button

**Console Logs:**
```javascript
📋 [MyTickets] Loading tickets for user: ST1XXX...
📦 Found 0 registered events from registry
⚠️ No contracts found in registry or localStorage
⚠️ [MyTickets] No tickets found for this user
```

### Scenario 3: Registry Kosong + localStorage Fallback

**Setup:**
1. Registry contract belum ada events
2. Ada deployed contracts di localStorage
3. Connect wallet

**Expected Result:**
- System checks localStorage
- Finds deployed contracts
- Checks ownership on those contracts
- Displays tickets if any owned

**Console Logs:**
```javascript
📦 Found 0 registered events from registry
💾 Found 2 contracts from localStorage
➕ Adding contract from localStorage: ST1XXX.summer-fest-2025
📊 Total contracts to check: 2
```

### Scenario 4: Network Error

**Setup:**
1. Disconnect internet or block API calls
2. Try loading tickets

**Expected Result:**
- Toast error: "Failed to load tickets"
- Error message with description
- Empty state

**Console Logs:**
```javascript
❌ [UserTickets] Error fetching user tickets: Network error
❌ [MyTickets] Error loading tickets: [Error details]
```

## Manual Testing Steps

### Step 1: Check Wallet Connection
```javascript
// In browser console
console.log(wallet?.address)
// Should show: "ST1XXX..."
```

### Step 2: Check Registry
```javascript
// Test registry contract
import { getAllRegistryEvents } from './services/registryService'
const events = await getAllRegistryEvents()
console.log('Registry events:', events)
```

### Step 3: Check localStorage
```javascript
// Check deployed contracts
const key = `deployed-contracts-${wallet.address}`
const contracts = JSON.parse(localStorage.getItem(key) || '[]')
console.log('localStorage contracts:', contracts)
```

### Step 4: Manual Contract Check
```javascript
// Check if user owns tokens from a specific contract
import { callReadOnlyFunction, uintCV } from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'

const network = new StacksTestnet()
const result = await callReadOnlyFunction({
  contractAddress: 'ST1XXX',
  contractName: 'event-name',
  functionName: 'get-owner',
  functionArgs: [uintCV(1)], // Token ID 1
  senderAddress: 'ST1XXX',
  network
})
console.log('Owner:', cvToValue(result))
```

## Troubleshooting

### Issue: "No tickets found" but I bought tickets

**Check:**
1. Wallet address benar?
   ```javascript
   console.log(wallet?.address)
   ```

2. Transaction berhasil di blockchain?
   - Cek di Stacks Explorer: https://explorer.hiro.so/txid/0x...
   - Status harus "Success"

3. Contract terdaftar di registry?
   ```javascript
   const events = await getAllRegistryEvents()
   console.log('Registered:', events)
   ```

4. Ownership tercatat di contract?
   ```javascript
   // Call get-owner directly (see Step 4 above)
   ```

**Solution:**
- Wait for blockchain confirmation (30-60 seconds)
- Click Refresh button
- Clear cache: `clearTicketCache(wallet.address)`

### Issue: Infinite loading

**Check:**
1. Network request stuck?
   - Open Network tab di DevTools
   - Look for pending requests

2. Contract read failing?
   - Check console for errors
   - Verify contract exists on blockchain

**Solution:**
- Refresh page
- Check network connection
- Verify contract addresses in config

### Issue: Wrong tickets showing

**Check:**
1. Cache issue?
   ```javascript
   // Clear cache
   import { clearTicketCache } from './services/userTickets'
   clearTicketCache()
   ```

2. Wrong wallet?
   ```javascript
   console.log('Connected:', wallet?.address)
   console.log('Expected:', 'ST1XXX...')
   ```

**Solution:**
- Disconnect and reconnect wallet
- Clear cache and refresh

## Email Reminder Testing

### Test Email Setup
1. Click Bell/Mail icon
2. Enter email: `test@example.com`
3. Click "Save & Enable"

**Expected:**
- Toast: "Email reminders enabled for N upcoming events"
- Banner appears showing active reminders
- Email stored in localStorage

**Check:**
```javascript
console.log(localStorage.getItem('user-email'))
// Should show: "test@example.com"
```

### Test Send Reminder
1. Have upcoming event (within 7 days)
2. Email configured
3. System checks automatically

**Note:** Actual email sending requires Web3Forms API key in `.env`

## Calendar Integration Testing

### Test Calendar Export
1. Click Calendar icon on any ticket
2. Choose platform:
   - Google Calendar → Opens Google Calendar
   - Outlook Calendar → Opens Outlook
   - Download .ics → Downloads file

**Expected:**
- Modal appears with platform options
- Clicking opens new tab or downloads file
- Event details included:
  - Event name
  - Date & time
  - Location
  - Description
  - Reminders (1 hour, 1 day before)

**Check:**
- Open downloaded .ics file
- Verify all details correct
- Import to calendar app

## Performance Benchmarks

### Normal Load Times
- Registry check: 200-500ms
- localStorage check: <50ms
- Per contract ownership check: 500-1500ms
- Total (3 contracts): 2-5 seconds
- Total (10 contracts): 5-15 seconds

### Optimization
- Cache enabled: <100ms (cached)
- Parallel processing: 3 contracts at once
- Batch size: 3 contracts per batch

## API Rate Limiting

### Hiro API
- Free tier: ~10 requests/second
- If hitting limits: Add delays between requests

### Web3Forms
- Free tier: 250 emails/month
- No rate limits per se

## Environment Variables

Required for full functionality:

```env
# For blockchain data
VITE_HIRO_API_KEY=your_key
VITE_NETWORK=testnet
VITE_REGISTRY_CONTRACT_ADDRESS=ST1XXX.event-registry-v2

# For email reminders
VITE_WEB3FORMS_KEY=your_key
```

## Success Criteria

✅ **Working correctly if:**
1. Tickets load from blockchain
2. Loading time < 10 seconds
3. Correct tickets for wallet address
4. Email reminder setup works
5. Calendar export works
6. QR codes display correctly
7. No console errors
8. Empty state shows when no tickets
9. localStorage fallback works
10. Refresh updates data

## Support

If issues persist:
1. Check browser console for errors
2. Verify wallet connection
3. Check network status
4. Clear browser cache
5. Try different wallet
6. Check contract on blockchain explorer

## Development Mode Tips

```javascript
// Force reload tickets
import { clearTicketCache, getUserNFTTickets } from './services/userTickets'
clearTicketCache(wallet.address)
const tickets = await getUserNFTTickets(wallet.address)
console.log('Fresh tickets:', tickets)

// Mock tickets for UI testing
const mockTickets = [{
  id: 'mock-1',
  tokenId: 1,
  eventName: 'Test Event',
  eventDate: 'Dec 25, 2025',
  eventTime: '7:00 PM',
  location: 'Test Venue',
  image: '/background-section1.png',
  ticketNumber: '#TKT-000001',
  contractAddress: 'ST1XXX',
  contractName: 'test-event',
  contractId: 'ST1XXX.test-event',
  status: 'active',
  quantity: 1,
  category: 'VIP',
  price: '10 STX'
}]
setTickets(mockTickets) // In React component
```

## Next Steps

After testing:
1. Deploy real event contract
2. Register in event registry
3. Mint actual tickets
4. Test full flow end-to-end
5. Set up email reminders
6. Export to personal calendar
