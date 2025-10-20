# Hiro API Setup Guide

## Why Use Hiro API Key?

The Hiro API has rate limits for anonymous requests. To avoid `429 Too Many Requests` errors, you should get a free API key.

## Getting Your Free API Key

1. Visit [https://platform.hiro.so/](https://platform.hiro.so/)
2. Sign up for a free account
3. Create a new API key
4. Copy the API key

## Setup

1. Open your `.env` file (or create one from `.env.example`)
2. Add your API key:

```bash
VITE_HIRO_API_KEY=your_api_key_here
```

3. Restart your development server

## Benefits

With an API key, you get:
- **Higher rate limits** - More requests per minute
- **Better performance** - Faster response times
- **Reliable access** - No 429 errors

## Without API Key

The app will still work without an API key, but with limitations:
- Lower rate limits
- Possible 429 errors during heavy usage
- Slower activity feed loading

## Rate Limiting Protection

The app includes built-in protection:
- ✅ Request caching (1 minute)
- ✅ Automatic delays between requests (500ms)
- ✅ Retry logic for 429 errors
- ✅ Graceful error handling

## Troubleshooting

If you see `429 Too Many Requests`:
1. Add API key to `.env`
2. Wait a few minutes
3. Refresh the page

The app will automatically retry with delays.
