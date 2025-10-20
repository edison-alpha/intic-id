import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Key, Loader2, Smartphone, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectWallet, isWalletConnected, isMobile, connectMobileWallet } = useWallet();
  const [showQR, setShowQR] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState('');

  // Check if we're in Xverse in-app browser
  const isInXverseApp = typeof window !== 'undefined' && window.XverseProvider;

  const handleConnect = async () => {
    try {
      await connectWallet();
      onClose();
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      if (error.message === 'MOBILE_WALLET_REQUIRED') {
        // Modal will show mobile options instead
        return;
      }
      // Handle other errors
    }
  };

  const handleMobileConnect = async (walletType: 'xverse' | 'leather-mobile') => {
    try {
      await connectMobileWallet(walletType);
      onClose();
    } catch (error) {
      console.error('Mobile wallet connection failed:', error);
    }
  };

  const generateQRCode = (walletType: 'xverse' | 'leather-mobile') => {
    const callbackUrl = `${window.location.origin}?wallet=${walletType}`;
    const url = walletType === 'xverse'
      ? `xverse://connect?callback=${encodeURIComponent(callbackUrl)}&network=testnet&dapp=intic`
      : `leather://connect?callback=${encodeURIComponent(callbackUrl)}&network=testnet`;

    setConnectionUrl(url);
    setShowQR(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-center">
            {isMobile
              ? "Connect your mobile wallet to access Stacks features securely."
              : "Connect your Stacks wallet to access Stacks features securely."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {isMobile ? (
            // Mobile wallet options
            <>
              {isInXverseApp ? (
                // User is already in Xverse in-app browser
                <div className="text-center p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Xverse Detected!</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    You're using Xverse in-app browser. Click below to connect your wallet.
                  </p>
                  <Button
                    onClick={handleConnect}
                    className="w-full flex items-center gap-3 h-12 bg-[#FE5C02] hover:bg-[#E54F02] text-white"
                  >
                    <Smartphone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Connect Xverse Wallet</div>
                      <div className="text-xs opacity-90">Already in Xverse browser</div>
                    </div>
                  </Button>
                </div>
              ) : (
                // Regular mobile options
                <>
                  <Button
                    onClick={() => handleMobileConnect('xverse')}
                    className="w-full flex items-center gap-3 h-12 bg-[#FE5C02] hover:bg-[#E54F02] text-white"
                  >
                    <Smartphone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Xverse Wallet</div>
                      <div className="text-xs opacity-90">Mobile wallet for Stacks</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleMobileConnect('leather-mobile')}
                    variant="outline"
                    className="w-full flex items-center gap-3 h-12"
                  >
                    <Wallet className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Leather Mobile</div>
                      <div className="text-xs opacity-90">Mobile wallet app</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => generateQRCode('xverse')}
                    variant="outline"
                    className="w-full flex items-center gap-3 h-12"
                  >
                    <QrCode className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">QR Code</div>
                      <div className="text-xs opacity-90">Scan with any Stacks wallet</div>
                    </div>
                  </Button>
                </>
              )}

              {showQR && connectionUrl && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Scan QR code with your wallet app:</p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {/* Placeholder for QR code - you would integrate a QR code library here */}
                    <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                      QR Code Placeholder<br/>
                      <span className="text-xs break-all max-w-24">{connectionUrl.substring(0, 50)}...</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(connectionUrl)}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Desktop wallet options
            <Button
              onClick={handleConnect}
              disabled={isWalletConnected}
              className="w-full flex items-center gap-3 h-12 bg-[#FE5C02] hover:bg-[#E54F02] text-white"
            >
              <Wallet className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">
                  {isWalletConnected ? 'Wallet Connected' : 'Connect Stacks Wallet'}
                </div>
                <div className="text-xs opacity-90">
                  {isWalletConnected ? 'Your wallet is ready to use' : 'Secure wallet for Stacks'}
                </div>
              </div>
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            {isMobile
              ? "By connecting, you agree to use Stacks wallet infrastructure. Your keys are non-custodial and encrypted."
              : "By connecting, you agree to use Stacks wallet infrastructure. Your keys are non-custodial and encrypted."
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};