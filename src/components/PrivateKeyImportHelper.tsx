/**
 * Private Key Import Helper Component
 * Use this ONLY for testing/development
 * 
 * Add this to your CreateEventNFT or create a separate settings page
 */

import { useState } from 'react';
import { setPrivateKeyForAddress } from '@/services/turnkeyHelper';
import { toast } from 'sonner';

export function PrivateKeyImportHelper({ address }: { address: string }) {
  const [privateKey, setPrivateKey] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleImport = () => {
    try {
      if (!privateKey || privateKey.length < 64) {
        toast.error('Invalid private key format');
        return;
      }

      // Normalize the key (remove 0x prefix if present)
      const normalizedKey = privateKey.startsWith('0x') 
        ? privateKey.substring(2) 
        : privateKey;

      setPrivateKeyForAddress(address, normalizedKey);
      
      toast.success('Private key imported successfully!');
      setPrivateKey('');
      setShowInput(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import private key');
    }
  };

  // Check if key is already set
  const hasKey = !!localStorage.getItem(`pulse_private_key_${address}`);

  return (
    <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-yellow-500 text-xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-200 mb-1">
            Private Key Required for Deployment
          </h3>
          
          {hasKey ? (
            <div className="text-sm text-green-400">
              ✅ Private key is set for this address
            </div>
          ) : (
            <div className="text-sm text-yellow-100 space-y-3">
              <p>
                Your Turnkey wallet needs a private key to sign transactions.
                Import your private key to enable contract deployment.
              </p>
              
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white text-sm font-medium"
                >
                  Import Private Key
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key (64 hex characters)"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white text-sm font-medium"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => {
                        setShowInput(false);
                        setPrivateKey('');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    ⚠️ Your private key is stored in browser localStorage for demo purposes only.
                    Never share your private key with anyone!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Console Helper Script
 * Copy-paste this into browser console to import private key manually
 */
export const consoleImportScript = `
// STEP 1: Set your private key here
const myPrivateKey = 'YOUR_64_CHARACTER_PRIVATE_KEY_HERE';
const myAddress = 'ST2NQ23A3FFSSGC4JSD25STVPRWXXJNMY4ZXN6OQS';

// STEP 2: Run this to import
localStorage.setItem(\`pulse_private_key_\${myAddress}\`, myPrivateKey);
console.log('✅ Private key imported for', myAddress);

// STEP 3: Verify it works
console.log('Private key set:', !!localStorage.getItem(\`pulse_private_key_\${myAddress}\`));
`;
