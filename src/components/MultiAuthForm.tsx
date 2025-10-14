import React, { useState } from 'react';
import { useTurnkey, OtpType } from '@turnkey/react-wallet-kit';
import { useMutation } from '@tanstack/react-query';
import { Mail, Loader2, ArrowLeft, Chrome, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { useTurnkeyWallet } from '@/contexts/TurnkeyWalletContext';

type AuthMethod = 'select' | 'email' | 'google' | 'passkey';
type EmailStep = 'input' | 'otp';

export const MultiAuthForm: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('select');
  const [emailStep, setEmailStep] = useState<EmailStep>('input');
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const { initOtp, completeOtp, createWallet } = useTurnkey();
  const { setIsAuthModalOpen } = useTurnkeyWallet();

  // Email OTP: Step 1 - Submit email
  const { mutateAsync: submitEmail, isPending: isSubmittingEmail } = useMutation({
    mutationFn: async () => {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const id = await initOtp({
        contact: email,
        otpType: OtpType.Email,
      });

      setOtpId(id);
      setEmailStep('otp');
      toast.success('OTP sent to your email!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send OTP');
    },
  });

  // Email OTP: Step 2 - Submit OTP
  const { mutateAsync: submitOtp, isPending: isSubmittingOtp } = useMutation({
    mutationFn: async () => {
      if (!otpId) {
        throw new Error('OTP session expired');
      }
      if (otp.length !== 6) {
        throw new Error('Please enter a 6-digit code');
      }

      await completeOtp({
        contact: email,
        otpCode: otp,
        otpId: otpId,
        otpType: OtpType.Email,
      });

      toast.success('Successfully authenticated!');
      
      // Close modal after successful authentication
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 500);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid OTP code');
    },
  });

  // Google OAuth
  const { mutateAsync: loginWithGoogle, isPending: isGoogleLoading } = useMutation({
    mutationFn: async () => {
      toast.loading('Opening Google sign-in...');
      
      // Turnkey OAuth flow with Google
      // Reference: https://docs.turnkey.com/getting-started/embedded-wallets/oauth
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const organizationId = import.meta.env.VITE_TURNKEY_ORGANIZATION_ID;
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '100221941705-et9onp6kl329ovess19qmnpkqu3u8a8f.apps.googleusercontent.com';
      
      // Build OAuth URL for Turnkey with Google
      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUrl,
        response_type: 'code',
        scope: 'openid email profile',
        state: organizationId, // Pass org ID in state
        prompt: 'select_account',
      });
      
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('🔐 Initiating Google OAuth:', {
        redirectUrl,
        organizationId,
        googleClientId,
      });
      
      window.location.href = oauthUrl;
    },
    onError: (error: Error) => {
      toast.dismiss();
      toast.error(error.message || 'Failed to initiate Google sign-in');
    },
  });

  // Passkey (WebAuthn)
  const { mutateAsync: loginWithPasskey, isPending: isPasskeyLoading } = useMutation({
    mutationFn: async () => {
      toast.loading('Authenticating with passkey...');
      
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys are not supported on this device');
      }

      // Create a new wallet with passkey
      // This will trigger browser's passkey prompt
      const walletId = await createWallet({
        walletName: `Passkey Wallet ${Date.now()}`,
        accounts: [
          {
            curve: 'CURVE_SECP256K1',
            pathFormat: 'PATH_FORMAT_BIP32',
            path: "m/44'/5757'/0'/0/0",
            addressFormat: 'ADDRESS_FORMAT_UNCOMPRESSED',
          },
        ],
      });

      toast.dismiss();
      toast.success('Passkey authenticated successfully!');
      
      // Close modal
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 500);
      
      return walletId;
    },
    onError: (error: Error) => {
      toast.dismiss();
      toast.error(error.message || 'Failed to authenticate with passkey');
    },
  });

  // Reset to method selection
  const goBack = () => {
    if (authMethod === 'email' && emailStep === 'otp') {
      setEmailStep('input');
      setOtp('');
      setOtpId(null);
    } else {
      setAuthMethod('select');
      setEmailStep('input');
      setEmail('');
      setOtp('');
      setOtpId(null);
    }
  };

  // Render method selection
  if (authMethod === 'select') {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Sign In to Continue
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We'll send you a verification code via email
          </p>
        </div>

        {/* Email Button - Primary Method */}
        <button
          onClick={() => setAuthMethod('email')}
          className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group"
        >
          <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Continue with Email
        </button>

        {/* Hidden: Google OAuth and Passkey for now */}
        {/* 
        <button
          onClick={() => loginWithGoogle()}
          disabled={isGoogleLoading}
          className="w-full px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <Chrome className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              Continue with Google
            </>
          )}
        </button>

        <button
          onClick={() => loginWithPasskey()}
          disabled={isPasskeyLoading}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Continue with Passkey
            </>
          )}
        </button>
        */}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
              Secure authentication powered by Turnkey
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Email Auth Flow
  if (authMethod === 'email') {
    return (
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="self-start text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to options
        </button>

        {emailStep === 'input' ? (
          <>
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSubmittingEmail && submitEmail()}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                  disabled={isSubmittingEmail}
                  autoFocus
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => submitEmail()}
              disabled={isSubmittingEmail || !email}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </>
        ) : (
          <>
            {/* OTP Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                onKeyPress={(e) => e.key === 'Enter' && otp.length === 6 && !isSubmittingOtp && submitOtp()}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                disabled={isSubmittingOtp}
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Check your email for the verification code
              </p>
            </div>

            {/* Verify Button */}
            <button
              onClick={() => submitOtp()}
              disabled={isSubmittingOtp || otp.length !== 6}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingOtp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
          </>
        )}
      </div>
    );
  }

  return null;
};
