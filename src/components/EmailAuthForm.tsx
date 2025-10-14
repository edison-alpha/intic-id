import React, { useState } from 'react';
import { useTurnkey, OtpType } from '@turnkey/react-wallet-kit';
import { useMutation } from '@tanstack/react-query';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTurnkeyWallet } from '@/contexts/TurnkeyWalletContext';

export const EmailAuthForm: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const { initOtp, completeOtp } = useTurnkey();
  const { setIsAuthModalOpen } = useTurnkeyWallet();

  // Step 1: Submit email
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
      setStep('otp');
      toast.success('OTP sent to your email!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send OTP');
    },
  });

  // Step 2: Submit OTP
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

  return (
    <div className="flex flex-col gap-4">
      {step === 'email' ? (
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
              'Continue with Email'
            )}
          </button>
        </>
      ) : (
        <>
          {/* OTP Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter 6-Digit Code
              </label>
              <button
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setOtpId(null);
                }}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
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
};
