import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Ticket,
  PlusCircle,
  LayoutDashboard,
  Home,
  Briefcase,
  Settings,
  FileText,
  Wallet,
  LogOut,
  ChevronLeft,
  Search,
  TrendingUp,
  Vote,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import inticDarkSvg from '../assets/inticdark.svg';
import logoOrangePng from '../assets/logoorange.png';
import stxLogo from '../assets/stx.jpg';
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { getFullProfile, type FullProfile } from "@/services/profileService";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPermanentExpanded, setIsPermanentExpanded] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [userProfile, setUserProfile] = useState<FullProfile | null>(null);

  // Wallet integration
  const { wallet, isWalletConnected, disconnectWallet, getBalance } = useWallet();

  const menuItems = [
    { path: "/app", icon: Home, label: "Browse Events", exact: true },
    { path: "/app/my-tickets", icon: Ticket, label: "My Tickets" },
    { path: "/app/staking", icon: TrendingUp, label: "Staking" },
    { path: "/app/governance", icon: Vote, label: "Governance" },
    { path: "/app/portofolio", icon: LayoutDashboard, label: "Portofolio" }
  ];

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    setIsPermanentExpanded(false); // Reset permanent expanded when toggling
  };

  // Handle double click on sidebar to toggle between overlay and full sidebar mode
  const handleSidebarDoubleClick = () => {
    if (isSidebarCollapsed && isHovering) {
      // From collapsed + hover (overlay mode) → Full sidebar (permanent)
      setIsPermanentExpanded(true);
      setIsSidebarCollapsed(false);
    } else if (!isSidebarCollapsed && !isPermanentExpanded) {
      // From full sidebar (permanent) → Collapsed (overlay mode)
      setIsSidebarCollapsed(true);
      setIsPermanentExpanded(false);
    }
  };

  // Determine if sidebar should be expanded
  const isSidebarExpanded = !isSidebarCollapsed || (isHovering && !isPermanentExpanded);

  // Fetch balance when wallet is connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isWalletConnected && wallet) {
        setIsLoadingBalance(true);
        try {
          const bal = await getBalance();
          setBalance(bal);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(0);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [isWalletConnected, wallet, getBalance]);

  // Fetch user profile when wallet is connected
  useEffect(() => {
    const fetchProfile = async () => {
      if (isWalletConnected && wallet?.address) {
        try {
          const profile = await getFullProfile(wallet.address);
          console.log('👤 AppLayout - Profile loaded:', {
            username: profile.username,
            hasAvatar: !!profile.avatar,
            avatarPreview: profile.avatar?.substring(0, 50) + '...'
          });
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchProfile();

    // Refresh profile every 60 seconds
    const interval = setInterval(fetchProfile, 60000);

    return () => clearInterval(interval);
  }, [isWalletConnected, wallet?.address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic profile menu
  const profileMenuItems = [
    { icon: Briefcase, label: "Portfolio", path: "/app/portofolio" },
    { icon: Settings, label: "Settings", path: "/app/settings" },
    { icon: FileText, label: "Terms & Conditions", path: "/app/terms" },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A]">
      {/* Backdrop Blur Overlay - Only when sidebar is collapsed and hovering (overlay mode) */}
      {isSidebarCollapsed && isHovering && !isPermanentExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:block hidden transition-opacity duration-300" 
          onDoubleClick={handleSidebarDoubleClick}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onDoubleClick={handleSidebarDoubleClick}
        className={`hidden md:flex flex-col bg-[#1A1A1A] border-r border-gray-800 transition-all duration-300 ease-in-out fixed left-0 top-0 bottom-0 h-screen z-40 ${
          isSidebarExpanded ? "w-64" : "w-20"
        } ${
          isSidebarCollapsed && isHovering && !isPermanentExpanded ? "shadow-2xl" : ""
        }`}
        title={
          isSidebarCollapsed && isHovering 
            ? "Double-click to pin sidebar" 
            : !isSidebarCollapsed 
            ? "Double-click to collapse sidebar" 
            : ""
        }
      >
        {/* Logo & Toggle */}
        <div className={`h-16 flex items-center border-b border-gray-800 ${
          isSidebarExpanded ? "justify-between px-4" : "justify-center px-3"
        }`}>
          {isSidebarExpanded && (
            <a href="/" className="flex items-center gap-2">
              <img src={inticDarkSvg} alt="intic.id" className="h-8 w-auto" />
            </a>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {!isSidebarExpanded ? (
              <img src={logoOrangePng} alt="Logo" className="w-8 h-8" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-2 ${isSidebarExpanded ? "px-3" : "px-3"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg transition-all duration-200 group ${
                  isSidebarExpanded ? "px-3 py-3" : "justify-center px-3 py-3"
                } ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                title={!isSidebarExpanded ? item.label : ""}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#FE5C02]" : ""}`} />
                {isSidebarExpanded && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Create Event Button */}
        <div className={`border-t border-gray-800 ${isSidebarExpanded ? "px-3 py-4" : "px-3 py-4"}`}>
          <NavLink
            to="/app/create-event"
            className={`flex items-center gap-2 bg-[#FE5C02] hover:bg-[#E54F00] text-white rounded-full transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl ${
              isSidebarExpanded ? "justify-center px-3 py-3" : "justify-center px-3 py-3"
            }`}
            title={!isSidebarExpanded ? "Create" : ""}
          >
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && <span>Create</span>}
          </NavLink>
        </div>

        {/* User Section */}
        <div className={`border-t border-gray-800 ${isSidebarExpanded ? "p-4" : "p-3"}`}>
          {isSidebarExpanded ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : isWalletConnected && wallet?.address ? (
                    wallet.address.slice(0, 2).toUpperCase()
                  ) : (
                    'A'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile?.username || (isWalletConnected && wallet?.address
                      ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                      : 'Anonymous'
                    )}
                  </p>
                  <p className={`text-xs truncate ${isWalletConnected ? 'text-green-400' : 'text-gray-500'}`}>
                    {isWalletConnected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </button>

              {/* Dropdown Menu - Desktop Expanded */}
              {isDropdownOpen && (
                <div className="fixed bottom-20 left-4 w-56 bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                  {profileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={index}
                        to={item.path}
                        onClick={(e) => {
                          console.log('Desktop Expanded - Navigating to:', item.path);
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer relative"
                title="Profile Menu"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : isWalletConnected && wallet?.address ? (
                    wallet.address.slice(0, 2).toUpperCase()
                  ) : (
                    'A'
                  )}
                </div>
                {isWalletConnected && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1A1A1A]"></div>
                )}
              </button>

              {/* Dropdown Menu - Desktop Collapsed */}
              {isDropdownOpen && (
                <div className="fixed bottom-20 left-20 w-56 bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                  {profileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={index}
                        to={item.path}
                        onClick={(e) => {
                          console.log('Desktop Collapsed - Navigating to:', item.path);
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Desktop Navbar - Fixed */}
      <nav className={`hidden md:block fixed top-0 right-0 z-30 bg-[#0A0A0A]/30 backdrop-blur-md border-b border-gray-800/30 transition-all duration-300 ${
        !isSidebarCollapsed ? "left-64" : "left-[84px]"
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FE5C02] focus:ring-1 focus:ring-[#FE5C02] transition-all"
              />
            </div>

            {/* Wallet Connect Button */}
            {isWalletConnected ? (
              <div className="flex items-center gap-2">
                {/* Balance Display */}
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  {isLoadingBalance ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {balance !== null ? balance.toFixed(4) : '0.0000'}
                      </span>
                      <img
                        src={stxLogo}
                        alt="STX"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    </>
                  )}
                </div>

                {/* Wallet Address */}
                <div className="flex items-center gap-2 bg-green-600/20 border border-green-600/30 text-green-400 px-3 py-2 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="hidden lg:inline">
                    {wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Connected'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wallet?.address || '');
                      toast.success('Address copied to clipboard!');
                    }}
                    className="ml-1 p-1 hover:bg-green-600/30 rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-2 hover:bg-gray-800 active:bg-gray-700 rounded-xl transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 bg-[#FE5C02] hover:bg-[#E54F00] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        !isSidebarCollapsed ? "md:ml-64" : "md:ml-[84px]"
      }`}>
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-30 pt-safe-area-inset-top">
          <a href="/" className="flex items-center gap-2">
            <img src={inticDarkSvg} alt="intic.id" className="h-8 w-auto" />
          </a>
          
          {/* Right Side: Avatar + Wallet */}
          <div className="flex items-center gap-4">
            {/* Wallet Button - Mobile */}
            <button
              onClick={() => isWalletConnected ? disconnectWallet() : setShowWalletModal(true)}
              className="p-3 hover:bg-gray-800/50 active:bg-gray-700/50 rounded-2xl transition-all duration-200"
              title={isWalletConnected ? "Disconnect Wallet" : "Connect Wallet"}
            >
              <Wallet className={`w-6 h-6 ${isWalletConnected ? 'text-green-400' : 'text-white'}`} />
            </button>
            
            {/* Profile Avatar with Dropdown */}
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center relative p-1"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : isWalletConnected && wallet?.address ? (
                  wallet.address.slice(0, 2).toUpperCase()
                ) : (
                  'A'
                )}
              </div>
              {isWalletConnected && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1A1A1A] shadow-sm"></div>
              )}
            </button>

            {/* Dropdown Menu - Mobile */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#1A1A1A] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-br from-[#FE5C02]/10 to-purple-600/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FE5C02] to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : isWalletConnected && wallet?.address ? (
                        wallet.address.slice(0, 2).toUpperCase()
                      ) : (
                        'A'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {userProfile?.username || (isWalletConnected ? `${wallet?.address?.slice(0, 6)}...${wallet?.address?.slice(-4)}` : 'Anonymous')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isWalletConnected ? 'Connected' : 'Not Connected'}
                      </p>
                    </div>
                    {isWalletConnected && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(wallet?.address || '');
                          toast.success('Address copied to clipboard!');
                        }}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Balance Display - Mobile */}
                  {isWalletConnected && (
                    <div className="flex items-center justify-between bg-[#FE5C02]/20 border border-[#FE5C02]/30 rounded-lg px-3 py-2 mt-2">
                      <span className="text-xs text-gray-400">Balance:</span>
                      {isLoadingBalance ? (
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-[#FE5C02] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-[#FE5C02] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-[#FE5C02] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[#FE5C02]">
                            {balance !== null ? balance.toFixed(4) : '0.0000'}
                          </span>
                          <img
                            src={stxLogo}
                            alt="STX"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                {profileMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={index}
                      to={item.path}
                      onClick={(e) => {
                        console.log('Mobile - Navigating to:', item.path);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800 active:bg-gray-700 transition-colors text-gray-300 hover:text-white border-b border-gray-800 last:border-b-0"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto md:pb-0 pb-20 md:pt-24 pt-16">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-gray-800/50 z-30 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-20 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 rounded-xl mx-1"
                >
                  <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? "bg-[#FE5C02]/20" : "hover:bg-gray-800/50"}`}>
                    <Icon className={`w-6 h-6 ${isActive ? "text-[#FE5C02]" : "text-gray-400"}`} />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-[#FE5C02]" : "text-gray-400"}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </NavLink>
              );
            })}
            
            {/* Create Event Button */}
            <NavLink
              to="/app/create-event"
              className="flex flex-col items-center justify-center flex-1 h-full gap-1"
            >
              <div className="w-14 h-14 bg-[#FE5C02] rounded-2xl flex items-center justify-center -mt-8 shadow-2xl shadow-[#FE5C02]/30 border-4 border-[#0A0A0A]">
                <PlusCircle className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-[#FE5C02] font-semibold mt-1">Create</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </div>

    {/* Wallet Connect Modal */}
    <WalletConnectModal
      isOpen={showWalletModal}
      onClose={() => setShowWalletModal(false)}
    />
  </>

);

};

export default AppLayout;
