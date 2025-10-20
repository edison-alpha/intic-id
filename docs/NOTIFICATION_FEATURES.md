# 📧 Notification Features - INTIC Event Ticketing

## Overview
INTIC menggunakan **Web3Forms** untuk mengirim notifikasi email kepada pengguna. Sistem ini mencakup:

1. **Konfirmasi Pembelian Tiket** - Email otomatis setelah berhasil membeli tiket
2. **Event Reminders** - Email reminder otomatis 2 hari, 1 hari, dan 1 jam sebelum event
3. **Google Calendar Integration** - Export event dengan automatic reminders

---

## 🎯 Fitur-Fitur Utama

### 1. Purchase Confirmation Email

Ketika pengguna berhasil membeli tiket, sistem otomatis akan:

- Meminta email pengguna (jika belum tersimpan)
- Menyimpan email ke localStorage untuk penggunaan berikutnya
- Mengirim email konfirmasi yang berisi:
  - Detail event (nama, tanggal, waktu, lokasi)
  - Nomor tiket unik
  - Harga yang dibayar
  - Transaction ID blockchain
  - Link untuk melihat tiket di app

**File terkait:**
- `src/services/ticketPurchaseNotification.ts` - Service untuk notifikasi pembelian
- `src/components/MintNFTButton.tsx` - Integrasi dengan proses minting

**Kode implementasi:**
```typescript
// Setelah berhasil minting
const emailResult = await sendPurchaseConfirmation({
  userEmail,
  eventName,
  eventDate,
  eventTime,
  location,
  ticketNumber,
  price: priceInSTX,
  transactionId: txId,
  contractId
});
```

---

### 2. Event Reminders (2 Hari, 1 Hari, 1 Jam)

Sistem otomatis mengecek dan mengirim reminder untuk event yang akan datang:

**Timing:**
- **2 Hari sebelum event** - Reminder pertama (48 jam sebelum)
- **1 Hari sebelum event** - Reminder kedua (24 jam sebelum)
- **1 Jam sebelum event** - Reminder terakhir (1 jam sebelum)

**Fitur:**
- ✅ Otomatis cek setiap 1 jam
- ✅ Prevent duplicate reminders menggunakan localStorage
- ✅ Support multiple events secara bersamaan
- ✅ Rate limiting untuk menghindari spam

**File terkait:**
- `src/services/emailReminderService.ts` - Service untuk reminder
- `src/hooks/useEventReminders.ts` - React hook untuk automatic checking
- `src/pages/MyTickets.tsx` - Implementasi di halaman My Tickets

**Kode implementasi:**
```typescript
// Automatic reminders menggunakan hook
useEventReminders(tickets, !!userEmail);

// Manual check
const result = await scheduleEventReminder(reminder, '2days');
```

---

### 3. Google Calendar Integration

Event dapat di-export ke berbagai calendar provider dengan automatic reminders:

**Supported Calendars:**
- 📅 Google Calendar
- 📧 Outlook Calendar
- 💾 Download .ics file (untuk Apple Calendar, dll)

**Reminders bawaan:**
- 2 hari sebelum event
- 1 hari sebelum event
- 1 jam sebelum event

**File terkait:**
- `src/services/calendarService.ts` - Service untuk generate calendar files
- `src/components/AddToCalendar.tsx` - UI component untuk export

**Kode implementasi:**
```typescript
// Generate ICS dengan reminders
const icsContent = generateICS({
  title: eventName,
  description,
  location,
  startDate,
  endDate
});

// Atau langsung ke Google Calendar
const googleUrl = addToGoogleCalendar(calendarEvent);
window.open(googleUrl, '_blank');
```

---

## 🔧 Setup & Configuration

### 1. Environment Variables

Tambahkan di file `.env`:

```env
# Web3Forms API Key (untuk email notifications)
VITE_WEB3FORMS_KEY=your-web3forms-key-here
```

**Cara mendapatkan Web3Forms Key:**
1. Kunjungi https://web3forms.com
2. Sign up gratis
3. Create new form
4. Copy Access Key
5. Paste ke `.env`

### 2. Email Storage

Email pengguna disimpan di localStorage dengan key: `user-notification-email`

```typescript
// Get stored email
const email = getStoredEmail();

// Store email
storeEmail('user@example.com');
```

---

## 📋 Flow Diagram

### Purchase Confirmation Flow
```
User mints ticket
    ↓
Transaction success
    ↓
Check if email stored
    ↓
If no email → Prompt user
    ↓
Store email
    ↓
Send confirmation email via Web3Forms
    ↓
Show toast notification
```

### Event Reminder Flow
```
User visits MyTickets page
    ↓
useEventReminders hook activated
    ↓
Check email stored
    ↓
Get upcoming events (within 7 days)
    ↓
For each event:
  - Check if 2-day reminder sent? → Send if needed
  - Check if 1-day reminder sent? → Send if needed
  - Check if 1-hour reminder sent? → Send if needed
    ↓
Store sent reminders in localStorage
    ↓
Repeat check every 1 hour
```

---

## 🎨 Email Templates

### Purchase Confirmation Template

**Subject:** 🎉 Ticket Purchase Confirmed - {Event Name}

**Content:**
- Header dengan gradient orange
- Success badge "Payment Confirmed"
- Event details dalam card
- Transaction ID dalam highlighted box
- Call-to-action button "View My Tickets"
- Footer dengan branding

### Event Reminder Template

**Subject:** Reminder: {Event Name} in {Time}

**Content:**
- Header dengan icon calendar
- Reminder timing info (2 days/1 day/1 hour)
- Event details dalam card
- Checklist untuk persiapan:
  - Bring QR code
  - Arrive early
  - Check venue requirements
- Call-to-action button "View Your Tickets"
- Footer dengan branding

---

## 🧪 Testing

### Test Purchase Notification

1. Connect wallet
2. Buy a ticket from any event
3. Pada prompt, masukkan email testing Anda
4. Check email untuk konfirmasi
5. Verify semua detail benar

### Test Event Reminders

**Cara 1: Manual Testing**
```typescript
import { checkRemindersManually } from '@/hooks/useEventReminders';

// Di console browser
const result = await checkRemindersManually(tickets);
console.log(result); // { checked, sent, failed }
```

**Cara 2: Modify Date untuk Testing**
1. Create event dengan tanggal 2 hari dari sekarang
2. Buy ticket untuk event tersebut
3. Tunggu automatic check (atau trigger manual)
4. Verify email terkirim

---

## 📊 Monitoring & Debugging

### Console Logs

Service menggunakan console logging untuk debugging:

```
✅ Purchase confirmation email sent successfully
📅 Checking for upcoming event reminders...
📋 Found 3 events to check for reminders
✅ 2-day reminder sent for Tech Conference 2024
✅ 1-day reminder sent for Music Festival
```

### LocalStorage Keys

```javascript
// Stored email
localStorage.getItem('user-notification-email')

// Sent reminders history
localStorage.getItem('sent-reminders')
```

**Format sent-reminders:**
```json
[
  {
    "contractId": "ST1234.event-contract",
    "email": "user@example.com",
    "reminderType": "2days",
    "sentAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## ⚠️ Important Notes

### Rate Limiting
- Web3Forms free tier: 250 emails/month
- Sistem menambahkan delay 1 detik antara setiap email
- Reminders hanya dikirim sekali per type per event

### Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  alert('Please enter a valid email address');
}
```

### Error Handling
- Network errors → User notification via toast
- Invalid email → Prompt again
- Web3Forms API error → Logged but tidak block UI

---

## 🚀 Future Enhancements

### Planned Features
- [ ] SMS notifications via Twilio
- [ ] Push notifications untuk PWA
- [ ] Custom reminder timing (user preference)
- [ ] Email templates customization per organizer
- [ ] Notification preferences dashboard
- [ ] Multi-language support untuk emails

### Performance Optimizations
- [ ] Batch email sending untuk multiple events
- [ ] Server-side cron job untuk reminders (bukan client-side)
- [ ] Email queue system
- [ ] Analytics untuk email open rates

---

## 📚 API Reference

### ticketPurchaseNotification.ts

#### `sendPurchaseConfirmation(data)`
Mengirim email konfirmasi pembelian.

**Parameters:**
- `userEmail: string` - Email penerima
- `eventName: string` - Nama event
- `eventDate: string` - Tanggal event
- `eventTime: string` - Waktu event
- `location: string` - Lokasi event
- `ticketNumber: string` - Nomor tiket
- `price: string` - Harga dalam STX
- `transactionId: string` - Blockchain tx ID
- `contractId: string` - Smart contract ID

**Returns:**
```typescript
Promise<{ success: boolean; message: string }>
```

#### `getStoredEmail()`
Mengambil email yang tersimpan dari localStorage.

**Returns:** `string | null`

#### `storeEmail(email)`
Menyimpan email ke localStorage.

**Parameters:** `email: string`

#### `promptForEmail()`
Menampilkan prompt untuk input email.

**Returns:** `Promise<string | null>`

---

### emailReminderService.ts

#### `scheduleEventReminder(reminder, reminderType)`
Schedule dan kirim event reminder.

**Parameters:**
- `reminder: EventReminder`
- `reminderType: '2days' | '1day' | '1hour'`

**Returns:**
```typescript
Promise<{ success: boolean; message: string }>
```

#### `hasReminderBeenSent(contractId, email, reminderType)`
Cek apakah reminder sudah pernah dikirim.

**Returns:** `boolean`

#### `getEventsNeedingReminders(tickets, userEmail)`
Get daftar event yang butuh reminder (dalam 7 hari).

**Returns:** `EventReminder[]`

---

### useEventReminders.ts

#### `useEventReminders(tickets, enabled)`
React hook untuk automatic reminder checking.

**Parameters:**
- `tickets: any[]` - Array tiket user
- `enabled: boolean` - Enable/disable auto checking

**Features:**
- Cek immediately on mount
- Re-check setiap 1 jam
- Auto cleanup on unmount

#### `checkRemindersManually(tickets)`
Manual trigger untuk check reminders.

**Returns:**
```typescript
Promise<{
  checked: number;
  sent: number;
  failed: number;
}>
```

---

## 💡 Tips & Best Practices

1. **Test dengan email pribadi** sebelum production
2. **Monitor Web3Forms quota** di dashboard mereka
3. **Backup sent-reminders** dari localStorage untuk analytics
4. **Validate event dates** sebelum schedule reminders
5. **Handle timezone** dengan benar untuk international events

---

## 🐛 Troubleshooting

### Email tidak terkirim
- ✅ Check Web3Forms API key di `.env`
- ✅ Verify email format valid
- ✅ Check console untuk error messages
- ✅ Verify internet connection
- ✅ Check Web3Forms quota/limit

### Duplicate reminders
- ✅ Check localStorage `sent-reminders`
- ✅ Clear localStorage untuk reset
- ✅ Verify `hasReminderBeenSent()` logic

### Hook tidak berjalan
- ✅ Verify `userEmail` ada dan valid
- ✅ Check `enabled` parameter di hook
- ✅ Verify tickets array tidak kosong
- ✅ Check browser console untuk errors

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check console logs untuk error details
2. Verify `.env` configuration
3. Test dengan event baru
4. Check documentation di Web3Forms

---

**Last Updated:** 2024-01-21
**Version:** 1.0.0
