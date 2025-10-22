/**
 * Profile Service - Smart Contract Integration
 *
 * Integrates with deployed contract: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.user-profile
 *
 * Architecture:
 * Layer 1: Smart Contract → Username + IPFS hash
 * Layer 2: IPFS → Full metadata (email, bio, avatar, preferences)
 * Layer 3: LocalStorage → Cache
 */

import {
  uintCV,
  stringAsciiCV,
  principalCV,
  cvToJSON,
  hexToCV,
  cvToHex
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { callReadOnlyContractFunction, parseClarityResponse } from './stacksReader';

// Note: callContractFunction will be passed as parameter to avoid circular dependency

export interface ProfileData {
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
  createdAt?: number;
  updatedAt?: number;

  // From IPFS
  email?: string;
  bio?: string;
  avatar?: string;
  preferences?: ProfileData['preferences'];
}

const CONTRACT_ADDRESS = 'ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C';
const CONTRACT_NAME = 'user-profile';
const NETWORK = new StacksTestnet();
const SERVER_BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8000';

const CACHE_KEY = 'intic-profile-cache-v2'; // Updated to invalidate old cache
const OLD_CACHE_KEY = 'intic-profile-cache'; // Old cache key to clear
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

// Rate limiting protection
let lastProfileFetch = 0;
const PROFILE_FETCH_COOLDOWN = 5000; // 5 seconds between fetches
const pendingProfileRequests = new Map<string, Promise<any>>();

// Clear old cache on module load
if (typeof window !== 'undefined' && localStorage.getItem(OLD_CACHE_KEY)) {
  localStorage.removeItem(OLD_CACHE_KEY);
}

// ============================================================================
// IPFS Functions
// ============================================================================

/**
 * Upload profile data to IPFS via Pinata
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
      const error = await response.text();
      throw new Error(`IPFS upload failed: ${error}`);
    }

    const result = await response.json();

    return result.IpfsHash;

  } catch (error) {
    console.error('❌ IPFS upload error:', error);
    throw error;
  }
}

/**
 * Fetch profile data from IPFS
 */
export async function fetchFromIPFS(ipfsHash: string): Promise<ProfileData | null> {
  try {
    const response = await fetch(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`);

    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }

    const data = await response.json();

    return data;

  } catch (error) {
    console.error('❌ IPFS fetch error:', error);
    return null;
  }
}

// ============================================================================
// Smart Contract Functions
// ============================================================================

/**
 * Get profile from smart contract with rate limiting protection
 */
export async function getProfileFromContract(address: string): Promise<any> {
  try {
    // Check if there's already a pending request for this address
    if (pendingProfileRequests.has(address)) {

      return await pendingProfileRequests.get(address);
    }

    // Rate limiting: Check cooldown
    const now = Date.now();
    const timeSinceLastFetch = now - lastProfileFetch;
    if (timeSinceLastFetch < PROFILE_FETCH_COOLDOWN) {
      const waitTime = PROFILE_FETCH_COOLDOWN - timeSinceLastFetch;

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Create pending request promise
    const requestPromise = (async () => {
      try {
        lastProfileFetch = Date.now();
        

        
        // Try server endpoint first
        try {
          const serverUrl = `${SERVER_BASE}/api/stacks/contract/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/call-read/get-profile`;
          const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              functionArgs: [{ type: 'principal', value: address }],
              senderAddress: address,
            }),
          });

          if (response.ok) {
            const serverResult = await response.json();

            
            if (serverResult.success && serverResult.json) {
              const parsed = parseClarityResponse(serverResult.json);
              return parsed === null ? null : { value: parsed };
            }
          } else if (response.status === 429) {
            console.warn('⚠️ Server also rate limited, using fallback');
          }
        } catch (serverError) {

        }

        // Fallback to direct call
        const result = await callReadOnlyContractFunction(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          'get-profile',
          [principalCV(address)],
          address
        );

        if (!result.success) {
          console.error('Failed to read profile from contract');
          return null;
        }



        // Parse the response - handle (optional ...) wrapper
        const parsed = parseClarityResponse(result.result);



        // If it's none, return null
        if (parsed === null) {

          return null;
        }


        return { value: parsed };
      } catch (error: any) {
        // Handle rate limiting errors
        if (error.message && error.message.includes('429')) {
          console.error('❌ Rate limited! Waiting before retry...');
          // Wait 10 seconds before allowing next request
          await new Promise(resolve => setTimeout(resolve, 10000));
          throw new Error('Rate limited. Please wait a moment and try again.');
        }
        console.error('❌ Contract read error:', error);
        return null;
      } finally {
        // Clean up pending request
        pendingProfileRequests.delete(address);
      }
    })();

    // Store pending request
    pendingProfileRequests.set(address, requestPromise);
    
    return await requestPromise;
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    pendingProfileRequests.delete(address);
    return null;
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const result = await callReadOnlyContractFunction(
      CONTRACT_ADDRESS,
      CONTRACT_NAME,
      'is-username-available',
      [stringAsciiCV(username)],
      CONTRACT_ADDRESS
    );

    if (!result.success) {
      console.error('Failed to check username availability');
      return false;
    }

    const available = parseClarityResponse(result.result);
    return available === true;

  } catch (error) {
    console.error('❌ Username check error:', error);
    return false;
  }
}

/**
 * Create profile on smart contract
 */
export async function createProfile(
  username: string,
  ipfsHash: string,
  callContractFn: (params: any) => Promise<any>
): Promise<void> {


  return new Promise((resolve, reject) => {
    callContractFn({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-profile',
      functionArgs: [
        stringAsciiCV(username),
        stringAsciiCV(ipfsHash),
      ],
      onFinish: (data: any) => {

        resolve();
      },
    }).catch((error: any) => {
      console.error('❌ Create profile failed:', error);
      reject(error);
    });
  });
}

/**
 * Update profile metadata (IPFS hash)
 */
export async function updateMetadata(
  ipfsHash: string,
  callContractFn: (params: any) => Promise<any>
): Promise<void> {


  return new Promise((resolve, reject) => {
    callContractFn({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'update-metadata',
      functionArgs: [stringAsciiCV(ipfsHash)],
      onFinish: (data: any) => {

        resolve();
      },
    }).catch((error: any) => {
      console.error('❌ Update metadata failed:', error);
      reject(error);
    });
  });
}

/**
 * Update username on smart contract
 */
export async function updateUsername(
  newUsername: string,
  callContractFn: (params: any) => Promise<any>
): Promise<void> {


  return new Promise((resolve, reject) => {
    callContractFn({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'update-username',
      functionArgs: [stringAsciiCV(newUsername)],
      onFinish: (data: any) => {

        resolve();
      },
    }).catch((error: any) => {
      console.error('❌ Update username failed:', error);
      reject(error);
    });
  });
}

// ============================================================================
// Cache Functions
// ============================================================================

/**
 * Save profile to localStorage cache
 */
export function saveToCache(profile: FullProfile): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[profile.address] = {
      ...profile,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

  } catch (error) {
    console.error('❌ Cache save error:', error);
  }
}

/**
 * Get profile from cache
 * Cache valid for 10 minutes to reduce API calls
 */
export function getFromCache(address: string): FullProfile | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[address];

    if (!cached) return null;

    // Cache valid for 10 minutes (increased from 5)
    const CACHE_TTL = 10 * 60 * 1000;
    const isValid = Date.now() - cached.cachedAt < CACHE_TTL;
    
    if (!isValid) {

      return null;
    }
    
    return cached;

  } catch {
    return null;
  }
}

/**
 * Clear cache for address
 */
export function clearCache(address: string): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    delete cache[address];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

  } catch (error) {
    console.error('❌ Cache clear error:', error);
  }
}

// ============================================================================
// High-Level Profile Functions
// ============================================================================

/**
 * Get full profile (from cache, contract, and IPFS)
 * Enhanced with aggressive caching to prevent rate limiting
 */
export async function getFullProfile(address: string): Promise<FullProfile> {
  // Try cache first - ALWAYS check cache
  const cached = getFromCache(address);
  if (cached) {

    return cached;
  }

  // Check if there's a pending request for this address
  const pendingKey = `profile-${address}`;
  if (pendingProfileRequests.has(pendingKey)) {

    return await pendingProfileRequests.get(pendingKey);
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      // Get from contract (with rate limiting protection)
      const contractData = await getProfileFromContract(address);

      if (!contractData || !contractData.value) {
        // No profile exists, return default and cache it
        const defaultProfile = createDefaultProfile(address);
        saveToCache(defaultProfile);
        return defaultProfile;
      }

      const profileData = contractData.value;


      // Extract values - data is still in {type, value} format
      const rawData = profileData.value || profileData;
      const username = rawData.username?.value || rawData.username;
      const ipfsHash = rawData['ipfs-hash']?.value || rawData['ipfs-hash'];
      const createdAt = parseInt(rawData['created-at']?.value || rawData['created-at'] || '0');
      const updatedAt = parseInt(rawData['updated-at']?.value || rawData['updated-at'] || '0');



      // Fetch metadata from IPFS
      const metadata = await fetchFromIPFS(ipfsHash);


      const avatarUrl = metadata?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=FE5C02`;


      const fullProfile: FullProfile = {
        address,
        username,
        ipfsHash,
        createdAt,
        updatedAt,
        email: metadata?.email || '',
        bio: metadata?.bio || '',
        avatar: avatarUrl,
        preferences: metadata?.preferences || {
          theme: 'dark',
          language: 'en',
          notifications: { email: true, push: true },
        },
      };

      // Cache it for 10 minutes
      saveToCache(fullProfile);

      return fullProfile;
    } finally {
      // Clean up pending request
      pendingProfileRequests.delete(pendingKey);
    }
  })();

  // Store pending request
  pendingProfileRequests.set(pendingKey, requestPromise);
  
  return await requestPromise;
}

/**
 * Create or update profile
 */
export async function saveProfile(
  address: string,
  username: string,
  metadata: ProfileData,
  callContractFn: (params: any) => Promise<any>
): Promise<void> {
  // Upload metadata to IPFS
  const ipfsHash = await uploadToIPFS(metadata);
  if (!ipfsHash) {
    throw new Error('Failed to upload to IPFS');
  }

  // Check if profile exists
  const existingProfile = await getProfileFromContract(address);



  if (!existingProfile || !existingProfile.value) {
    // Create new profile

    await createProfile(username, ipfsHash, callContractFn);
  } else {
    // Update existing profile

    const rawData = existingProfile.value.value || existingProfile.value;
    const currentUsername = rawData.username?.value || rawData.username;

    // Update username if changed
    if (currentUsername !== username) {

      await updateUsername(username, callContractFn);
    }

    // Always update metadata

    await updateMetadata(ipfsHash, callContractFn);
  }

  // Clear cache to force refresh
  clearCache(address);
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
