/**
 * Stacks Configuration & User Session
 * 
 * Proper implementation of Stacks Connect with UserSession
 * This ensures wallet authentication is persistent and reliable
 */

import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

// App configuration
export const appConfig = new AppConfig(['store_write', 'publish_data']);

// User session instance
export const userSession = new UserSession({ appConfig });

// Network configuration
export const network = new StacksTestnet();

// App details for wallet connection
export const appDetails = {
  name: 'NFT Ticket Platform',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '',
};

/**
 * Check if user is signed in with Stacks Connect
 */
export const isUserSignedIn = (): boolean => {
  return userSession.isUserSignedIn();
};

/**
 * Get user data from session
 */
export const getUserData = () => {
  if (!userSession.isUserSignedIn()) {
    return null;
  }
  return userSession.loadUserData();
};

/**
 * Get user's STX address
 */
export const getUserAddress = (): string | null => {
  const userData = getUserData();
  if (!userData) return null;
  
  return userData.profile?.stxAddress?.testnet || 
         userData.profile?.stxAddress?.mainnet || 
         null;
};

/**
 * Sign in with Stacks wallet
 */
export const signIn = (onFinish?: () => void) => {
  return showConnect({
    appDetails,
    onFinish: (data) => {
      if (onFinish) {
        onFinish();
      }
    },
    onCancel: () => {
    },
    userSession,
  });
};

/**
 * Sign out from Stacks wallet
 */
export const signOut = () => {
  userSession.signUserOut();
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

/**
 * Get authentication state for debugging
 */
export const getAuthState = () => {
  return {
    isSignedIn: isUserSignedIn(),
    userData: getUserData(),
    address: getUserAddress(),
    hasSession: !!userSession,
  };
};
