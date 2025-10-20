# 👤 INTIC Profile System - Galxe Style

## Overview

Profile system menggunakan **Galxe-inspired architecture** dengan 3 layer:

```
┌─────────────────────────────────────────────┐
│         INTIC PROFILE ARCHITECTURE          │
├─────────────────────────────────────────────┤
│                                             │
│  Layer 1: SMART CONTRACT (On-Chain)        │
│  ├─ Username (unique identifier)           │
│  ├─ IPFS Hash (pointer to metadata)        │
│  └─ Timestamps (created/updated)           │
│                                             │
│  Layer 2: IPFS (Decentralized Storage)     │
│  ├─ Email                                  │
│  ├─ Bio                                    │
│  ├─ Avatar (image base64/URL)             │
│  └─ Preferences (theme, language, notif)  │
│                                             │
│  Layer 3: LOCALSTORAGE (Cache)             │
│  └─ Fast access without blockchain calls   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📂 File Structure

```
public/contracts/
└── user-profile.clar          # Smart contract

src/services/
├── profileService.simple.ts   # IPFS + Cache management
└── userProfileService.ts      # Current localStorage-based (legacy)
```

---

## 🔧 Smart Contract: `user-profile.clar`

### Functions

#### 1. `create-profile`
Membuat profile baru (sekali saja per wallet).

```clarity
(create-profile
  (username (string-ascii 32))
  (ipfs-hash (string-ascii 64))
)
```

**Example:**
```typescript
// Upload data ke IPFS dulu
const ipfsHash = await uploadToIPFS({
  email: 'user@example.com',
  bio: 'Hello world',
  avatar: 'base64...',
  preferences: {...}
});

// Lalu register on-chain
await openContractCall({
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'user-profile',
  functionName: 'create-profile',
  functionArgs: [
    stringAsciiCV('myusername'),
    stringAsciiCV(ipfsHash)
  ]
});
```

#### 2. `update-metadata`
Update IPFS hash (saat user edit email, bio, avatar, preferences).

```clarity
(update-metadata
  (ipfs-hash (string-ascii 64))
)
```

**Example:**
```typescript
// Upload data baru ke IPFS
const newIpfsHash = await uploadToIPFS(updatedData);

// Update on-chain
await openContractCall({
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'user-profile',
  functionName: 'update-metadata',
  functionArgs: [
    stringAsciiCV(newIpfsHash)
  ]
});
```

#### 3. `update-username`
Update username saja (tanpa upload IPFS).

```clarity
(update-username
  (new-username (string-ascii 32))
)
```

### Read-Only Functions

```clarity
;; Get profile by wallet address
(get-profile (user principal))

;; Get user by username
(get-user-by-username (username (string-ascii 32)))

;; Check if username available
(is-username-available (username (string-ascii 32)))

;; Total registered profiles
(get-total-profiles)
```

---

## 📦 IPFS Metadata Structure

Data yang disimpan di IPFS:

```json
{
  "email": "user@example.com",
  "bio": "Blockchain enthusiast",
  "avatar": "data:image/png;base64,iVBORw0KG...",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications": {
      "email": true,
      "push": true
    }
  }
}
```

---

## 🚀 Usage Flow

### 1. First Time Setup

```typescript
import {
  uploadToIPFS,
  createDefaultProfile
} from '@/services/profileService.simple';

// 1. Prepare data
const profileData = {
  email: 'user@example.com',
  bio: '',
  avatar: generateDefaultAvatar(address),
  preferences: {
    theme: 'dark',
    language: 'en',
    notifications: { email: true, push: true }
  }
};

// 2. Upload to IPFS
const ipfsHash = await uploadToIPFS(profileData);

// 3. Register on-chain
await openContractCall({
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'user-profile',
  functionName: 'create-profile',
  functionArgs: [
    stringAsciiCV('myusername'),
    stringAsciiCV(ipfsHash)
  ],
  onFinish: (data) => {
    console.log('Profile created!', data.txId);
  }
});
```

### 2. Update Profile

```typescript
// 1. Update local data
const updatedData = {
  ...currentProfile,
  bio: 'Updated bio',
  email: 'newemail@example.com'
};

// 2. Upload new version to IPFS
const newIpfsHash = await uploadToIPFS(updatedData);

// 3. Update on-chain
await openContractCall({
  contractAddress: CONTRACT_ADDRESS,
  contractName: 'user-profile',
  functionName: 'update-metadata',
  functionArgs: [
    stringAsciiCV(newIpfsHash)
  ]
});
```

### 3. Load Profile

```typescript
import { getFromCache, fetchFromIPFS } from '@/services/profileService.simple';

async function loadProfile(address: string) {
  // 1. Try cache first (instant)
  let profile = getFromCache(address);
  if (profile) {
    return profile;
  }

  // 2. Fetch from blockchain
  const onChainProfile = await fetch(
    `https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_ADDRESS}/user-profile/get-profile`,
    {
      method: 'POST',
      body: JSON.stringify({
        sender: address,
        arguments: [standardPrincipalCV(address)]
      })
    }
  );

  // 3. Get IPFS hash from blockchain response
  const { ipfsHash } = parseResult(onChainProfile);

  // 4. Fetch metadata from IPFS
  const metadata = await fetchFromIPFS(ipfsHash);

  // 5. Combine and cache
  profile = {
    address,
    username: onChainProfile.username,
    ...metadata
  };

  saveToCache(profile);
  return profile;
}
```

---

## ⚙️ Environment Variables

Add to `.env`:

```env
# Profile Contract (deploy first)
VITE_PROFILE_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Pinata for IPFS (already configured)
VITE_PINATA_JWT=your-pinata-jwt
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

---

## 📋 Deployment Steps

### 1. Deploy Smart Contract

```bash
# Using Clarinet
clarinet integrate

# Or using Hiro Platform
# 1. Go to https://platform.hiro.so
# 2. Upload user-profile.clar
# 3. Deploy to testnet
# 4. Copy contract address
```

### 2. Update .env

```env
VITE_PROFILE_CONTRACT_ADDRESS=ST1234...ABC.user-profile
```

### 3. Test

```typescript
// Test create profile
const result = await openContractCall({
  contractAddress: process.env.VITE_PROFILE_CONTRACT_ADDRESS,
  contractName: 'user-profile',
  functionName: 'create-profile',
  functionArgs: [
    stringAsciiCV('testuser'),
    stringAsciiCV('QmTest123...')
  ]
});

console.log('Profile created:', result);
```

---

## 🎯 Benefits Galxe Approach

### Why This Architecture?

| Feature | Pure LocalStorage | Pure Smart Contract | **Galxe Hybrid** |
|---------|------------------|---------------------|------------------|
| **Cost** | Free | $$$ expensive | $ minimal |
| **Speed** | Instant | Slow (30s) | Fast (cache) |
| **Privacy** | Good | ❌ Public | ✅ Good (IPFS) |
| **Decentralized** | ❌ No | ✅ Yes | ✅ Yes |
| **Data Size** | Limited | Very limited | ✅ Large (IPFS) |
| **Portable** | ❌ No | ✅ Yes | ✅ Yes |
| **Username Unique** | ❌ No | ✅ Yes | ✅ Yes |

### Cost Comparison

```
Pure Smart Contract:
- Create profile: ~$5-10
- Update email: ~$3-5
- Update bio: ~$3-5
- Update avatar: ~$5-10
Total: $16-30 per user 😱

Galxe Hybrid:
- Create profile: ~$2-3 (username on-chain)
- Update anything: ~$1-2 (IPFS hash update)
Total: $3-5 per user ✅
```

---

## 🔒 Security Considerations

1. **Email Privacy**: Email disimpan di IPFS (bukan on-chain public)
2. **IPFS Immutable**: Setiap update create new hash, data lama tetap ada
3. **Username Unique**: Dijamin unique by smart contract
4. **Ownership**: Only wallet owner can update profile

---

## 🐛 Troubleshooting

### Profile tidak muncul setelah create

**Check:**
```typescript
// 1. Verify transaction success
const tx = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
console.log(tx.status); // Should be 'success'

// 2. Check profile on-chain
const profile = await contractCall('get-profile', [userAddress]);
console.log(profile);

// 3. Check IPFS hash accessible
const metadata = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
console.log(metadata);
```

### Username already taken

```typescript
// Check before create
const available = await contractCall('is-username-available', [username]);
if (!available) {
  alert('Username already taken!');
}
```

### IPFS upload failed

```typescript
// Verify Pinata JWT
console.log(import.meta.env.VITE_PINATA_JWT); // Should not be empty

// Check file size
const dataSize = JSON.stringify(profileData).length;
console.log('Data size:', dataSize, 'bytes'); // Should be < 100KB
```

---

## 📚 API Reference

See files:
- Smart Contract: `public/contracts/user-profile.clar`
- Service: `src/services/profileService.simple.ts`
- Types: `src/services/profileService.simple.ts` (interfaces)

---

## 🚀 Future Enhancements

- [ ] Reputation system (like Galxe Points)
- [ ] Profile NFT (optional visual identity)
- [ ] Social connections (followers/following)
- [ ] Achievements & Badges
- [ ] Multi-chain support (BNB, Polygon, etc)

---

**Last Updated:** 2024-01-21
**Status:** ✅ Ready for integration
