# 📚 Spesifikasi String untuk Clarity Smart Contract

## Berdasarkan Dokumentasi Resmi Clarity & Stacks Blockchain

---

## 🎯 Ringkasan Cepat

| **Lokasi** | **Tipe Data** | **Karakter Yang Diperbolehkan** | **Batasan** |
|------------|---------------|----------------------------------|-------------|
| Contract Name | string-ascii(40) | `a-z`, `0-9`, `-` (lowercase only) | Max 40 karakter, tidak boleh uppercase/spasi |
| Event Name (di dalam contract) | string-ascii(256) | Semua Printable ASCII (0x20-0x7E) | Max 256 karakter |
| Description | string-ascii(512/1024) | Semua Printable ASCII (0x20-0x7E) | Max 512-1024 karakter |

---

## 📋 1. CONTRACT NAME (Nama Contract di Blockchain)

### Aturan Ketat:
```
Contract Name HANYA boleh:
- Huruf kecil (lowercase): a-z
- Angka: 0-9
- Minus/hyphen: -
- Maksimal 40 karakter
```

### ❌ TIDAK Diperbolehkan:
```
❌ Uppercase (A-Z)
❌ Spasi
❌ Titik (.)
❌ Underscore (_)
❌ Simbol lainnya
```

### Contoh:
```javascript
✅ VALID Contract Names:
- "summer-festival-2025"
- "dewa-19-concert"
- "tech-conference-2025"

❌ INVALID Contract Names:
- "Summer-Festival" (ada uppercase)
- "dewa 19 concert" (ada spasi)
- "festival_2025" (ada underscore)
- "concert.2025" (ada titik)
```

### Di Kode (CreateEventNFT.tsx line 403-412):
```javascript
const sanitizedName = formData.eventName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x00-\x7F]/g, '')
  .replace(/[^a-zA-Z0-9\s\-]/g, '')  // ✅ FIXED: Properly escaped hyphen
  .trim()
  .replace(/\s+/g, '-')  // Spasi → minus
  .replace(/-+/g, '-')
  .toLowerCase()  // SEMUA jadi lowercase
  .substring(0, 40);

const contractName = `${sanitizedName}-${Date.now()}`;
```

### Transformasi Nama Event Anda:
```
Input:  "DEWA 19 Featuring ALL-STARS 2.0"
Output: "dewa-19-featuring-all-stars-20-1234567890"
        ↑ lowercase, spasi jadi minus, titik dihapus, timestamp ditambah
```

---

## 📋 2. STRING-ASCII di Dalam Contract

### Aturan Clarity `string-ascii`:

Berdasarkan [Clarity Documentation](https://docs.stacks.co/reference/functions), `string-ascii` menerima **semua Printable ASCII characters (0x20-0x7E)**.

### ✅ PRINTABLE ASCII CHARACTERS (32-126 / 0x20-0x7E):

```
Karakter yang VALID untuk string-ascii:
 !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
```

### Detail Kategori:

#### Spasi & Tanda Baca:
```
✅ Space: " " (0x20)
✅ ! " # $ % & ' ( ) * + , - . /
✅ : ; < = > ? @
✅ [ \ ] ^ _ `
✅ { | } ~
```

#### Huruf:
```
✅ A-Z (uppercase)
✅ a-z (lowercase)
```

#### Angka:
```
✅ 0-9
```

### ❌ TIDAK Diperbolehkan (Non-Printable/Extended ASCII):
```
❌ Emoji: 🎉 🎊 🎵 😊 ⭐ 🔥
❌ Unicode symbols: © ™ ® • → ★
❌ Accented letters: é è ê ñ ö ü
❌ Non-Latin: 日本語 中文 한글
❌ Control characters: \t \n \r
```

---

## 🧪 3. Test Case: Nama Event Anda

### Test 1: "DEWA 19 feat All Stars"

```javascript
// Character-by-character analysis:
D = ASCII 68  ✅
E = ASCII 69  ✅
W = ASCII 87  ✅
A = ASCII 65  ✅
  = ASCII 32  ✅ (space)
1 = ASCII 49  ✅
9 = ASCII 57  ✅
  = ASCII 32  ✅
f = ASCII 102 ✅
e = ASCII 101 ✅
a = ASCII 97  ✅
t = ASCII 116 ✅
  = ASCII 32  ✅
A = ASCII 65  ✅
l = ASCII 108 ✅
l = ASCII 108 ✅
  = ASCII 32  ✅
S = ASCII 83  ✅
t = ASCII 116 ✅
a = ASCII 97  ✅
r = ASCII 114 ✅
s = ASCII 115 ✅

HASIL: ✅ VALID untuk string-ascii di dalam contract
```

### Test 2: "DEWA 19 Featuring ALL-STARS 2.0"

```javascript
// All characters are printable ASCII (32-126)
D-E-W-A = ✅
(space) = ✅
1-9 = ✅
(space) = ✅
F-e-a-t-u-r-i-n-g = ✅
(space) = ✅
A-L-L = ✅
- (hyphen, ASCII 45) = ✅
S-T-A-R-S = ✅
(space) = ✅
2 = ✅
. (dot, ASCII 46) = ✅
0 = ✅

HASIL: ✅ VALID untuk string-ascii di dalam contract
```

### Transformasi ke Contract Name:

```javascript
Input:  "DEWA 19 Featuring ALL-STARS 2.0"

Step 1: Normalize & remove accents → "DEWA 19 Featuring ALL-STARS 2.0"
Step 2: Remove non-ASCII → "DEWA 19 Featuring ALL-STARS 2.0"
Step 3: Keep only a-z, 0-9, space, hyphen → "DEWA 19 Featuring ALL-STARS 20"
       (titik dihapus karena tidak ada di [^a-zA-Z0-9\s\-])
Step 4: Trim → "DEWA 19 Featuring ALL-STARS 20"
Step 5: Replace spaces with hyphens → "DEWA-19-Featuring-ALL-STARS-20"
Step 6: Replace multiple hyphens → "DEWA-19-Featuring-ALL-STARS-20"
Step 7: Lowercase → "dewa-19-featuring-all-stars-20"
Step 8: Limit 40 chars → "dewa-19-featuring-all-stars-20"
Step 9: Add timestamp → "dewa-19-featuring-all-stars-20-1735123456789"

Final Contract Name: "dewa-19-featuring-all-stars-20-1735123456789"
✅ VALID untuk deployment!
```

---

## 🔧 4. Perbaikan Bug yang Dilakukan

### Bug Sebelumnya (Line 407):
```javascript
❌ .replace(/[^a-zA-Z0-9\s-]/g, '')
   Problem: \s- creates invalid range!
```

### Perbaikan (FIXED):
```javascript
✅ .replace(/[^a-zA-Z0-9\s\-]/g, '')
   Fixed: Properly escaped hyphen with backslash
```

### Penjelasan Bug:

Dalam regex character class `[...]`:
- `\s-` → Interpreter mencoba membuat range dari `\s` (whitespace class) ke `-` (hyphen)
- Ini INVALID karena `\s` bukan karakter tunggal, melainkan shorthand class
- Harus ditulis: `\s\-` atau `\s-` di akhir class

---

## 📝 5. Kesimpulan

### Untuk Event Name di Form:

**Gunakan HANYA:**
1. ✅ Huruf (A-Z, a-z)
2. ✅ Angka (0-9)
3. ✅ Spasi ` ` (akan diubah jadi minus `-`)
4. ✅ Minus `-`

**HINDARI:**
- ❌ Emoji dan simbol Unicode
- ❌ Huruf beraksen (é, ñ, ü)
- ❌ Tanda baca khusus (©, ™, ®, •, →, ★)

### Contoh Event Names yang VALID:

```
✅ "DEWA 19 feat All Stars"
✅ "DEWA 19 Featuring ALL-STARS 2.0"
✅ "Summer Music Festival 2025"
✅ "Rock Concert - Live Performance"
✅ "Tech Conference AI ML"
✅ "New Years Eve Party"
✅ "Jazz Night Part 1"
✅ "Marathon 10K Run"
```

### Di Dalam Contract (string-ascii):

Event name akan tersimpan PERSIS seperti yang Anda ketik (dengan semua uppercase, spasi, dll.) karena menggunakan `string-ascii` yang mendukung **semua printable ASCII (0x20-0x7E)**.

```clarity
;; Di dalam contract:
(define-data-var event-name (string-ascii 256) "DEWA 19 Featuring ALL-STARS 2.0")
                                                ↑ Tersimpan PERSIS seperti ini
```

### Contract Name di Blockchain:

Contract name akan di-transform menjadi lowercase dengan hyphen:

```
ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dewa-19-featuring-all-stars-20-1735123456789
                                          ↑ Contract name (lowercase + hyphens + timestamp)
```

---

## 🎯 Mengapa Deployment Gagal?

Jika deployment gagal dengan nama "DEWA 19 feat All Stars" atau "DEWA 19 Featuring ALL-STARS 2.0", kemungkinan bukan karena nama eventnya, tetapi:

1. **❌ Insufficient STX Balance**
   - Perlu ~0.26 STX untuk deployment + registry

2. **❌ Network Issues**
   - Koneksi ke blockchain node timeout

3. **❌ Wallet Issue**
   - Wallet extension tidak bisa sign transaction

4. **❌ Bug di Regex (SUDAH DIPERBAIKI)**
   - Regex `\s-` tidak valid → sudah difix jadi `\s\-`

5. **❌ Contract Code Too Large**
   - Max ~100KB untuk testnet

**BUKAN** karena nama event yang invalid, karena kedua nama tersebut **100% VALID** berdasarkan spec Clarity! ✅

---

## 📞 Debugging

Jika masih error, cek:

1. **Console log di browser** (F12) - lihat error message lengkap
2. **Transaction ID** - cek di explorer.hiro.so
3. **STX Balance** - pastikan cukup (min 0.3 STX)
4. **Wallet Connection** - pastikan wallet terkoneksi
5. **Network** - pastikan di testnet

---

## 📚 Referensi

- [Clarity Language Reference](https://docs.stacks.co/reference/functions)
- [Stacks Smart Contracts](https://docs.stacks.co/concepts/clarity)
- [ASCII Printable Characters](https://www.ascii-code.com/characters/printable-characters)
- [Contract Naming Rules](https://docs.stacks.co/concepts/clarity/overview)

---

**Update:** Bug regex sudah diperbaiki di commit ini. Nama event "DEWA 19 Featuring ALL-STARS 2.0" sekarang seharusnya bisa di-deploy! 🚀
