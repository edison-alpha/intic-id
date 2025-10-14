import React, { useState } from "react";
import { X, Wallet, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useTurnkeyWallet } from "@/contexts/TurnkeyWalletContext";
import { formatSBTC } from "@/config/sbtc";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { 
    isConnected, 
    address, 
    sbtcBalance,
    stxBalance,
    isLoading, 
    error,
    connectWallet, 
    logout
  } = useTurnkeyWallet();
  
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    await connectWallet();
    // Close modal after successful connection
    if (!error) {
      setTimeout(() => onClose(), 1500);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FE5C02]/10 rounded-2xl flex items-center justify-center">
            <Wallet className="w-8 h-8 text-[#FE5C02]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isConnected ? "Wallet Connected" : "Connect Turnkey Wallet"}
          </h2>
          <p className="text-sm text-gray-400">
            {isConnected 
              ? "Your embedded wallet is ready for sBTC transactions" 
              : "Create a secure embedded wallet powered by Turnkey"
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-500">Connection Error</p>
              <p className="text-xs text-red-500/70 mt-0.5">{error.message}</p>
            </div>
          </div>
        )}

        {/* Connected State */}
        {isConnected && address ? (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-500">Successfully connected</p>
                <p className="text-xs text-green-500/70 mt-0.5">You can now transact with sBTC</p>
              </div>
            </div>

            {/* Address Display */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Your Address</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-mono text-white truncate">{address}</p>
                <button
                  onClick={handleCopyAddress}
                  className="flex-shrink-0 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="text-white font-medium">Stacks Testnet</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Wallet Provider</span>
                <span className="text-white font-medium">Turnkey Embedded</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <img src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi" alt="sBTC" className="w-4 h-4" />
                  sBTC Balance
                </span>
                <span className="text-white font-medium">{sbtcBalance} sBTC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  STX Balance
                </span>
                <span className="text-white font-medium">{stxBalance} STX</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDisconnect}
                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors"
              >
                Disconnect
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#FE5C02] hover:bg-[#E54F02] text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Turnkey Wallet Connection */
          <div className="space-y-4">
            {/* Turnkey Info Card */}
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-[#FE5C02]/10 rounded-lg">
                  <Wallet className="w-5 h-5 text-[#FE5C02]" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Turnkey Embedded Wallet</h3>
                  <p className="text-xs text-gray-400">
                    Secure, non-custodial wallet with WebAuthn authentication
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>No seed phrases to manage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Biometric authentication support</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Full sBTC transaction support</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Stacks testnet ready</span>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full py-4 bg-[#FE5C02] hover:bg-[#E54F02] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Wallet...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Create Turnkey Wallet</span>
                </>
              )}
            </button>

            {/* Info Note */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-300">
                Your wallet is secured by Turnkey's infrastructure with passkey authentication. Test on Stacks testnet with real sBTC transactions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
