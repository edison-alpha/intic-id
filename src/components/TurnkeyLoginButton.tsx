"use client";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { Wallet, LogOut } from "lucide-react";
import { useTurnkeyWallet } from "@/contexts/TurnkeyWalletContext";

interface TurnkeyLoginButtonProps {
  variant?: "default" | "outline" | "minimal";
  size?: "sm" | "md" | "lg";
  showBalance?: boolean;
  className?: string;
}

/**
 * Simple Turnkey Login/Logout Button Component
 *
 * Uses handleLogin from useTurnkey hook which automatically shows
 * the Turnkey authentication modal with all enabled auth methods.
 *
 * Example usage:
 * <TurnkeyLoginButton />
 * <TurnkeyLoginButton variant="outline" size="sm" />
 * <TurnkeyLoginButton showBalance />
 */
const TurnkeyLoginButton: React.FC<TurnkeyLoginButtonProps> = ({
  variant = "default",
  size = "md",
  showBalance = false,
  className = "",
}) => {
  const { handleLogin } = useTurnkey();
  const {
    isConnected,
    address,
    logout,
    stxBalance,
    sbtcBalance
  } = useTurnkeyWallet();

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg"
  };

  // Variant classes
  const variantClasses = {
    default: "bg-[#FE5C02] hover:bg-[#E54F02] text-white",
    outline: "border-2 border-[#FE5C02] text-[#FE5C02] hover:bg-[#FE5C02] hover:text-white",
    minimal: "text-[#FE5C02] hover:bg-[#FE5C02]/10"
  };

  const baseClasses = "font-medium rounded-full transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {showBalance && (
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gray-100 @dark:bg-gray-800 rounded-full text-sm">
            <div className="flex items-center gap-1.5">
              <img
                src="https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi"
                alt="sBTC"
                className="w-4 h-4"
              />
              <span className="font-medium">{sbtcBalance} sBTC</span>
            </div>
            <div className="w-px h-4 bg-gray-300 @dark:bg-gray-600" />
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="font-medium">{stxBalance} STX</span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">{formatAddress(address)}</span>
          <LogOut className="w-3 h-3 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => handleLogin()}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <Wallet className="w-4 h-4" />
      <span>Login / Sign Up</span>
    </button>
  );
};

export default TurnkeyLoginButton;
