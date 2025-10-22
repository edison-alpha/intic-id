# 🚀 Deployment Guide - INTIC Platform

## Deploy ke Vercel (Recommended)

### Prerequisites
- Akun Vercel (https://vercel.com)
- Repository GitHub sudah ter-push

### Langkah-langkah Deploy:

#### 1. **Import Project ke Vercel**
```bash
# Atau langsung via Vercel Dashboard:
# 1. Buka https://vercel.com/new
# 2. Pilih repository: edison-alpha/intic-id
# 3. Vercel akan auto-detect sebagai Vite project
```

#### 2. **Configure Environment Variables**
Di Vercel Dashboard > Settings > Environment Variables, tambahkan:

**CRITICAL - Required untuk Production:**
```env
# Application URLs
VITE_APP_URL=https://intic-id.vercel.app
FRONTEND_URL=https://intic-id.vercel.app

# Hiro API (MUST HAVE untuk avoid rate limit!)
HIRO_API_KEY=your_hiro_api_key_here
VITE_HIRO_API_KEY=your_hiro_api_key_here
VITE_HIRO_API_URL=https://api.testnet.hiro.so
HIRO_API_URL=https://api.testnet.hiro.so

# Stacks Network
STACKS_NETWORK=testnet
VITE_STACKS_NETWORK=testnet
VITE_NETWORK=testnet

# Server
NODE_ENV=production
PORT=8000
```

**Contract Addresses (sudah di .env.production):**
```env
VITE_EVENT_REGISTRY_ADDRESS=ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C
VITE_EVENT_REGISTRY_CONTRACT=event-registry-v2
VITE_REGISTRY_CONTRACT_ADDRESS=ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C
VITE_SBTC_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
VITE_SBTC_CONTRACT_NAME=sbtc-token
```

**Already in .env.production (Pinata & Web3Forms):**
```env
VITE_PINATA_JWT=<already_set>
VITE_PINATA_API_KEY=<already_set>
VITE_PINATA_API_SECRET=<already_set>
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
VITE_WEB3FORMS_KEY=1c938d7e-0c4f-4b5f-8855-c79a647f8211
```

**Optional (jika ada):**
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_TURNKEY_ORGANIZATION_ID=your_turnkey_org_id
VITE_TURNKEY_AUTH_PROXY_CONFIG_ID=your_turnkey_config_id
```

**Feature Flags:**
```env
VITE_HACKATHON_MODE=true
VITE_ENABLE_DYNAMIC_PRICING=true
VITE_ENABLE_SBTC=false
```

#### 3. **Get Hiro API Key**
1. Buka: https://www.hiro.so/
2. Sign up / Log in
3. Generate API key
4. Copy ke environment variables Vercel

#### 4. **Deploy**
```bash
# Option 1: Deploy via Vercel CLI
npx vercel

# Option 2: Push ke GitHub (auto-deploy jika sudah connected)
git push origin main
```

#### 5. **Verifikasi Deployment**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-app.vercel.app/api/health`
- Cache Stats: `https://your-app.vercel.app/api/cache/stats`

---

## 📋 Build Settings (Vercel)

Vercel akan otomatis detect, tapi jika perlu manual:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

---

## 🔧 Struktur Project untuk Vercel

```
intic/
├── api/                    # Vercel Serverless Functions
│   └── server.js          # Wrapper untuk Express server
├── server/                # Express backend code
│   ├── server.js
│   ├── routes/
│   └── utils/
├── src/                   # React frontend code
├── dist/                  # Build output (generated)
├── vercel.json           # Vercel configuration
└── package.json
```

---

## 🌐 API Endpoints (Production)

### Health Check
```bash
GET https://your-app.vercel.app/api/health
```

### Hiro API Proxy
```bash
GET https://your-app.vercel.app/api/hiro/address/:address
GET https://your-app.vercel.app/api/hiro/tx/:txId
GET https://your-app.vercel.app/api/hiro/contract/:contractId
```

### Stacks Read-Only Functions
```bash
POST https://your-app.vercel.app/api/stacks/read-only
Body: {
  "contractAddress": "ST1X...",
  "contractName": "event-registry",
  "functionName": "get-event",
  "args": ["u1"]
}
```

### Cache Management
```bash
GET  https://your-app.vercel.app/api/cache/stats
POST https://your-app.vercel.app/api/cache/invalidate
```

---

## ⚡ Performance Tips

1. **Enable Caching**: Pastikan `node-cache` berjalan di serverless function
2. **API Key**: WAJIB set `HIRO_API_KEY` untuk production
3. **Rate Limiting**: Sudah built-in di server
4. **CORS**: Sudah configured untuk Vercel domain

---

## 🐛 Troubleshooting

### Problem: "Module not found" error
**Solution:** Install dependencies di root package.json
```bash
npm install
```

### Problem: API calls timeout
**Solution:** Check Hiro API key dan network configuration

### Problem: CORS errors
**Solution:** Add production domain ke CORS config di `server/server.js`

### Problem: Cache tidak persistent
**Note:** Vercel Serverless Functions adalah stateless. Cache akan reset setiap cold start. Untuk persistent cache, consider:
- Vercel KV (Redis)
- Upstash Redis
- External cache service

---

## 📊 Monitoring

### Vercel Analytics
- Otomatis enabled untuk Web Vitals
- View di Vercel Dashboard > Analytics

### API Monitoring
```bash
# Check API health
curl https://your-app.vercel.app/api/health

# Check cache stats
curl https://your-app.vercel.app/api/cache/stats
```

---

## 🔄 Update Deployment

### Method 1: Git Push (Recommended)
```bash
git add .
git commit -m "Update: description"
git push origin main
# Vercel will auto-deploy
```

### Method 2: Vercel CLI
```bash
npx vercel --prod
```

---

## 📝 Notes

1. **Serverless Functions Limits (Vercel Free)**
   - Execution time: 10s max
   - Memory: 1024 MB
   - Deployment size: 100 MB

2. **Upgrade to Pro if needed**
   - Longer execution time (60s)
   - More memory (3GB)
   - Analytics & logging

3. **Environment Variables**
   - Set di Vercel Dashboard
   - Berbeda untuk Preview vs Production
   - Prefix `VITE_` untuk client-side variables

---

## ✅ Checklist Deploy

- [ ] Repository pushed ke GitHub
- [ ] Import project ke Vercel
- [ ] Set environment variables
- [ ] Get Hiro API key
- [ ] Deploy dan test
- [ ] Verify API endpoints
- [ ] Test wallet connection
- [ ] Test NFT minting
- [ ] Monitor logs

---

## 🎉 Done!

Project Anda sekarang live di Vercel! 🚀

**Frontend**: https://your-app.vercel.app
**Backend API**: https://your-app.vercel.app/api/*
