import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Bell,
  Upload,
  Save,
  Download,
  Trash2,
  Camera,
  Globe,
  Moon,
  Sun,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  getFullProfile,
  saveProfile,
  uploadToIPFS,
  isUsernameAvailable,
  createDefaultProfile,
  clearCache,
  type FullProfile,
  type ProfileData,
} from '@/services/profileService';
import { getStoredEmail, storeEmail } from '@/services/ticketPurchaseNotification';

const Settings = () => {
  const { wallet, callContractFunction } = useWallet();
  const walletAddress = wallet?.address;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // App preferences
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark');
  const [language, setLanguage] = useState<'en' | 'id'>('en');

  useEffect(() => {
    if (walletAddress) {
      // Clear cache to ensure fresh data from smart contract
      clearCache(walletAddress);
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [walletAddress]);

  const loadProfile = async () => {
    if (!walletAddress) return;

    setLoading(true);

    try {
      // Get profile from smart contract + IPFS
      const userProfile = await getFullProfile(walletAddress);

      // Load stored email from notification service if not in profile
      const storedEmail = getStoredEmail();
      if (storedEmail && !userProfile.email) {
        userProfile.email = storedEmail;
      }

      setProfile(userProfile);
      setUsername(userProfile.username || '');
      setEmail(userProfile.email || '');
      setBio(userProfile.bio || '');
      setAvatarUrl(userProfile.avatar || '');

      setEmailNotifications(userProfile.preferences?.notifications?.email ?? true);
      setPushNotifications(userProfile.preferences?.notifications?.push ?? true);

      setTheme(userProfile.preferences?.theme || 'dark');
      setLanguage(userProfile.preferences?.language || 'en');

    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!walletAddress || !profile) return;

    setSaving(true);

    try {
      // Validate email
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast.error('Invalid email address');
          setSaving(false);
          return;
        }
      }

      // Validate username
      if (!username || username.length === 0) {
        toast.error('Username is required');
        setSaving(false);
        return;
      }

      if (username.length > 32) {
        toast.error('Username must be 32 characters or less');
        setSaving(false);
        return;
      }

      // Check if username changed and is available
      if (username !== profile.username) {
        const available = await isUsernameAvailable(username);
        if (!available) {
          toast.error('Username is already taken');
          setSaving(false);
          return;
        }
      }

      // Prepare metadata for IPFS
      const metadata: ProfileData = {
        email,
        bio,
        avatar: avatarUrl,
        preferences: {
          theme,
          language,
          notifications: {
            email: emailNotifications,
            push: pushNotifications,
          },
        },
      };

      // Save to smart contract + IPFS
      toast.loading('Uploading to IPFS...', { id: 'saving' });
      await saveProfile(walletAddress, username, metadata, callContractFunction);

      // Update email in notification service
      if (email) {
        storeEmail(email);
      }

      toast.success('Profile saved successfully! Transaction submitted.', { id: 'saving' });

      // Reload profile after a delay to get updated data
      setTimeout(() => {
        clearCache(walletAddress);
        loadProfile();
      }, 3000);

    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error.message || 'Failed to save profile', { id: 'saving' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!walletAddress) return;

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        toast.success('Avatar uploaded! Remember to save changes.');
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleExportProfile = () => {
    if (!walletAddress || !profile) return;

    const exportData = {
      address: walletAddress,
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      avatar: profile.avatar,
      preferences: profile.preferences,
      ipfsHash: profile.ipfsHash,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      exportedAt: new Date().toISOString(),
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intic-profile-${walletAddress.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Profile exported successfully!');
  };

  const handleDeleteProfile = () => {
    if (!walletAddress) return;

    const confirmed = window.confirm(
      'Note: This will only clear your local cache. Your profile on the blockchain and IPFS will remain. Are you sure?'
    );

    if (!confirmed) return;

    clearCache(walletAddress);
    toast.success('Local cache cleared');
    loadProfile();
  };

  if (!walletAddress) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to access settings
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-[#FE5C02] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your profile and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#FE5C02]" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 bg-[#FE5C02] hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-white mb-2 block">Profile Picture</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Upload a custom avatar or use the auto-generated one
                  </p>
                  <p className="text-xs text-gray-500">
                    Recommended: Square image, max 2MB
                  </p>
                </div>
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username" className="text-white mb-2 block">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                  placeholder="Enter your username (alphanumeric, max 32 chars)"
                  maxLength={32}
                  className="bg-[#0A0A0A] border-gray-800 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only letters, numbers, hyphens, and underscores. Max 32 characters.
                </p>
              </div>

              {/* Wallet Address (Read-only) */}
              <div>
                <Label className="text-white mb-2 block">Wallet Address</Label>
                <Input
                  value={walletAddress}
                  readOnly
                  className="bg-[#0A0A0A] border-gray-800 text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio" className="text-white mb-2 block">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="bg-[#0A0A0A] border-gray-800 text-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Email & Notifications */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FE5C02]" />
                Email & Notifications
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-white mb-2 block">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="bg-[#0A0A0A] border-gray-800 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for ticket confirmations and event reminders
                </p>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Receive purchase confirmations and event reminders
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-white">Push Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Get browser notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#FE5C02]" />
                App Preferences
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div>
                <Label className="text-white mb-3 block">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-[#FE5C02] bg-[#FE5C02]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm text-white">Light</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-[#FE5C02] bg-[#FE5C02]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-sm text-white">Dark</p>
                  </button>
                  <button
                    onClick={() => setTheme('auto')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'auto'
                        ? 'border-[#FE5C02] bg-[#FE5C02]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-white">Auto</p>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <Label className="text-white mb-3 block">Language</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      language === 'en'
                        ? 'border-[#FE5C02] bg-[#FE5C02]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <span className="text-white">English</span>
                    {language === 'en' && <Check className="w-4 h-4 ml-auto text-[#FE5C02]" />}
                  </button>
                  <button
                    onClick={() => setLanguage('id')}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      language === 'id'
                        ? 'border-[#FE5C02] bg-[#FE5C02]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">🇮🇩</span>
                    <span className="text-white">Indonesia</span>
                    {language === 'id' && <Check className="w-4 h-4 ml-auto text-[#FE5C02]" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-[#FE5C02]" />
                Data Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Export or delete your profile data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleExportProfile}
                  variant="outline"
                  className="flex-1 border-gray-700 hover:border-[#FE5C02] hover:text-[#FE5C02]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Profile
                </Button>
                <Button
                  onClick={handleDeleteProfile}
                  variant="outline"
                  className="flex-1 border-red-900 text-red-500 hover:bg-red-900/20 hover:border-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 sticky bottom-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="bg-gradient-to-r from-[#FE5C02] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
