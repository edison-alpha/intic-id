// Turnkey Configuration for Hackathon
export const TURNKEY_CONFIG = {
  // Your Turnkey API configuration
  apiBaseUrl: "https://api.turnkey.com",
  organizationId: import.meta.env.VITE_TURNKEY_ORGANIZATION_ID || "47df936a-6c65-497a-b879-2a37f7570b8a",
  rpId: window.location.hostname,
  
  // Testnet configuration
  network: "testnet" as const,
};

// Export for easy access
export const getTurnkeyConfig = () => TURNKEY_CONFIG;
