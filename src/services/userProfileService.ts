/**
 * User Profile Service
 * Manages user profile data including avatar, email, and preferences
 */

export interface UserProfile {
  address: string;
  displayName?: string;
  email?: string;
  avatar?: string; // URL or base64
  bio?: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'id';
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

const PROFILE_STORAGE_KEY = 'user-profile';

/**
 * Get user profile from localStorage
 */
export function getUserProfile(walletAddress: string): UserProfile | null {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    return profiles[walletAddress] || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Create default profile for new user
 */
export function createDefaultProfile(walletAddress: string): UserProfile {
  const now = new Date().toISOString();

  return {
    address: walletAddress,
    displayName: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    email: undefined,
    avatar: undefined,
    bio: undefined,
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): boolean {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    profiles[profile.address] = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
    console.log('✅ Profile saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    return false;
  }
}

/**
 * Update user profile field
 */
export function updateProfileField(
  walletAddress: string,
  field: keyof UserProfile,
  value: any
): boolean {
  try {
    let profile = getUserProfile(walletAddress);

    if (!profile) {
      profile = createDefaultProfile(walletAddress);
    }

    (profile as any)[field] = value;
    return saveUserProfile(profile);
  } catch (error) {
    console.error('Error updating profile field:', error);
    return false;
  }
}

/**
 * Upload avatar image
 * Converts image to base64 for localStorage
 */
export async function uploadAvatar(
  walletAddress: string,
  file: File
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'Image must be less than 2MB' };
    }

    // Convert to base64
    const base64 = await fileToBase64(file);

    // Update profile
    const success = updateProfileField(walletAddress, 'avatar', base64);

    if (success) {
      return { success: true, avatarUrl: base64 };
    } else {
      return { success: false, error: 'Failed to save avatar' };
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, error: 'Failed to upload avatar' };
  }
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Generate avatar from wallet address (placeholder)
 */
export function generateDefaultAvatar(walletAddress: string): string {
  // Use DiceBear API for generated avatars
  const seed = walletAddress.toLowerCase();
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=FE5C02`;
}

/**
 * Delete user profile
 */
export function deleteUserProfile(walletAddress: string): boolean {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    delete profiles[walletAddress];
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
    console.log('✅ Profile deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting user profile:', error);
    return false;
  }
}

/**
 * Export user profile data (for backup)
 */
export function exportUserProfile(walletAddress: string): string | null {
  const profile = getUserProfile(walletAddress);
  if (!profile) return null;

  return JSON.stringify(profile, null, 2);
}

/**
 * Import user profile data (from backup)
 */
export function importUserProfile(jsonData: string): boolean {
  try {
    const profile = JSON.parse(jsonData) as UserProfile;
    return saveUserProfile(profile);
  } catch (error) {
    console.error('Error importing profile:', error);
    return false;
  }
}
