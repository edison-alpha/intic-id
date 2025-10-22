# API Keys Testing Documentation

## Overview
This document outlines all API keys used in the Intic application and provides testing procedures for each page under `/app` routes.

## Environment Variables (API Keys)

### Storage & IPFS
- **VITE_PINATA_JWT**: Pinata IPFS JWT token for file uploads and metadata storage
- **VITE_PINATA_API_KEY**: Pinata API key (legacy, JWT preferred)
- **VITE_PINATA_API_SECRET**: Pinata API secret (legacy, JWT preferred)
- **VITE_PINATA_GATEWAY_URL**: Pinata gateway URL (default: https://gateway.pinata.cloud)

### Maps & Location
- **VITE_GOOGLE_MAPS_API_KEY**: Google Maps API key for venue location display

### Wallet & Authentication
- **VITE_TURNKEY_ORGANIZATION_ID**: Turnkey wallet organization ID
- **VITE_TURNKEY_AUTH_PROXY_CONFIG_ID**: Turnkey authentication proxy config ID

### Blockchain & Indexing
- **VITE_HIRO_API_KEY**: Hiro API key for Stacks blockchain data indexing
- **VITE_STACKS_NETWORK**: Stacks network (testnet/mainnet, default: testnet)

### Notifications & Email
- **VITE_WEB3FORMS_KEY**: Web3Forms access key for email notifications

### Deployment
- **VITE_DEPLOYMENT_PRIVATE_KEY**: Deployment wallet private key
- **VITE_DEPLOYMENT_ADDRESS**: Deployment wallet address

## Page-by-Page API Key Usage

### `/app` (BrowseEvents)
**Services Used:**
- `registryService` (getAllRegistryEvents, getFeaturedEvents) - Uses VITE_HIRO_API_KEY
- `nftIndexer` (getEventDataFromContract) - Uses VITE_HIRO_API_KEY

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load events list from registry
2. Display featured events
3. Fetch event data from contracts
4. Handle network errors gracefully

### `/app/portofolio` (Dashboard)
**Services Used:**
- `nftFetcher` (getUserTicketsFromIndexerCached) - Uses VITE_HIRO_API_KEY
- `blockchainData` (fetchUserTransactions, fetchSTXBalance, fetchSBTCBalance, fetchUserRewards) - Uses VITE_STACKS_NETWORK

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load user NFT tickets
2. Fetch STX balance
3. Fetch sBTC balance
4. Display user transactions
5. Show user rewards

### `/app/my-tickets` (MyTickets)
**Services Used:**
- `nftFetcher` (getUserTicketsFromIndexerCached, clearNFTCache) - Uses VITE_HIRO_API_KEY
- `ticketPurchaseNotification` (getStoredEmail, storeEmail) - Uses VITE_WEB3FORMS_KEY

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_WEB3FORMS_KEY (optional for notifications)

**Test Cases:**
1. Load user's ticket collection
2. Clear NFT cache functionality
3. Email notification settings
4. Ticket filtering and search

### `/app/staking` (Staking)
**Services Used:**
- Blockchain interaction services (to be implemented)

**API Keys Required:**
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load staking pools
2. Display staking rewards
3. Handle staking transactions

### `/app/governance` (Governance)
**Services Used:**
- Blockchain governance services (to be implemented)

**API Keys Required:**
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load governance proposals
2. Display voting interface
3. Handle voting transactions

### `/app/create-event` (CreateEventNFT)
**Services Used:**
- `openstreetmap` (searchVenues) - No API key required
- `hiroIndexer` (indexAllContractsByAddress) - Uses VITE_HIRO_API_KEY
- `nftIndexer` (getNFTTicketData, fetchIPFSMetadata) - Uses VITE_HIRO_API_KEY
- `eventRegistryService` (timestampToBlockHeight) - Uses VITE_STACKS_NETWORK
- `pinataService` (uploadImageToPinata) - Uses VITE_PINATA_JWT

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_STACKS_NETWORK
- VITE_PINATA_JWT
- VITE_GOOGLE_MAPS_API_KEY (for map display)

**Test Cases:**
1. Venue search functionality
2. Image upload to IPFS
3. Contract indexing
4. Event creation form validation
5. Google Maps integration

### `/app/event/:id` (EventDetail)
**Services Used:**
- `nftIndexer` (getEventDataFromContract) - Uses VITE_HIRO_API_KEY
- `registryService` (getRegistryEvent) - Uses VITE_HIRO_API_KEY

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load event details from contract
2. Display event metadata
3. Handle event not found
4. Purchase ticket functionality

### `/app/ticket/:id` (TicketDetail)
**Services Used:**
- `ticketDetailService` (getTicketDetail) - Uses VITE_HIRO_API_KEY

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load ticket metadata
2. Display ticket information
3. QR code generation
4. Transfer ticket functionality

### `/app/profile` (Profile)
**Services Used:**
- `profileService` (updateProfile, uploadAvatar) - Uses VITE_PINATA_JWT

**API Keys Required:**
- VITE_PINATA_JWT
- VITE_STACKS_NETWORK

**Test Cases:**
1. Profile data loading
2. Avatar upload to IPFS
3. Profile update functionality
4. Display user information

### `/app/settings` (Settings)
**Services Used:**
- `ticketPurchaseNotification` (getStoredEmail, storeEmail) - Uses VITE_WEB3FORMS_KEY

**API Keys Required:**
- VITE_WEB3FORMS_KEY (optional)

**Test Cases:**
1. Email notification settings
2. User preferences
3. Account settings

### `/app/check-in` (AttendeeCheckIn)
**Services Used:**
- `nftFetcher` (getUserTicketsFromIndexerCached) - Uses VITE_HIRO_API_KEY

**API Keys Required:**
- VITE_HIRO_API_KEY
- VITE_STACKS_NETWORK

**Test Cases:**
1. Load user tickets for check-in
2. QR code scanning
3. Check-in validation
4. Event verification

### `/app/event/:contractId/:eventId/checkin-point` (EventCheckInPoint)
**Services Used:**
- `ticketCheckInService` (generateCheckInPointQR) - Uses VITE_STACKS_NETWORK

**API Keys Required:**
- VITE_STACKS_NETWORK

**Test Cases:**
1. Generate check-in QR code
2. Display check-in point interface
3. Validate ticket check-ins

## API Endpoints Testing

### Hiro API Endpoints

#### Registry Contract Read-Only Functions
**Endpoint:** `POST https://api.testnet.hiro.so/v2/contracts/call-read/{address}/{name}/{function}`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Example (get-total-events):**
```json
{
  "sender": "ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW",
  "arguments": []
}
```

**Response Example:**
```json
{
  "okay": true,
  "result": "0x0100000000000000000000000000000001"
}
```

**Request Body Example (get-event):**
```json
{
  "sender": "ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW",
  "arguments": ["0x0100000000000000000000000000000001"]
}
```

#### NFT Holdings Query
**Endpoint:** `GET https://api.testnet.hiro.so/extended/v1/tokens/nft/holdings?principal={address}&limit=200`

**Headers:**
```json
{
  "x-hiro-api-key": "your_hiro_api_key"
}
```

**Response Example:**
```json
{
  "results": [
    {
      "asset_identifier": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.contract-name::nft-ticket",
      "value": {
        "hex": "0x0100000000000000000000000000000001",
        "repr": "u1"
      },
      "block_height": 12345,
      "tx_id": "0x1234567890abcdef..."
    }
  ]
}
```

#### NFT Events Query
**Endpoint:** `GET https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier={contract}::nft-ticket&limit=100`

**Headers:**
```json
{
  "x-hiro-api-key": "your_hiro_api_key"
}
```

**Response Example:**
```json
{
  "results": [
    {
      "tx_id": "0x1234567890abcdef...",
      "asset_identifier": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.contract-name::nft-ticket",
      "value": {
        "repr": "u1"
      },
      "recipient": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C",
      "block_height": 12345,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### User Transactions Query
**Endpoint:** `GET https://api.testnet.hiro.so/extended/v1/address/{address}/transactions?limit=50`

**Response Example:**
```json
{
  "results": [
    {
      "tx_id": "0x1234567890abcdef...",
      "tx_type": "contract_call",
      "tx_status": "success",
      "contract_call": {
        "function_name": "mint-ticket"
      },
      "events": [
        {
          "event_type": "non_fungible_token_asset",
          "asset": {
            "asset_event_type": "mint",
            "value": {
              "repr": "u1"
            }
          }
        }
      ]
    }
  ]
}
```

#### STX Balance Query
**Endpoint:** `GET https://api.testnet.hiro.so/extended/v1/address/{address}/balances`

**Response Example:**
```json
{
  "stx": {
    "balance": "1000000000",
    "total_sent": "500000000",
    "total_received": "1500000000"
  }
}
```

### Pinata IPFS Endpoints

#### Upload Image
**Endpoint:** `POST https://api.pinata.cloud/pinning/pinFileToIPFS`

**Headers:**
```json
{
  "Authorization": "Bearer your_pinata_jwt"
}
```

**Request Body:** FormData with file and metadata

**Response Example:**
```json
{
  "IpfsHash": "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7",
  "PinSize": 123456,
  "Timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Upload Metadata JSON
**Endpoint:** `POST https://api.pinata.cloud/pinning/pinJSONToIPFS`

**Headers:**
```json
{
  "Authorization": "Bearer your_pinata_jwt",
  "Content-Type": "application/json"
}
```

**Request Body Example:**
```json
{
  "pinataContent": {
    "name": "Summer Fest 2025",
    "description": "NFT Event Ticket",
    "image": "ipfs://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7",
    "attributes": [
      {
        "trait_type": "Event Name",
        "value": "Summer Fest 2025"
      }
    ]
  },
  "pinataMetadata": {
    "name": "event-metadata"
  }
}
```

#### Authentication Test
**Endpoint:** `GET https://api.pinata.cloud/data/testAuthentication`

**Headers:**
```json
{
  "Authorization": "Bearer your_pinata_jwt"
}
```

**Response Example:**
```json
{
  "message": "Congratulations! You are communicating with the Pinata API!"
}
```

### Google Maps API Endpoints

#### Place Details
**Endpoint:** `GET https://www.google.com/maps/embed/v1/place?key={api_key}&q={lat},{lon}&zoom=15`

**Response:** HTML embed iframe

### Web3Forms Endpoints

#### Email Submission
**Endpoint:** `POST https://api.web3forms.com/submit`

**Request Body Example:**
```json
{
  "access_key": "your_web3forms_key",
  "subject": "Ticket Purchase Notification",
  "from_name": "Intic Platform",
  "message": "Your ticket has been purchased successfully..."
}
```

## Page-Specific API Testing

### BrowseEvents Page Testing
```javascript
// Test registry events loading
describe('BrowseEvents - Registry API', () => {
  test('fetches all events from registry', async () => {
    const response = await fetch('https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/event-registry-v2/get-total-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW', arguments: [] })
    });
    expect(response.ok).toBe(true);
  });

  test('loads event data from contracts', async () => {
    // Test getEventDataFromContract function
    const eventData = await getEventDataFromContract('ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.contract-name');
    expect(eventData).toHaveProperty('eventName');
  });
});
```

### Dashboard Page Testing
```javascript
// Test user NFT holdings
describe('Dashboard - NFT Holdings', () => {
  test('fetches user NFT tickets', async () => {
    const response = await fetch('https://api.testnet.hiro.so/extended/v1/tokens/nft/holdings?principal=ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C&limit=200', {
      headers: { 'x-hiro-api-key': process.env.VITE_HIRO_API_KEY }
    });
    expect(response.ok).toBe(true);
  });

  test('fetches STX balance', async () => {
    const response = await fetch('https://api.testnet.hiro.so/extended/v1/address/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/balances');
    expect(response.ok).toBe(true);
  });
});
```

### CreateEventNFT Page Testing
```javascript
// Test image upload to Pinata
describe('CreateEventNFT - Pinata Upload', () => {
  test('uploads image successfully', async () => {
    const formData = new FormData();
    formData.append('file', testImageFile);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.VITE_PINATA_JWT}` },
      body: formData
    });
    expect(response.ok).toBe(true);
  });

  test('uploads metadata successfully', async () => {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.VITE_PINATA_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pinataContent: testMetadata,
        pinataMetadata: { name: 'event-metadata' }
      })
    });
    expect(response.ok).toBe(true);
  });
});
```

### MyTickets Page Testing
```javascript
// Test ticket fetching with caching
describe('MyTickets - NFT Fetcher', () => {
  test('fetches user tickets from indexer', async () => {
    const tickets = await getUserTicketsFromIndexerCached('ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C');
    expect(Array.isArray(tickets)).toBe(true);
  });

  test('clears cache correctly', () => {
    clearNFTCache('ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C');
    // Verify cache is cleared
  });
});
```

### Profile Page Testing
```javascript
// Test profile avatar upload
describe('Profile - Avatar Upload', () => {
  test('uploads avatar to IPFS', async () => {
    const ipfsUrl = await uploadImageToPinata(avatarFile);
    expect(ipfsUrl).toMatch(/^ipfs:\/\/.+/);
  });

  test('updates profile with IPFS URL', async () => {
    // Test profile update with avatar URL
  });
});
```

### Settings Page Testing
```javascript
// Test email notification settings
describe('Settings - Email Notifications', () => {
  test('saves email preference', () => {
    storeEmail('user@example.com');
    const savedEmail = getStoredEmail();
    expect(savedEmail).toBe('user@example.com');
  });

  test('sends notification via Web3Forms', async () => {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: JSON.stringify({
        access_key: process.env.VITE_WEB3FORMS_KEY,
        subject: 'Test Notification',
        message: 'Test message'
      })
    });
    expect(response.ok).toBe(true);
  });
});
```

## Automated Testing Implementation

### Test File Structure
```
tests/
├── api/
│   ├── hiro-api.test.ts
│   ├── pinata-api.test.ts
│   ├── google-maps-api.test.ts
│   └── web3forms-api.test.ts
├── pages/
│   ├── BrowseEvents.test.tsx
│   ├── Dashboard.test.tsx
│   ├── MyTickets.test.tsx
│   ├── CreateEventNFT.test.tsx
│   ├── EventDetail.test.tsx
│   ├── Profile.test.tsx
│   └── Settings.test.tsx
└── integration/
    ├── user-journey.test.ts
    └── api-connectivity.test.ts
```

### Hiro API Test Implementation
```typescript
// tests/api/hiro-api.test.ts
import { describe, test, expect, beforeAll } from 'vitest';

describe('Hiro API Integration', () => {
  const HIRO_API_KEY = process.env.VITE_HIRO_API_KEY;
  const TEST_ADDRESS = 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C';

  test('has valid API key', () => {
    expect(HIRO_API_KEY).toBeDefined();
    expect(HIRO_API_KEY?.length).toBeGreaterThan(10);
  });

  test('fetches NFT holdings', async () => {
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/tokens/nft/holdings?principal=${TEST_ADDRESS}&limit=10`,
      {
        headers: { 'x-hiro-api-key': HIRO_API_KEY! }
      }
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('fetches STX balance', async () => {
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${TEST_ADDRESS}/balances`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('stx');
    expect(data.stx).toHaveProperty('balance');
  });

  test('handles invalid API key', async () => {
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/tokens/nft/holdings?principal=${TEST_ADDRESS}&limit=10`,
      {
        headers: { 'x-hiro-api-key': 'invalid-key' }
      }
    );

    expect(response.status).toBe(401);
  });
});
```

### Pinata API Test Implementation
```typescript
// tests/api/pinata-api.test.ts
import { describe, test, expect } from 'vitest';
import { testPinataConnection, uploadImageToPinata } from '@/services/pinataService';

describe('Pinata API Integration', () => {
  const PINATA_JWT = process.env.VITE_PINATA_JWT;

  test('has valid JWT', () => {
    expect(PINATA_JWT).toBeDefined();
    expect(PINATA_JWT?.length).toBeGreaterThan(50);
  });

  test('tests connection', async () => {
    const isConnected = await testPinataConnection();
    expect(isConnected).toBe(true);
  });

  test('uploads test image', async () => {
    // Create a small test image (1x1 pixel PNG)
    const testImageBlob = new Blob([
      new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // rest of IHDR
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT
        0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // image data
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ])
    ], { type: 'image/png' });

    const testFile = new File([testImageBlob], 'test.png', { type: 'image/png' });
    
    const ipfsUrl = await uploadImageToPinata(testFile);
    expect(ipfsUrl).toMatch(/^https:\/\/gateway\.pinata\.cloud\/ipfs\//);
  });

  test('handles invalid JWT', async () => {
    // Temporarily set invalid JWT
    const originalJwt = process.env.VITE_PINATA_JWT;
    process.env.VITE_PINATA_JWT = 'invalid-jwt';

    try {
      await expect(testPinataConnection()).rejects.toThrow();
    } finally {
      process.env.VITE_PINATA_JWT = originalJwt;
    }
  });
});
```

### Page Component Test Implementation
```typescript
// tests/pages/BrowseEvents.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BrowseEvents from '@/pages/BrowseEvents';
import { getAllRegistryEvents } from '@/services/registryService';

// Mock the services
vi.mock('@/services/registryService');
vi.mock('@/services/nftIndexer');

describe('BrowseEvents Page', () => {
  test('loads and displays events', async () => {
    // Mock successful API responses
    const mockEvents = [
      {
        eventId: 1,
        contractAddress: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C',
        contractName: 'test-event',
        isActive: true,
        isFeatured: true
      }
    ];

    (getAllRegistryEvents as any).mockResolvedValue(mockEvents);

    render(<BrowseEvents />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check if events are displayed
    expect(screen.getByText('test-event')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock API failure
    (getAllRegistryEvents as any).mockRejectedValue(new Error('API Error'));

    render(<BrowseEvents />);

    await waitFor(() => {
      expect(screen.getByText('No events found')).toBeInTheDocument();
    });
  });

  test('filters events by category', async () => {
    const mockEvents = [
      {
        eventId: 1,
        contractAddress: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C',
        contractName: 'concert-event',
        isActive: true,
        category: 'concert'
      },
      {
        eventId: 2,
        contractAddress: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C',
        contractName: 'sports-event',
        isActive: true,
        category: 'sports'
      }
    ];

    (getAllRegistryEvents as any).mockResolvedValue(mockEvents);

    render(<BrowseEvents />);

    await waitFor(() => {
      expect(screen.getByText('concert-event')).toBeInTheDocument();
    });

    // Click sports filter
    const sportsFilter = screen.getByText('Sports');
    sportsFilter.click();

    expect(screen.getByText('sports-event')).toBeInTheDocument();
    expect(screen.queryByText('concert-event')).not.toBeInTheDocument();
  });
});
```

### Integration Test Implementation
```typescript
// tests/integration/user-journey.test.ts
import { describe, test, expect } from 'vitest';
import { getUserTicketsFromIndexerCached } from '@/services/nftFetcher';
import { fetchSTXBalance } from '@/services/blockchainData';

describe('User Journey Integration', () => {
  const TEST_USER = 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C';

  test('complete user ticket flow', async () => {
    // 1. Check user has STX balance
    const balance = await fetchSTXBalance(TEST_USER);
    expect(typeof balance).toBe('number');
    expect(balance).toBeGreaterThanOrEqual(0);

    // 2. Fetch user tickets
    const tickets = await getUserTicketsFromIndexerCached(TEST_USER);
    expect(Array.isArray(tickets)).toBe(true);

    // 3. Verify ticket structure
    if (tickets.length > 0) {
      const ticket = tickets[0];
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('eventName');
      expect(ticket).toHaveProperty('contractAddress');
      expect(ticket).toHaveProperty('tokenId');
    }
  });

  test('handles network failures', async () => {
    // Mock network failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    try {
      await getUserTicketsFromIndexerCached(TEST_USER);
    } catch (error) {
      expect(error.message).toContain('Network Error');
    }
  });
});
```

## Test Commands & Scripts

### Package.json Test Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:api": "vitest tests/api/",
    "test:pages": "vitest tests/pages/",
    "test:integration": "vitest tests/integration/",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=json"
  }
}
```

### Environment Setup for Testing
```bash
# .env.test
VITE_HIRO_API_KEY=test_hiro_api_key
VITE_PINATA_JWT=test_pinata_jwt
VITE_GOOGLE_MAPS_API_KEY=test_google_maps_key
VITE_WEB3FORMS_KEY=test_web3forms_key
VITE_STACKS_NETWORK=testnet
```

### Mock Data Setup
```typescript
// tests/mocks/api-responses.ts
export const mockHiroResponses = {
  nftHoldings: {
    results: [
      {
        asset_identifier: 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.test-event::nft-ticket',
        value: { repr: 'u1' },
        block_height: 12345,
        tx_id: '0x1234567890abcdef'
      }
    ]
  },
  stxBalance: {
    stx: {
      balance: '1000000000',
      total_sent: '500000000',
      total_received: '1500000000'
    }
  }
};

export const mockPinataResponses = {
  uploadSuccess: {
    IpfsHash: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7',
    PinSize: 123456,
    Timestamp: '2024-01-15T10:30:00.000Z'
  },
  authSuccess: {
    message: 'Congratulations! You are communicating with the Pinata API!'
  }
};
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/api-tests.yml
name: API Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test environment
      run: |
        echo "VITE_HIRO_API_KEY=${{ secrets.HIRO_API_KEY }}" >> .env.test
        echo "VITE_PINATA_JWT=${{ secrets.PINATA_JWT }}" >> .env.test
        echo "VITE_GOOGLE_MAPS_API_KEY=${{ secrets.GOOGLE_MAPS_API_KEY }}" >> .env.test
        echo "VITE_WEB3FORMS_KEY=${{ secrets.WEB3FORMS_KEY }}" >> .env.test
        echo "VITE_STACKS_NETWORK=testnet" >> .env.test
    
    - name: Run API tests
      run: npm run test:api
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Test Results Dashboard
```typescript
// scripts/generate-test-report.js
const fs = require('fs');
const path = require('path');

function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      coverage: 0
    },
    apiTests: {
      hiro: { status: 'unknown', responseTime: 0 },
      pinata: { status: 'unknown', responseTime: 0 },
      googleMaps: { status: 'unknown', responseTime: 0 },
      web3forms: { status: 'unknown', responseTime: 0 }
    },
    pageTests: {},
    recommendations: []
  };

  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync('test-report.html', htmlReport);
  
  console.log('Test report generated: test-report.html');
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>API Testing Report - Intic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status-pass { color: green; }
        .status-fail { color: red; }
        .status-unknown { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Intic API Testing Report</h1>
    <p>Generated: ${report.timestamp}</p>
    
    <h2>Summary</h2>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Tests</td><td>${report.summary.totalTests}</td></tr>
        <tr><td>Passed</td><td class="status-pass">${report.summary.passed}</td></tr>
        <tr><td>Failed</td><td class="status-fail">${report.summary.failed}</td></tr>
        <tr><td>Coverage</td><td>${report.summary.coverage}%</td></tr>
    </table>
    
    <h2>API Status</h2>
    <table>
        <tr><th>API</th><th>Status</th><th>Response Time</th></tr>
        ${Object.entries(report.apiTests).map(([api, status]) => 
          `<tr>
            <td>${api}</td>
            <td class="status-${status.status}">${status.status}</td>
            <td>${status.responseTime}ms</td>
          </tr>`
        ).join('')}
    </table>
</body>
</html>`;
}

generateTestReport();
```

## Testing Procedures

### 1. Environment Setup
Create a `.env` file with all required API keys:

```bash
# Storage & IPFS
VITE_PINATA_JWT=your_pinata_jwt_here
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_API_SECRET=your_pinata_api_secret
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud

# Maps & Location
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Wallet & Authentication
VITE_TURNKEY_ORGANIZATION_ID=your_turnkey_org_id
VITE_TURNKEY_AUTH_PROXY_CONFIG_ID=your_turnkey_auth_config_id

# Blockchain & Indexing
VITE_HIRO_API_KEY=your_hiro_api_key
VITE_STACKS_NETWORK=testnet

# Notifications & Email
VITE_WEB3FORMS_KEY=your_web3forms_key

# Deployment
VITE_DEPLOYMENT_PRIVATE_KEY=your_deployment_private_key
VITE_DEPLOYMENT_ADDRESS=your_deployment_address
```

### 2. API Key Validation Tests

#### Pinata IPFS Test
- Navigate to `/test-pinata`
- Test connection status
- Upload a test image
- Verify IPFS URL generation

#### Hiro API Test
- Check event loading on `/app`
- Verify NFT data fetching
- Test indexer queries

#### Google Maps Test
- Create new event at `/app/create-event`
- Search for venues
- Verify map display

#### Web3Forms Test
- Go to `/app/settings`
- Configure email notifications
- Test email sending

### 3. Page-Specific Test Checklist

For each page, verify:
- [ ] Page loads without errors
- [ ] API calls succeed
- [ ] Data displays correctly
- [ ] Error states handled gracefully
- [ ] Loading states work properly
- [ ] Network failures don't crash the app

### 4. Common Issues & Troubleshooting

#### Missing API Keys
- Check browser console for missing environment variable warnings
- Verify `.env` file is in project root
- Restart development server after adding new keys

#### Network Issues
- Verify internet connection
- Check API service status
- Test with different network configurations

#### CORS Errors
- Ensure API keys have correct permissions
- Check referrer restrictions on API keys
- Use HTTPS in production

#### Rate Limiting
- Monitor API usage
- Implement caching where appropriate
- Handle rate limit errors gracefully

## TestSprite Integration

### Test Case Format
```javascript
// Example test case for BrowseEvents page
describe('BrowseEvents API Integration', () => {
  test('loads events from registry', async () => {
    // Test implementation
  });

  test('handles missing HIRO API key', async () => {
    // Test error handling
  });
});
```

### Automated Test Commands
```bash
# Run all API tests
npm run test:api

# Run specific page tests
npm run test:pages

# Run integration tests
npm run test:integration
```

### CI/CD Integration
- Add API key validation to build pipeline
- Include API connectivity tests in deployment checks
- Monitor API key expiration dates

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment-specific keys
- Rotate keys regularly
- Monitor API usage for anomalies

### Error Handling
- Don't expose API keys in error messages
- Implement proper error boundaries
- Log errors securely without sensitive data

### Production Deployment
- Use production-specific API keys
- Enable API key restrictions
- Implement rate limiting
- Monitor for security vulnerabilities</content>
<parameter name="filePath">d:\BAHAN PROJECT\intic\API_KEYS_TESTING.md