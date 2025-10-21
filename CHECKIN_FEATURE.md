# Fitur Check-In Ticket

## Overview

Fitur check-in memungkinkan attendee untuk melakukan check-in ke event dengan scan QR code yang ditampilkan oleh Event Organizer (EO). Semua check-in direkam on-chain menggunakan smart contract.

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    EVENT ORGANIZER (EO)                       │
│                                                               │
│  1. Deploy Event Contract (CreateEventNFT.tsx)               │
│     ├─ Smart contract deployed to blockchain                 │
│     └─ Contains use-ticket function                          │
│                                                               │
│  2. Navigate to Check-In Point Page                          │
│     └─ /app/event/{contractId}/{eventId}/checkin-point      │
│                                                               │
│  3. Display QR Code at Event Entrance                        │
│     ├─ QR Data: checkin:CONTRACT_ADDRESS.CONTRACT_NAME       │
│     └─ Can download or show on screen                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       ATTENDEE FLOW                           │
│                                                               │
│  1. Arrive at Event Venue                                    │
│     └─ Has ticket NFT in wallet                              │
│                                                               │
│  2. Open App → Click "Check-In" Menu                         │
│     └─ Navigate to /app/check-in                            │
│                                                               │
│  3. Scan QR Code from EO                                     │
│     ├─ Camera opens                                          │
│     ├─ Scan QR: checkin:CONTRACT_ADDRESS.CONTRACT_NAME       │
│     └─ App parses contract info                              │
│                                                               │
│  4. App Auto-Detects User's Tickets                          │
│     ├─ Query blockchain for user's NFTs                      │
│     ├─ Filter tickets for this event contract                │
│     └─ Show list of valid tickets                            │
│                                                               │
│  5. Select Ticket to Check-In                                │
│     └─ Choose from available tickets                         │
│                                                               │
│  6. Confirm Check-In → Approve Transaction                   │
│     ├─ Call: contract.use-ticket(tokenId)                    │
│     ├─ Tx signed with user's private key                     │
│     └─ Tx-sender = attendee wallet address                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   SMART CONTRACT (ON-CHAIN)                   │
│                                                               │
│  use-ticket(token-id)                                        │
│     │                                                         │
│     ├─ 1. Get NFT owner                                      │
│     │    owner = nft-get-owner?(token-id)                    │
│     │                                                         │
│     ├─ 2. Verify caller is owner                             │
│     │    assert! tx-sender == owner                          │
│     │                                                         │
│     ├─ 3. Check not already used                             │
│     │    assert! ticket-used[token-id] == false              │
│     │                                                         │
│     └─ 4. Mark as used                                       │
│          ticket-used[token-id] = true                        │
│                                                               │
│  Result: (ok true) ✅                                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      SUCCESS STATE                            │
│                                                               │
│  ✅ Ticket marked as "used" on blockchain                    │
│  ✅ Transaction recorded permanently                          │
│  ✅ Check-in complete                                        │
│  ✅ Attendee can enter event                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Komponen Utama

### 1. Event Check-In Point (untuk EO)
**Path**: `/app/event/:contractId/:eventId/checkin-point`
**File**: `src/pages/EventCheckInPoint.tsx`

**Fungsi**:
- Generate dan tampilkan QR code untuk check-in point
- QR code berisi: `checkin:CONTRACT_ADDRESS.CONTRACT_NAME:EVENT_ID`
- Download QR code untuk dicetak
- Instruksi untuk attendee

**Cara Akses**:
```typescript
// Navigate to check-in point
navigate(`/app/event/${contractAddress}.${contractName}/${eventId}/checkin-point`);
```

### 2. Attendee Check-In (untuk Attendee)
**Path**: `/app/check-in`
**File**: `src/pages/AttendeeCheckIn.tsx`

**Flow**:
1. Attendee klik "Check-In" di menu navigasi
2. Scan QR code yang ditampilkan EO
3. App otomatis load tickets attendee untuk event tersebut
4. Attendee pilih ticket yang mau di-check-in
5. Approve transaction
6. Ticket status berubah menjadi "used"

### 3. QR Scanner Component
**File**: `src/components/QRScanner.tsx`

**Features**:
- Camera permission handling
- Real-time QR scanning menggunakan html5-qrcode
- Error handling untuk berbagai kasus
- Mobile-friendly (gunakan back camera)

### 4. Check-In Service
**File**: `src/services/ticketCheckInService.ts`

**Functions**:

```typescript
// Generate QR code untuk check-in point (EO)
generateCheckInPointQR(
  contractAddress: string,
  contractName: string,
  eventId: number
): string

// Parse QR code yang di-scan attendee
parseCheckInPointQR(qrData: string): CheckInPointData | null

// Execute check-in transaction
checkInTicket(
  contractAddress: string,
  contractName: string,
  tokenId: number,
  privateKey: string
): Promise<CheckInResult>

// Validate ticket sebelum check-in
validateTicket(
  contractAddress: string,
  contractName: string,
  tokenId: number,
  eventDate: string,
  eventTime: string
): Promise<TicketValidation>
```

## Smart Contract Integration

### Function: `use-ticket`

**Lokasi**: Di setiap smart contract yang di-deploy via `CreateEventNFT.tsx`

```clarity
;; Use ticket (check-in) - Called by ticket owner to check-in at event
;; This function allows attendees to check-in themselves by scanning QR code at entrance
(define-public (use-ticket (token-id uint))
  (let
    (
      (owner (unwrap! (nft-get-owner? nft-ticket token-id) err-invalid-token))
    )
    ;; Verify caller is the ticket owner
    (asserts! (is-eq tx-sender owner) err-not-token-owner)

    ;; Check ticket hasn't been used
    (asserts! (not (default-to false (map-get? ticket-used token-id))) err-ticket-used)

    ;; Mark ticket as used (check-in completed)
    (map-set ticket-used token-id true)

    (ok true)
  )
)
```

**Parameters**:
- `token-id`: NFT ticket ID yang akan di-check-in

**Validations**:
- ✅ Ticket harus dimiliki oleh tx-sender (wallet yang approve transaction)
- ✅ Ticket belum pernah digunakan (is-used = false)
- ✅ Ticket exists (NFT sudah di-mint)

**⚠️ PENTING**:
- Fungsi ini dipanggil oleh **ATTENDEE (pemilik ticket)**, bukan oleh Event Organizer
- Attendee approve transaction sendiri menggunakan wallet mereka
- Smart contract secara otomatis validasi ownership on-chain

## Ticket Status

### Status Types

1. **active** - Ticket valid, belum digunakan, event belum dimulai/masih dalam grace period
2. **used** - Ticket sudah di-check-in (is-used = true on-chain)
3. **expired** - Event sudah lewat + grace period (2 jam setelah event)

### Status Logic

```typescript
// Di ticketDetailService.ts
if (now > eventEndTime) {
  status = 'expired';  // Event sudah lewat + 2 jam
} else if (ticketData['is-used']) {
  status = 'used';     // Sudah check-in
} else {
  status = 'active';   // Valid untuk check-in
}
```

## UI Components

### Check-In Button Location
- **Navigation Menu**: Sidebar - "Check-In" dengan icon ScanLine
- **My Tickets**: Setiap ticket card ada tombol QR code

### Status Badge Colors
```typescript
const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  used: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  expired: "bg-orange-500/10 text-orange-500 border-orange-500/20"
};
```

## User Journey

### Event Organizer
1. Create event di platform
2. Navigate ke `/app/event/{contractId}/{eventId}/checkin-point`
3. Display QR code di entrance (bisa download atau tampilkan di screen)
4. Wait for attendees to scan

### Attendee
1. Beli ticket untuk event
2. Datang ke event venue
3. Buka app → klik "Check-In" di menu
4. Scan QR code yang ditampilkan EO
5. App auto-detect tickets untuk event tersebut
6. Pilih ticket (jika punya lebih dari 1)
7. Klik "Confirm Check-In"
8. Approve transaction di wallet
9. Done! Status berubah jadi "used"

## Error Handling

### Skenario Error

| Error | Penyebab | Solusi |
|-------|----------|--------|
| Invalid QR code | QR bukan format check-in | Scan QR yang benar dari EO |
| No valid tickets | User tidak punya ticket untuk event ini | Beli ticket dulu |
| Ticket already used | Ticket sudah di-check-in sebelumnya | Tidak bisa check-in lagi |
| Ticket expired | Event sudah lewat + grace period | Ticket tidak valid lagi |
| Not authorized | Wallet yang approve bukan owner ticket | Login dengan wallet yang benar |
| Camera permission denied | User tidak izinkan akses camera | Enable camera di browser settings |

## Security

### On-Chain Validation
- ✅ Hanya owner ticket yang bisa check-in (validated by smart contract)
- ✅ Ticket tidak bisa digunakan 2x (is-used flag on-chain)
- ✅ Semua check-in terekam permanent di blockchain

### QR Code Security
- QR code dari EO hanya berisi contract info + event ID
- Tidak ada private key atau sensitive data di QR
- Attendee harus approve dengan wallet mereka sendiri

## Testing Checklist

- [ ] EO bisa generate dan download QR code
- [ ] Attendee bisa scan QR code dengan camera
- [ ] App detect tickets yang benar untuk event
- [ ] Check-in transaction success dan terekam on-chain
- [ ] Ticket status berubah menjadi "used" setelah check-in
- [ ] Tidak bisa check-in dengan ticket yang sudah used
- [ ] Tidak bisa check-in dengan ticket yang expired
- [ ] Error handling untuk berbagai kasus edge

## Future Enhancements

1. **Bulk Check-In**: EO bisa lihat daftar attendees yang sudah check-in
2. **Real-time Dashboard**: Live counter attendees yang check-in
3. **NFC Check-In**: Alternatif check-in dengan NFC tag
4. **Offline Mode**: Cache check-in dan sync later
5. **Multiple Check-In Points**: Support multiple gates/entrances
6. **Analytics**: Report check-in times, no-show rate, etc.

## Dependencies

```json
{
  "html5-qrcode": "^2.3.8",  // QR scanner library
  "qrcode.react": "^3.1.0",   // QR generator
  "@stacks/transactions": "^6.5.0"  // Blockchain interaction
}
```

## API Reference

### ticketCheckInService

```typescript
import {
  generateCheckInPointQR,
  parseCheckInPointQR,
  checkInTicket,
  validateTicket
} from '@/services/ticketCheckInService';

// EO generate QR
const qrData = generateCheckInPointQR(
  'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C',
  'event-registry-v2',
  123
);
// Returns: "checkin:ST1X7M...AK4C.event-registry-v2:123"

// Attendee scan QR
const checkInPoint = parseCheckInPointQR(qrData);
// Returns: { contractAddress, contractName, eventId }

// Check-in
const result = await checkInTicket(
  checkInPoint.contractAddress,
  checkInPoint.contractName,
  tokenId,
  wallet.privateKey
);
```

## Troubleshooting

### QR Scanner tidak muncul
- Check camera permission di browser
- Pastikan HTTPS (camera API butuh secure context)
- Try different browser

### Transaction gagal
- Check wallet balance (butuh STX untuk fee)
- Pastikan network connection stabil
- Verify ticket ownership

### Status tidak update
- Wait for blockchain confirmation (~10 min)
- Refresh page
- Clear cache dan reload

---

**Generated**: 2025-01-XX
**Version**: 1.0.0
**Author**: INTIC Development Team
