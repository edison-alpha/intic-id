# Hiro API - NFT Endpoints Documentation

Documentation for fetching real NFT events from Hiro Stacks Blockchain API.

## Base URLs

- **Mainnet**: `https://api.mainnet.hiro.so`
- **Testnet**: `https://api.testnet.hiro.so`

Alternative format (also works):
- **Mainnet**: `https://stacks-node-api.mainnet.stacks.co`
- **Testnet**: `https://stacks-node-api.testnet.stacks.co`

## Authentication

Add API key in headers:
```javascript
headers: {
  'x-api-key': 'your-api-key-here',
  'Accept': 'application/json'
}
```

Get API key from: https://platform.hiro.so/

---

## 1. NFT Mints Endpoint

**Purpose**: Retrieve all mint events for a specific NFT collection

**Endpoint**:
```
GET /extended/v1/tokens/nft/mints
```

**Required Parameters**:
- `asset_identifier` - Format: `{contract_address}.{contract_name}::{asset_name}`

**Optional Parameters**:
- `limit` - Number of results (default: 20, max: 60)
- `offset` - Pagination offset
- `tx_metadata` - Include transaction metadata (default: false)
- `unanchored` - Include unconfirmed transactions (default: false)

**Example Request** (Testnet):
```
https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=SP2X0TZ59D5SZ8ACQ6YMCHHNR2ZN51Z32E2CJ173.megapont-ape-club-nft::Megapont-Ape-Club&limit=3
```

**Example Request** (Your Contract):
```javascript
const contractId = 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704';
const assetIdentifier = encodeURIComponent(`${contractId}::event-ticket`);
const url = `https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=${assetIdentifier}&limit=50`;
```

**Response Format**:
```json
{
  "limit": 3,
  "offset": 0,
  "total": 100,
  "results": [
    {
      "tx_id": "0x...",
      "tx_index": 10,
      "block_height": 12345,
      "value": {
        "hex": "0x0100000000000000000000000000000001",
        "repr": "u1"
      },
      "recipient": "SP2X0TZ59D5SZ8ACQ6YMCHHNR2ZN51Z32E2CJ173",
      "timestamp": 1234567890
    }
  ]
}
```

**Documentation**: https://docs.hiro.so/api#operation/get_nft_mints

---

## 2. NFT History Endpoint

**Purpose**: Retrieve all events (mints + transfers) for a specific NFT

**Endpoint**:
```
GET /extended/v1/tokens/nft/history
```

**Required Parameters**:
- `asset_identifier` - Format: `{contract_address}.{contract_name}::{asset_name}`
- `value` - The NFT token ID in Clarity hex format (e.g., `0x0100000000000000000000000000000001` for token ID 1)

**Optional Parameters**:
- `limit` - Number of results (default: 50, max: 200)
- `offset` - Pagination offset
- `tx_metadata` - Include transaction metadata (default: false)
- `unanchored` - Include unconfirmed transactions (default: false)

**Example Request**:
```
https://api.testnet.hiro.so/extended/v1/tokens/nft/history?asset_identifier=SP2X0TZ59D5SZ8ACQ6YMCHHNR2ZN51Z32E2CJ173.the-explorer-guild::The-Explorer-Guild&value=0x0100000000000000000000000000000803&limit=20
```

**Response Format**:
```json
{
  "limit": 20,
  "offset": 0,
  "total": 5,
  "results": [
    {
      "sender": "SP2X0TZ59D5SZ8ACQ6YMCHHNR2ZN51Z32E2CJ173",
      "recipient": "SP3BK1NNSWN719Z6KDW05RBGVS940YCN6X84STYPR",
      "event_index": 5,
      "event_type": "non_fungible_token_asset",
      "asset_event_type": "transfer",
      "tx_id": "0x...",
      "block_height": 12346,
      "timestamp": 1234567890,
      "value": {
        "hex": "0x0100000000000000000000000000000803",
        "repr": "u2051"
      }
    }
  ]
}
```

**Documentation**: https://docs.hiro.so/api#operation/get_nft_history

---

## 3. NFT Holdings Endpoint

**Purpose**: Retrieve all NFTs owned by a specific address or contract

**Endpoint**:
```
GET /extended/v1/tokens/nft/holdings
```

**Required Parameters**:
- `principal` - STX address or contract identifier

**Optional Parameters**:
- `asset_identifiers` - Filter by specific asset identifiers (comma-separated)
- `limit` - Number of results (default: 50, max: 200)
- `offset` - Pagination offset
- `unanchored` - Include unconfirmed transactions (default: false)
- `tx_metadata` - Include transaction metadata (default: false)

**Example Request**:
```
https://api.testnet.hiro.so/extended/v1/tokens/nft/holdings?principal=SP3BK1NNSWN719Z6KDW05RBGVS940YCN6X84STYPR&limit=50
```

**Response Format**:
```json
{
  "limit": 50,
  "offset": 0,
  "total": 2,
  "results": [
    {
      "asset_identifier": "SP2X0TZ59D5SZ8ACQ6YMCHHNR2ZN51Z32E2CJ173.megapont-ape-club-nft::Megapont-Ape-Club",
      "value": {
        "hex": "0x0100000000000000000000000000000001",
        "repr": "u1"
      },
      "block_height": 12345,
      "tx_id": "0x..."
    }
  ]
}
```

**Documentation**: https://docs.hiro.so/api#operation/get_nft_holdings

---

## 4. Asset Events Endpoint (Alternative for Transfers)

**Purpose**: Retrieve all asset events (FT and NFT) for an address

**Endpoint**:
```
GET /extended/v1/address/{principal}/assets
```

**Path Parameters**:
- `principal` - STX address or contract identifier

**Optional Parameters**:
- `limit` - Number of results (default: 20, max: 50)
- `offset` - Pagination offset
- `unanchored` - Include unconfirmed transactions (default: false)

**Example Request**:
```
https://api.testnet.hiro.so/extended/v1/address/SP3BK1NNSWN719Z6KDW05RBGVS940YCN6X84STYPR/assets
```

---

## Common Issues and Solutions

### 1. HTTP 404 - Contract Not Indexed

**Problem**: Newly deployed contracts aren't indexed yet by Hiro.

**Solution**:
- Wait for Hiro to index the contract (can take minutes to hours)
- Fall back to contract state reads via Stacks.js
- Check if contract exists using `get-last-token-id`

**Graceful Handling**:
```javascript
if (response.status === 404) {
  console.log('Contract not indexed yet');
  // Fall back to contract state read
  return null;
}
```

### 2. HTTP 400 - Bad Request

**Possible Causes**:
- Incorrect asset_identifier format
- Missing required parameters
- Special characters not URL-encoded
- Invalid contract address format

**Solution**:
```javascript
// Always encode asset identifiers
const assetIdentifier = encodeURIComponent(`${contractId}::event-ticket`);
```

### 3. HTTP 429 - Rate Limited

**Problem**: Too many requests to Hiro API

**Solutions**:
- Add API key to headers
- Implement request caching (1-minute TTL)
- Add delays between requests (500ms)
- Implement retry logic with exponential backoff

**Example**:
```javascript
if (response.status === 429) {
  await delay(2000);
  // Retry once
  const retryResponse = await fetch(url, { headers });
}
```

---

## Best Practices

1. **Always use API key** for higher rate limits
2. **Implement caching** to reduce duplicate requests
3. **Add rate limiting delays** between requests
4. **Handle 404 gracefully** for new contracts
5. **URL encode all parameters** especially contract names with special characters
6. **Limit concurrent requests** to 5-10 at a time
7. **Use pagination** for large result sets
8. **Implement retry logic** for transient errors

---

## Rate Limits

With API key:
- Higher rate limits (exact limits not publicly documented)
- Priority processing

Without API key:
- Lower rate limits
- May experience 429 errors more frequently

---

## References

- Official Blog: https://www.hiro.so/blog/how-to-use-nft-endpoints-in-the-stacks-api
- API Documentation: https://docs.hiro.so/api
- Get API Key: https://platform.hiro.so/
- GitHub Issues: https://github.com/hirosystems/stacks-blockchain-api/issues
