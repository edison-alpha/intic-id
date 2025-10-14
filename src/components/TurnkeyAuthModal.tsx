import React from 'react';
import { X, Wallet } from 'lucide-react';
import { MultiAuthForm } from './MultiAuthForm';

interface TurnkeyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TurnkeyAuthModal: React.FC<TurnkeyAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to intic.id
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Secure wallet authentication powered by Turnkey
          </p>
        </div>

        {/* Multi Auth Form */}
        <MultiAuthForm />

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};
