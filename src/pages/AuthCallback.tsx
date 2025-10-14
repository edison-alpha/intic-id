import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTurnkey } from '@turnkey/react-wallet-kit';

/**
 * OAuth Callback Page
 * Handles the redirect from OAuth providers (Google, etc.)
 * Integrates with Turnkey for wallet creation
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { createWallet } = useTurnkey();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get OAuth parameters from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state'); // Organization ID
        const error = params.get('error');

        if (error) {
          console.error('OAuth error:', error);
          const errorDescription = params.get('error_description') || 'Authentication failed';
          toast.error(errorDescription);
          navigate('/');
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          toast.error('Invalid authentication response');
          navigate('/');
          return;
        }

        console.log('✅ OAuth callback received:', { code: code.substring(0, 10) + '...', state });
        
        toast.loading('Creating your wallet...');
        
        // Create Stacks wallet after successful OAuth
        // Turnkey will associate this wallet with the authenticated user
        const walletId = await createWallet({
          walletName: `Stacks Wallet ${Date.now()}`,
          accounts: [
            {
              curve: 'CURVE_SECP256K1',
              pathFormat: 'PATH_FORMAT_BIP32',
              path: "m/44'/5757'/0'/0/0", // Stacks derivation path
              addressFormat: 'ADDRESS_FORMAT_UNCOMPRESSED',
            },
          ],
        });

        console.log('✅ Wallet created:', walletId);
        
        toast.dismiss();
        toast.success('Successfully authenticated with Google!');
        
        // Redirect to app
        setTimeout(() => {
          navigate('/app');
        }, 1000);
        
      } catch (error: any) {
        console.error('Error handling OAuth callback:', error);
        toast.dismiss();
        toast.error(error.message || 'Authentication failed. Please try again.');
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [navigate, createWallet]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-primary/20 rounded-full">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Completing Authentication
        </h2>
        <p className="text-gray-400">
          Please wait while we set up your wallet...
        </p>
      </div>
    </div>
  );
};
