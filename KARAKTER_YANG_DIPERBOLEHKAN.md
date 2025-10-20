# 📝 Panduan Karakter untuk Event Name & Description

## ✅ Karakter yang DIPERBOLEHKAN (ASCII 0x00-0x7F)

### 1. **Huruf (Letters)**
- **Uppercase**: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
- **Lowercase**: a b c d e f g h i j k l m n o p q r s t u v w x y z

### 2. **Angka (Numbers)**
- 0 1 2 3 4 5 6 7 8 9

### 3. **Spasi & Tanda Baca Dasar (Basic Punctuation)**
- **Spasi**: ` ` (space)
- **Tanda baca**: `.` `,` `!` `?` `;` `:`
- **Tanda kurung**: `(` `)` `[` `]` `{` `}`
- **Quotes**: `'` `"` `` ` ``
- **Matematika**: `+` `-` `*` `/` `=`
- **Lainnya**: `&` `@` `#` `$` `%` `^` `_` `~` `|` `\`

## ❌ Karakter yang TIDAK DIPERBOLEHKAN

### 1. **Emoji & Emoticon** ❌
```
❌ 🎉 🎊 🎵 🎸 🎤 🎧 🎭 🎪 ❤️ 💕 ⭐ 🔥 🚀 ✨
```

### 2. **Simbol Khusus Unicode** ❌
```
❌ © ® ™ € £ ¥ § ¶ † ‡ • ◦ ‣ ⁃
```

### 3. **Karakter Matematika/Geometri** ❌
```
❌ ∞ ≈ ≠ ≤ ≥ ± × ÷ √ ∑ ∫ π
❌ → ← ↑ ↓ ⇒ ⇐ ⇑ ⇓
❌ ○ ● △ ▲ □ ■ ◆ ◇ ★ ☆
```

### 4. **Huruf dengan Aksen/Diacritics** ❌
```
❌ é è ê ë ñ ö ü ç å æ ø
❌ á à â ã ä í ì î ï ó ò ô õ ú ù û
```

### 5. **Karakter Bahasa Non-Latin** ❌
```
❌ 日本語 (Japanese)
❌ 中文 (Chinese)
❌ 한글 (Korean)
❌ العربية (Arabic)
❌ Кириллица (Cyrillic)
```

### 6. **Karakter Kontrol & Whitespace Khusus** ❌
```
❌ Tab (\t)
❌ Newline (\n)
❌ Carriage Return (\r)
❌ Non-breaking space
```

## 📋 Contoh Event Names

### ✅ VALID - Akan Berhasil Deploy

```
✅ "DEWA 19 Featuring ALL-STARS 2.0"
✅ "Summer Music Festival 2025"
✅ "Rock Concert - Live at Stadium"
✅ "Jazz Night (Part 1): The Beginning"
✅ "Tech Conference: AI & Machine Learning"
✅ "New Year's Eve Party 2025"
✅ "Comedy Show @ Downtown Theater"
✅ "Food & Wine Festival"
✅ "Marathon 2025 - 10K Run/Walk"
```

### ❌ INVALID - Akan Ditolak

```
❌ "Summer Festival 🎉" (emoji)
❌ "Café Concert" (é dengan aksen)
❌ "Rock★Show" (bintang unicode)
❌ "Japan Tour 日本" (karakter Jepang)
❌ "Cool©Event™" (simbol copyright/trademark)
❌ "Price→$50" (arrow unicode)
❌ "Top•Event" (bullet point)
❌ "Music♪Festival" (note musik)
```

## 🔧 Auto-Sanitization (Apa yang Terjadi)

Jika Anda memasukkan karakter invalid, sistem akan otomatis:

1. **Normalize Unicode** → Mengubah `é` menjadi `e`
2. **Remove Non-ASCII** → Menghapus emoji dan simbol khusus
3. **Remove Special Chars** → Menghapus karakter selain huruf, angka, spasi, dan tanda minus
4. **Replace Spaces** → Mengubah spasi menjadi `-` (hyphen)
5. **Lowercase** → Mengubah semua huruf menjadi lowercase

### Contoh Transformasi:

```
Input:  "DEWA 19 Featuring ALL-STARS 2.0"
Output: "dewa-19-featuring-all-stars-20"
Note:   Titik (.) dihapus karena dianggap karakter khusus
```

```
Input:  "Summer Festival 🎉"
Output: "summer-festival"
Note:   Emoji dihapus otomatis
```

```
Input:  "Café Concert™"
Output: "cafe-concert"
Note:   é → e, ™ dihapus
```

## 💡 Rekomendasi Best Practices

### 1. **Event Name**
- Gunakan huruf dan angka saja jika memungkinkan
- Hindari simbol kecuali tanda minus `-`
- Maksimal 100 karakter
- Contoh bagus: `"Rock Concert 2025"`

### 2. **Description**
- Boleh lebih panjang dan deskriptif
- Gunakan tanda baca dasar (`. , ! ? : ;`)
- Hindari emoji untuk kompatibilitas blockchain
- Maksimal 500 karakter

### 3. **Venue Name**
- Nama tempat yang jelas dan sederhana
- Contoh: `"Jakarta International Stadium"`
- Bukan: `"Stadium★Jakarta™"`

## ⚠️ Mengapa Pembatasan Ini Ada?

Smart contract Clarity di Stacks blockchain:
- Hanya mendukung **ASCII 7-bit** (0x00-0x7F)
- Karakter di luar range ini akan menyebabkan error saat parsing
- Error: `"unable to parse node response"` atau `"failed to broadcast transaction"`

## 🧪 Cara Test Event Name Anda

Gunakan regex ini untuk test:
```javascript
const invalidCharsRegex = /[^\x00-\x7F]/g;
const eventName = "DEWA 19 Featuring ALL-STARS 2.0";

if (invalidCharsRegex.test(eventName)) {
  console.log("❌ Contains invalid characters");
} else {
  console.log("✅ Valid for blockchain deployment");
}
```

## 📞 Troubleshooting

### Error: "Event name contains invalid characters"
**Solusi:**
1. Hapus emoji dan simbol khusus
2. Ganti huruf beraksen (é → e, ñ → n)
3. Gunakan hanya huruf A-Z, angka 0-9, dan tanda minus
4. Pastikan tidak ada karakter copy-paste dari Word/PDF yang invisible

### Error: "failed to broadcast transaction"
**Kemungkinan Penyebab:**
1. Ada karakter invalid yang lolos validasi
2. Copy-paste dari sumber yang mengandung karakter tersembunyi
3. Ketik ulang manual di form (jangan copy-paste)

---

**Catatan Penting:**
- Validasi ini untuk melindungi Anda dari deployment yang gagal
- Semua karakter yang ditolak adalah karakter yang akan menyebabkan error di blockchain
- Form akan memberikan warning jika ada karakter invalid sebelum deployment
