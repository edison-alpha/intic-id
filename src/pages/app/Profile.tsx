import React, { useState } from "react";
import AppLayout from "@/components/app/AppLayout";
import ProofOfFandomBadges from "@/components/ProofOfFandomBadges";
import {
  Copy,
  Bell,
  Mail,
  Shield,
  LogOut,
  Wallet
} from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const walletAddress = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
  const balance = "1,250.50";

  const stats = [
    { label: "Events Attended", value: "12", color: "from-[#FE5C02] to-orange-600" },
    { label: "Tickets Owned", value: "8", color: "from-purple-500 to-purple-600" },
    { label: "Events Created", value: "5", color: "from-blue-500 to-blue-600" }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet address copied!");
  };

  const handleDisconnect = () => {
    toast.error("Wallet disconnected");
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 md:px-6 md:py-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Profile</h1>
          <p className="text-sm md:text-base text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Wallet Card */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 mb-6 md:mb-8">
          <div className="flex items-start justify-between mb-5 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl md:text-2xl">A</span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white mb-1">Anonymous User</h2>
                <p className="text-gray-400 text-xs md:text-sm">Member since May 2025</p>
              </div>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl md:rounded-xl p-4 md:p-6 mb-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FE5C02]" />
                <span className="text-gray-400 text-xs md:text-sm">Wallet Address</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 md:px-3 py-2 md:py-1.5 bg-[#FE5C02] active:bg-[#E54F02] md:hover:bg-[#E54F02] text-white text-xs md:text-sm font-medium rounded-xl md:rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
            <p className="text-white font-mono text-xs md:text-sm break-all">{walletAddress}</p>
          </div>

          {/* Balance */}
          <div className="bg-gradient-to-br from-[#FE5C02]/10 to-purple-600/10 border border-[#FE5C02]/20 rounded-2xl md:rounded-xl p-5 md:p-6">
            <p className="text-gray-400 text-xs md:text-sm mb-2">Available Balance</p>
            <p className="text-3xl md:text-4xl font-bold text-[#FE5C02] mb-1">{balance} <span className="text-xl md:text-2xl">STX</span></p>
            <p className="text-gray-400 text-xs md:text-sm">≈ ${(parseFloat(balance.replace(',', '')) * 0.5).toFixed(2)} USD</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-4 md:p-6 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
              <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2 line-clamp-2">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 mb-4 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-5 md:mb-6">Settings</h2>

          <div className="space-y-5 md:space-y-6">
            {/* Notification Toggle */}
            <div className="flex items-start md:items-center justify-between gap-3">
              <div className="flex items-start md:items-center gap-3 flex-1">
                <div className="p-2 md:p-2 bg-[#0A0A0A] rounded-xl md:rounded-lg flex-shrink-0">
                  <Bell className="w-5 h-5 text-[#FE5C02]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm md:text-base font-medium mb-0.5">Push Notifications</p>
                  <p className="text-gray-400 text-xs md:text-sm">Receive alerts about events and tickets</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-12 h-6 md:w-12 md:h-6 rounded-full transition-colors flex-shrink-0 ${
                  notifications ? "bg-[#FE5C02]" : "bg-gray-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Email Updates Toggle */}
            <div className="flex items-start md:items-center justify-between gap-3">
              <div className="flex items-start md:items-center gap-3 flex-1">
                <div className="p-2 md:p-2 bg-[#0A0A0A] rounded-xl md:rounded-lg flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#FE5C02]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm md:text-base font-medium mb-0.5">Email Updates</p>
                  <p className="text-gray-400 text-xs md:text-sm">Get news and updates via email</p>
                </div>
              </div>
              <button
                onClick={() => setEmailUpdates(!emailUpdates)}
                className={`relative w-12 h-6 md:w-12 md:h-6 rounded-full transition-colors flex-shrink-0 ${
                  emailUpdates ? "bg-[#FE5C02]" : "bg-gray-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    emailUpdates ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Two-Factor Toggle */}
            <div className="flex items-start md:items-center justify-between gap-3">
              <div className="flex items-start md:items-center gap-3 flex-1">
                <div className="p-2 md:p-2 bg-[#0A0A0A] rounded-xl md:rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#FE5C02]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm md:text-base font-medium mb-0.5">Two-Factor Authentication</p>
                  <p className="text-gray-400 text-xs md:text-sm">Add an extra layer of security</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFactor(!twoFactor)}
                className={`relative w-12 h-6 md:w-12 md:h-6 rounded-full transition-colors flex-shrink-0 ${
                  twoFactor ? "bg-[#FE5C02]" : "bg-gray-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    twoFactor ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Disconnect Wallet */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Danger Zone</h2>
          <p className="text-gray-400 text-xs md:text-sm mb-4">
            Disconnecting your wallet will log you out and remove your session data.
          </p>
          <button
            onClick={handleDisconnect}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3.5 md:py-3 bg-[#0A0A0A] border-2 border-red-500/20 active:border-red-500 md:hover:border-red-500 text-red-500 text-sm md:text-base font-semibold rounded-2xl md:rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Disconnect Wallet
          </button>
        </div>

        {/* Proof of Fandom NFT Badges */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl md:rounded-2xl p-5 md:p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Proof of Fandom NFT Badges</h2>
          <ProofOfFandomBadges />
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
