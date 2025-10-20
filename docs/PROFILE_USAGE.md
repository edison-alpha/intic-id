# Profile System - User Guide

## Overview

INTIC menggunakan sistem profile hybrid yang menggabungkan:
- **Smart Contract** (On-chain) - Username dan IPFS hash
- **IPFS** (Decentralized Storage) - Email, bio, avatar, preferences
- **LocalStorage** (Cache) - Fast access

Smart Contract: `ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.user-profile`

## Cara Menggunakan

### 1. Setup Environment

Pastikan file `.env` memiliki konfigurasi Pinata:

```env
VITE_PINATA_JWT=your-pinata-jwt-token
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

Dapatkan Pinata JWT dari: https://app.pinata.cloud/developers/api-keys

### 2. Buat atau Update Profile

1. Connect wallet Anda
2. Klik **Settings** di menu
3. Isi informasi profile:
   - **Username**: Unique identifier (max 32 karakter, alphanumeric)
   - **Email**: Untuk notifikasi event
   - **Bio**: Deskripsi singkat
   - **Avatar**: Upload gambar atau gunakan default
   - **Preferences**: Theme, language, notifications

4. Klik **Save Changes**

### 3. Proses Penyimpanan

Ketika Anda save profile:

1. **Upload ke IPFS**: Data (email, bio, avatar, preferences) di-upload ke IPFS via Pinata
2. **Smart Contract Transaction**:
   - Jika profile baru: `create-profile` dipanggil
   - Jika update: `update-metadata` atau `update-username` dipanggil
3. **Konfirmasi Wallet**: Approve transaksi di wallet Anda
4. **Cache Update**: Profile di-cache di localStorage untuk akses cepat

### 4. Data Structure

**On-Chain (Smart Contract)**:
```clarity
{
  username: "john-doe",
  ipfs-hash: "QmXxxx...",
  created-at: 12345,
  updated-at: 12346
}
```

**IPFS (Metadata)**:
```json
{
  "email": "john@example.com",
  "bio": "Web3 enthusiast",
  "avatar": "data:image/png;base64,...",
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

## Features

### ✅ Implemented

- [x] Create profile on smart contract
- [x] Update profile metadata (IPFS hash)
- [x] Update username
- [x] IPFS upload via Pinata
- [x] IPFS fetch for profile data
- [x] LocalStorage caching (5 min validity)
- [x] Username uniqueness check
- [x] Profile export (JSON)
- [x] Cache management

### 🔄 Flow

#### First Time User
```
User connects wallet → Default profile loaded
User fills form → Clicks Save
→ Data uploaded to IPFS (gets hash)
→ Smart contract: create-profile(username, ipfsHash)
→ User approves transaction
→ Profile saved on-chain
→ Cache updated
```

#### Existing User Update
```
User loads Settings → Profile fetched from cache/contract/IPFS
User updates fields → Clicks Save
→ New data uploaded to IPFS (new hash)
→ Smart contract: update-metadata(newIpfsHash)
→ If username changed: update-username(newUsername)
→ User approves transaction(s)
→ Profile updated on-chain
→ Cache cleared and refreshed
```

## Smart Contract Functions

### Read-Only Functions

- `get-profile(user: principal)` - Get profile by address
- `get-user-by-username(username: string-ascii)` - Find user by username
- `is-username-available(username: string-ascii)` - Check availability
- `get-total-profiles()` - Total registered profiles

### Public Functions

- `create-profile(username, ipfs-hash)` - Create new profile
- `update-metadata(ipfs-hash)` - Update IPFS hash
- `update-username(new-username)` - Change username

## Technical Details

### Cache Strategy

- Cache duration: 5 minutes
- Cache key: `intic-profile-cache`
- Cache invalidation: Automatic on save, manual via "Delete Profile"

### IPFS Upload

- Provider: Pinata
- Method: `pinJSONToIPFS`
- Metadata naming: `intic-profile-{timestamp}`

### Validation

- Username: 1-32 characters, alphanumeric + hyphen + underscore
- Email: Standard email regex
- Avatar: Max 2MB, image files only
- Uniqueness: Username checked against smart contract

### Error Handling

- IPFS upload failures → Retry or error message
- Transaction cancellation → No state change
- Contract errors → User-friendly messages
- Cache failures → Fallback to contract read

## FAQ

### Q: Apakah profile saya private?
**A**: Username dan IPFS hash adalah public on-chain. Metadata di IPFS juga public, tapi hanya yang tahu hash-nya yang bisa akses.

### Q: Bisakah saya menghapus profile?
**A**: Profile on-chain bersifat permanent. Anda hanya bisa clear local cache.

### Q: Berapa biaya create/update profile?
**A**: Biaya transaction fee Stacks (sekitar 0.00001 STX).

### Q: Bagaimana jika IPFS data hilang?
**A**: Pinata menjamin persistensi. Hash tetap ada on-chain.

### Q: Bisakah orang lain pakai username saya?
**A**: Tidak. Username di-check uniqueness via smart contract.

## Development

### Service Location
- `src/services/profileService.ts` - Main integration service
- `src/pages/Settings.tsx` - UI implementation

### Contract Location
- `public/contracts/user-profile.clar` - Smart contract source

### Testing

1. Connect testnet wallet
2. Ensure you have testnet STX
3. Try create profile with unique username
4. Update profile fields
5. Check data on explorer: https://explorer.hiro.so/

## Troubleshooting

### "Username is already taken"
→ Choose different username

### "Failed to upload to IPFS"
→ Check Pinata JWT in .env

### "Transaction failed"
→ Check STX balance for fees

### Profile not loading
→ Clear cache: Click "Delete Profile" in Data Management section

---

**Contract Address**: `ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.user-profile`

**Network**: Stacks Testnet
