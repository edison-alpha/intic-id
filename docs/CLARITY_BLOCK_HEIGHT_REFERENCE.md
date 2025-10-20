# Clarity Block Height Reference

## 📚 Understanding Block Heights in Clarity

Dalam smart contract Clarity di Stacks blockchain, terdapat beberapa cara untuk mendapatkan informasi block height:

## ✅ Built-in Variables yang Tersedia

### 1. `burn-block-height` (RECOMMENDED)
**Type**: `uint`  
**Description**: Bitcoin block height saat transaksi dieksekusi

```clarity
(define-public (example-function)
  (let ((current-time burn-block-height))
    (ok current-time)
  )
)
```

**Kapan menggunakan**:
- ✅ Untuk timestamp/timing dalam smart contract
- ✅ Untuk validasi waktu event
- ✅ Untuk tracking kapan sesuatu terjadi
- ✅ **DIGUNAKAN dalam event-registry-full-fixed.clar**

**Keuntungan**:
- Tersinkronisasi dengan Bitcoin blockchain
- Lebih stabil dan reliable
- Standard practice dalam ekosistem Stacks

### 2. `stacks-block-height`
**Type**: `uint`  
**Description**: Stacks block height saat transaksi dieksekusi

```clarity
(define-public (example-function)
  (let ((current-stacks-block stacks-block-height))
    (ok current-stacks-block)
  )
)
```

**Kapan menggunakan**:
- Ketika Anda perlu referensi spesifik ke Stacks blocks
- Untuk operasi yang terkait dengan Stacks blockchain spesifik
- Jarang digunakan dalam praktik

### 3. `block-height` 
**Status**: ❌ **TIDAK ADA dalam Clarity**  
**Error yang muncul**:
```
VM Error: use of unresolved variable 'block-height'
```

**Catatan**: Ini adalah kesalahan umum! Banyak developer mengira ada variabel `block-height`, padahal yang benar adalah `burn-block-height` atau `stacks-block-height`.

## 🔍 Perbandingan

| Variable | Status | Use Case | Recommendation |
|----------|--------|----------|----------------|
| `burn-block-height` | ✅ Valid | General timing & timestamps | **RECOMMENDED** |
| `stacks-block-height` | ✅ Valid | Stacks-specific operations | Use if needed |
| `block-height` | ❌ Invalid | N/A | **NEVER USE** |

## 💡 Best Practices

### 1. Gunakan `burn-block-height` untuk timestamp
```clarity
;; ✅ CORRECT
(define-public (register-event (event-date uint))
  (let ((current-time burn-block-height))
    (asserts! (> event-date current-time) ERR-INVALID-DATE)
    (ok true)
  )
)

;; ❌ INCORRECT
(define-public (register-event (event-date uint))
  (let ((current-time block-height))  ;; Error!
    (asserts! (> event-date current-time) ERR-INVALID-DATE)
    (ok true)
  )
)
```

### 2. Konsisten dalam penggunaan
Jika Anda menggunakan `burn-block-height` untuk tracking waktu, gunakan itu di seluruh contract Anda. Jangan mix dengan `stacks-block-height` kecuali ada alasan spesifik.

### 3. Validasi event dates
```clarity
;; Event date harus di masa depan
(asserts! (> event-date burn-block-height) ERR-INVALID-INPUT)
```

## 🐛 Common Errors & Solutions

### Error: "use of unresolved variable 'block-height'"

**Problem**:
```clarity
(let ((current-time block-height))  ;; ❌ Error!
  ...
)
```

**Solution**:
```clarity
(let ((current-time burn-block-height))  ;; ✅ Correct!
  ...
)
```

### Error: "use of unresolved variable 'stacks-block-height'" (di Clarity 1)

Jika Anda menggunakan Clarity version 1, `stacks-block-height` mungkin tidak tersedia. Gunakan `burn-block-height` sebagai gantinya.

## 📖 Additional Resources

### Block Height Conversion
1 Bitcoin block ≈ 10 minutes

Contoh perhitungan:
- 1 jam = 6 blocks
- 1 hari = 144 blocks
- 1 minggu = 1,008 blocks
- 1 bulan (30 hari) = 4,320 blocks
- 1 tahun = 52,560 blocks

### Example: Time-based Validations

```clarity
;; Check if event is at least 1 day in the future
(define-constant BLOCKS-PER-DAY u144)

(define-public (schedule-event (event-date uint))
  (let 
    (
      (current-time burn-block-height)
      (min-future-time (+ current-time BLOCKS-PER-DAY))
    )
    (asserts! (>= event-date min-future-time) ERR-TOO-SOON)
    (ok true)
  )
)
```

## 📋 Checklist untuk Developer

Sebelum deploy contract, pastikan:

- [ ] Tidak menggunakan `block-height` di manapun
- [ ] Semua timestamp menggunakan `burn-block-height`
- [ ] Konsisten dalam penggunaan block height variable
- [ ] Validasi time-based logic dengan benar
- [ ] Test dengan block height yang berbeda-beda
- [ ] Dokumentasikan kapan menggunakan `burn-block-height` vs `stacks-block-height` jika keduanya digunakan

## 🔗 References

- [Clarity Language Reference](https://docs.stacks.co/clarity/language-functions)
- [Stacks Blockchain Documentation](https://docs.stacks.co/)
- [Bitcoin Block Explorer](https://mempool.space/) - untuk tracking burn-block-height

---

**Note**: Dokumen ini dibuat berdasarkan pengalaman debugging error "use of unresolved variable 'block-height'" dalam contract event-registry-full-fixed.clar
