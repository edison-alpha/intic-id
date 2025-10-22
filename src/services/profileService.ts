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

const CACHE_KEY = 'intic-profile-cache-v2'; // Updated to invalidate old cache
const OLD_CACHE_KEY = 'intic-profile-cache'; // Old cache key to clear
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

// Clear old cache on module load
if (typeof window !== 'undefined' && localStorage.getItem(OLD_CACHE_KEY)) {
  console.log('🧹 Clearing old profile cache...');
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
    console.log('✅ Uploaded to IPFS:', result.IpfsHash);
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
    console.log('✅ Fetched from IPFS:', ipfsHash);
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
 * Get profile from smart contract
 */
export async function getProfileFromContract(address: string): Promise<any> {
  try {
    console.log('🔍 Reading profile from contract for:', address);
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

    console.log('📥 Raw contract result:', result.result);

    // Parse the response - handle (optional ...) wrapper
    const parsed = parseClarityResponse(result.result);

    console.log('📦 Parsed result:', parsed);

    // If it's none, return null
    if (parsed === null) {
      console.log('✅ No profile exists (none)');
      return null;
    }

    console.log('✅ Profile found on-chain');
    return { value: parsed };
  } catch (error) {
    console.error('❌ Contract read error:', error);
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
  console.log('📝 Calling create-profile with:', { username, ipfsHash });

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
        console.log('✅ Profile created:', data.txId);
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
  console.log('📝 Updating metadata with hash:', ipfsHash);

  return new Promise((resolve, reject) => {
    callContractFn({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'update-metadata',
      functionArgs: [stringAsciiCV(ipfsHash)],
      onFinish: (data: any) => {
        console.log('✅ Metadata updated:', data.txId);
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
  console.log('📝 Updating username to:', newUsername);

  return new Promise((resolve, reject) => {
    callContractFn({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'update-username',
      functionArgs: [stringAsciiCV(newUsername)],
      onFinish: (data: any) => {
        console.log('✅ Username updated:', data.txId);
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
    console.log('✅ Profile cached');
  } catch (error) {
    console.error('❌ Cache save error:', error);
  }
}

/**
 * Get profile from cache
 */
export function getFromCache(address: string): FullProfile | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[address];

    if (!cached) return null;

    // Cache valid for 5 minutes
    const isValid = Date.now() - cached.cachedAt < 5 * 60 * 1000;
    return isValid ? cached : null;

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
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('❌ Cache clear error:', error);
  }
}

// ============================================================================
// High-Level Profile Functions
// ============================================================================

/**
 * Get full profile (from cache, contract, and IPFS)
 */
export async function getFullProfile(address: string): Promise<FullProfile> {
  // Try cache first
  const cached = getFromCache(address);
  if (cached) {
    console.log('✅ Using cached profile');
    return cached;
  }

  // Get from contract
  const contractData = await getProfileFromContract(address);

  if (!contractData || !contractData.value) {
    // No profile exists, return default
    return createDefaultProfile(address);
  }

  const profileData = contractData.value;
  console.log('🔍 Profile data from contract:', profileData);

  // Extract values - data is still in {type, value} format
  const rawData = profileData.value || profileData;
  const username = rawData.username?.value || rawData.username;
  const ipfsHash = rawData['ipfs-hash']?.value || rawData['ipfs-hash'];
  const createdAt = parseInt(rawData['created-at']?.value || rawData['created-at'] || '0');
  const updatedAt = parseInt(rawData['updated-at']?.value || rawData['updated-at'] || '0');

  console.log('📝 Extracted:', { username, ipfsHash, createdAt, updatedAt });

  // Fetch metadata from IPFS
  const metadata = await fetchFromIPFS(ipfsHash);
  console.log('💾 IPFS metadata:', metadata);

  const avatarUrl = metadata?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=FE5C02`;
  console.log('🖼️ Avatar URL:', avatarUrl?.substring(0, 100) + '...');

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

  // Cache it
  saveToCache(fullProfile);

  return fullProfile;
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

  console.log('📊 Profile check result:', existingProfile);

  if (!existingProfile || !existingProfile.value) {
    // Create new profile
    console.log('🆕 Creating new profile on-chain...');
    await createProfile(username, ipfsHash, callContractFn);
  } else {
    // Update existing profile
    console.log('🔄 Updating existing profile...');
    const rawData = existingProfile.value.value || existingProfile.value;
    const currentUsername = rawData.username?.value || rawData.username;

    // Update username if changed
    if (currentUsername !== username) {
      console.log('📝 Username changed, updating...');
      await updateUsername(username, callContractFn);
    }

    // Always update metadata
    console.log('💾 Updating metadata...');
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
