# INTIC Blockchain Cache Server

An Express.js server that caches and optimizes API calls to Hiro and Stacks blockchain services, improving performance and avoiding rate limits.

## Features

- **Caching Layer**: Implements intelligent caching for blockchain data with configurable TTL
- **Rate Limiting**: Built-in rate limiting to prevent API abuse
- **Optimized Endpoints**: Aggregated endpoints that reduce the number of client-side API calls
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Dramatically reduces blockchain data fetch time by caching frequently requested data

## Prerequisites

- Node.js 16+ 
- npm or yarn

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Hiro API Configuration
HIRO_API_URL=https://api.testnet.hiro.so
# HIRP_API_KEY=your_hiro_api_key_here  # Optional but recommended

# Stacks Network (testnet or mainnet)
STACKS_NETWORK=testnet

# Server Configuration
PORT=8000
NODE_ENV=development
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:8000` by default.

## API Endpoints

### Hiro API Endpoints

- `GET /api/hiro/contract/:contractId` - Get contract information
- `GET /api/hiro/transaction/:txId` - Get transaction status
- `GET /api/hiro/contract/:contractId/transactions` - Get contract transactions
- `GET /api/hiro/contract/:contractId/events` - Get contract events  
- `GET /api/hiro/address/:address/transactions` - Get transactions by address
- `GET /api/hiro/address/:address/deployments` - Get contract deployments by address
- `POST /api/hiro/contract/:contractAddress/:contractName/call-read/:functionName` - Call read-only contract function
- `GET /api/hiro/nft/:contractId/events` - Get NFT events (mints, transfers)
- `GET /api/hiro/nft/:contractId/holders` - Get NFT holders

### Stacks API Endpoints

- `POST /api/stacks/contract/:contractAddress/:contractName/call-read/:functionName` - Call read-only function using Stacks.js
- `GET /api/stacks/nft-ticket/:contractId` - Get NFT ticket data
- `GET /api/stacks/contract/:contractId/event-details` - Get event details
- `GET /api/stacks/contract/:contractId/user/:userAddress/owned-tokens` - Check user token ownership
- `GET /api/stacks/address/:address/balance` - Get address balance

### Optimized Endpoints

- `GET /api/optimized/events` - Get all events with caching
- `GET /api/optimized/user/:userAddress/tickets` - Get user's tickets
- `GET /api/optimized/event/:contractId` - Get specific event details
- `GET /api/optimized/contract/:contractId/user/:userAddress/tokens` - Get user's tokens in a contract
- `POST /api/optimized/checkin/validate` - Validate check-in request
- `GET /api/optimized/contract/:contractId/analytics` - Get contract analytics

### Cache Management

- `GET /api/cache/stats` - Get cache statistics
- `DELETE /api/cache/clear` - Clear entire cache
- `DELETE /api/cache/key/:key` - Delete specific cache key

### Health Check

- `GET /health` - Server health status

## Caching Strategy

The server implements a multi-layer caching strategy:

- **Contract Data**: 10 minutes TTL (600 seconds)
- **Transaction Data**: 5 minutes TTL (300 seconds) 
- **Event Data**: 3 minutes TTL (180 seconds)
- **Balance Data**: 1 minute TTL (60 seconds)
- **NFT Data**: 2 minutes TTL (120 seconds)

Cache keys are automatically invalidated based on TTL, and manual cache invalidation is available via the cache management endpoints.

## Integration with Frontend

To use this server with your frontend:

1. Update the service files in `src/services/` to call the server endpoints instead of Hiro/Stacks directly
2. Replace direct API calls with calls to `http://localhost:8000/api/...`
3. Benefit from faster response times and no rate limits

Example:

```javascript
// Instead of calling Hiro API directly
// const response = await fetch('https://api.testnet.hiro.so/...');

// Call the cache server
const response = await fetch('http://localhost:8000/api/hiro/...');

// Or for optimized endpoints
const response = await fetch('http://localhost:8000/api/optimized/...');
```

## Performance Benefits

- **Reduced Latency**: Cached responses return in milliseconds instead of seconds
- **No Rate Limits**: Server handles rate limiting, not the client
- **Aggregated Data**: Optimized endpoints return all needed data in a single call
- **Smart Caching**: Only updates cache when data changes (in future versions)

## Security

- Implements Helmet for security headers
- CORS configured for secure cross-origin requests
- Rate limiting to prevent abuse
- Input validation on all endpoints

## Monitoring

Monitor server health and performance through:
- Health check endpoint: `GET /health`
- Cache statistics: `GET /cache/stats`
- Standard logging of requests and errors

## License

MIT