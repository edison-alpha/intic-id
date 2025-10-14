import React, { useEffect, useState, ReactNode } from 'react';
import { AuthState, useTurnkey } from '@turnkey/react-wallet-kit';
import { Loader2, Wallet } from 'lucide-react';
import { useTurnkeyWallet } from '@/contexts/TurnkeyWalletContext';

interface SignedInProps {
  children: ReactNode;
}

/**
 * Component that ensures user is authenticated with Turnkey
 * Shows loading state and prompts login if not authenticated
 * Similar to Next.js patterns but adapted for React + Vite
 */
export const SignedIn: React.FC<SignedInProps> = ({ children }) => {
  const { authState } = useTurnkey();
  const { connectWallet } = useTurnkeyWallet();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Start a 3-second timer before showing login button
    const timer = setTimeout(() => setShowLogin(true), 3000);

    // If the user authenticates before 3s, cancel showing login
    if (authState === AuthState.Authenticated) {
      clearTimeout(timer);
      setShowLogin(false);
    }

    // Cleanup timer if component unmounts or authState changes
    return () => clearTimeout(timer);
  }, [authState]);

  // If authenticated, show the protected content
  if (authState === AuthState.Authenticated) {
    return <>{children}</>;
  }

  // Show loading/login prompt
  return (
    <div className="relative flex h-screen w-full flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
        {/* Logo/Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Wallet className="w-10 h-10 text-white" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect to Stacks Testnet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your wallet and NFTs
          </p>
        </div>

        {/* Action */}
        {showLogin ? (
          <button
            onClick={connectWallet}
            className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            Login to Continue
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};
