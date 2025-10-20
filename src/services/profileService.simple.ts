/**
 * Simple Profile Service - Galxe Style (Simplified)
 *
 * Hanya untuk fitur yang ada di Settings page:
 * - Display Name (username) → On-chain
 * - Email → IPFS
 * - Bio → IPFS
 * - Avatar → IPFS
 * - Preferences (theme, language, notifications) → IPFS
 *
 * Architecture:
 * Layer 1: Smart Contract → Username only
 * Layer 2: IPFS → Email, bio, avatar, preferences
 * Layer 3: LocalStorage → Cache
 */

export interface ProfileData {
  // Data yang akan di-upload ke IPFS
  email: string;
  bio: string;
  avatar: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'id';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

export interface FullProfile {
  address: string;
  username: string;
  ipfsHash?: string;

  // From IPFS
  email?: string;
  bio?: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'id';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

const CACHE_KEY = 'intic-simple-profile';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

/**
 * Upload profile data ke IPFS
 */
export async function uploadToIPFS(data: ProfileData): Promise<string | null> {
  try {
    if (!PINATA_JWT) {
      console.warn('⚠️ Pinata JWT not configured');
      return null;
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `intic-profile-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Uploaded to IPFS:', result.IpfsHash);
    return result.IpfsHash;

  } catch (error) {
    console.error('❌ IPFS upload error:', error);
    return null;
  }
}

/**
 * Fetch profile data dari IPFS
 */
export async function fetchFromIPFS(ipfsHash: string): Promise<ProfileData | null> {
  try {
    const response = await fetch(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`);

    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Fetched from IPFS:', ipfsHash);
    return data;

  } catch (error) {
    console.error('❌ IPFS fetch error:', error);
    return null;
  }
}

/**
 * Save profile ke localStorage cache
 */
export function saveToCache(profile: FullProfile): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[profile.address] = profile;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('✅ Profile cached');
  } catch (error) {
    console.error('❌ Cache save error:', error);
  }
}

/**
 * Get profile dari cache
 */
export function getFromCache(address: string): FullProfile | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return cache[address] || null;
  } catch {
    return null;
  }
}

/**
 * Clear cache untuk address tertentu
 */
export function clearCache(address: string): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    delete cache[address];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('❌ Cache clear error:', error);
  }
}

/**
 * Create default profile
 */
export function createDefaultProfile(address: string): FullProfile {
  return {
    address,
    username: `${address.slice(0, 6)}...${address.slice(-4)}`,
    email: '',
    bio: '',
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=FE5C02`,
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
      },
    },
  };
}
