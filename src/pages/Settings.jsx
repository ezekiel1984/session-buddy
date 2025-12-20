import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut, Crown, User as UserIcon, Download, Trash2, Mail, Smartphone, Loader2, Shield, ExternalLink, ChevronDown, ChevronUp, Leaf, Lock, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import StatsCard from '@/components/StatsCard';
import AgeGate from '@/components/AgeGate';
import { useNativelyEnvironment } from '@/components/utils/natively';
import InstallAppModal from '@/components/InstallAppModal';
import LoadingScreen from '@/components/LoadingScreen';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/components/utils/logger';

// Placeholder for BADGE_DEFINITIONS. In a real application, this would typically be imported from a separate constants file.
const BADGE_DEFINITIONS = {
  FIRST_SESSION: {
    id: 'FIRST_SESSION',
    name: 'First Session',
    icon: '🌱',
    description: 'Logged your very first session.'
  },
  TEN_SESSIONS: {
    id: 'TEN_SESSIONS',
    name: 'Ten Sessions',
    icon: '🌳',
    description: 'Logged 10 sessions.'
  },
  PREMIUM_MEMBER: {
    id: 'PREMIUM_MEMBER',
    name: 'Premium Member',
    icon: '👑',
    description: 'Became a Premium member.'
  },
  // Add more badge definitions as needed
  EARLY_BIRD: {
    id: 'EARLY_BIRD',
    name: 'Early Bird',
    icon: '🐣',
    description: 'Joined during early access.'
  }
};


export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Delete Account states
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const { isNativeApp } = useNativelyEnvironment();

  // New states for weight, tolerance, and advanced settings
  const [weightInput, setWeightInput] = useState(''); // Stores weight as displayed (kg or lbs)
  const [savingWeight, setSavingWeight] = useState(false);
  const [showAdvancedTolerance, setShowAdvancedTolerance] = useState(false);
  const [metabolismAdj, setMetabolismAdj] = useState(0); // -20 to 20
  const [savingMetabolism, setSavingMetabolism] = useState(false);


  // Profile related states, now consolidated into a single formData object
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    // tolerance: 'medium', // Moved to its own section
    // weightKg: '', // Moved to its own section
    // units: 'metric', // Moved to its own section
    preferredTone: 'zen',
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch sessions for badge display and stats, using react-query
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['settings-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const allSessions = await base44.entities.Session.filter(
        { uid: user.id },
        '-created_date',
        10
      );
      return allSessions;
    },
    enabled: !!user?.id && !loading // Only run query if user ID is available and main user loading is done
  });

  // badges query is removed as per instructions. Badges are now managed on the Insights page for Premium users.

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
          await base44.auth.redirectToLogin(window.location.href);
          return;
        }

        logger.debug('[Settings] Loaded user:', {
          id: currentUser.id,
          isPremium: currentUser.isPremium,
          stripeCustomerId: currentUser.stripeCustomerId
        });

        if (!currentUser.ageConfirmed) {
          setUser(currentUser);
          setShowAgeGate(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        
        // Initialize formData from user data
        setFormData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          preferredTone: currentUser.preferredTone || 'zen',
        });

        // Initialize separate states for new sections
        setWeightInput(currentUser.weightKg ? 
          (currentUser.units === 'imperial' ? 
            (currentUser.weightKg * 2.20462).toFixed(1) : 
            currentUser.weightKg.toString()) : '');
        setMetabolismAdj(currentUser.metabolismAdj !== undefined ? currentUser.metabolismAdj : 0);
        
        setLoading(false);
      } catch (error) {
        logger.error('[Settings] Error loading user:', error);
        
        const errorMessage = error?.message || String(error);
        const isAuthError = errorMessage.toLowerCase().includes('logged in') ||
                          errorMessage.toLowerCase().includes('unauthorized');
        
        if (isAuthError) {
          await base44.auth.redirectToLogin(window.location.pathname);
        } else {
          toast.error('Error loading settings');
          setLoading(false);
        }
      }
    };
    loadUser();
  }, []);

  // Force refresh user data when returning to page (detect if we came back from Stripe)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        logger.debug('[Settings] Page became visible, refreshing user data');
        try {
          const currentUser = await base44.auth.me();
          logger.debug('[Settings] Refreshed user premium status:', currentUser.isPremium);
          setUser(currentUser);
          // Re-initialize dynamic states as well
          setWeightInput(currentUser.weightKg ? 
            (currentUser.units === 'imperial' ? 
              (currentUser.weightKg * 2.20462).toFixed(1) : 
              currentUser.weightKg.toString()) : '');
          setMetabolismAdj(currentUser.metabolismAdj !== undefined ? currentUser.metabolismAdj : 0);
        } catch (error) {
          logger.error('[Settings] Error refreshing user:', error);
          const errorMessage = error?.message || String(error);
          const isAuthError = errorMessage.toLowerCase().includes('logged in') ||
                            errorMessage.toLowerCase().includes('unauthorized');
          if (isAuthError) {
              await base44.auth.redirectToLogin(window.location.pathname);
          } else {
              toast.error('Failed to refresh user data.');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updateData = {
        firstName: formData.firstName.trim() || null,
        lastName: formData.lastName.trim() || null,
        preferredTone: formData.preferredTone,
      };

      await base44.auth.updateMe(updateData);
      
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setFormData({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        preferredTone: updatedUser.preferredTone || 'zen',
      });
      
      toast.success('Profile saved successfully');
    } catch (error) {
      logger.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleWeightSave = async () => {
    setSavingWeight(true);
    try {
        let weightInKgToSave = parseFloat(weightInput);
        if (isNaN(weightInKgToSave) || weightInKgToSave <= 0) {
            toast.error('Please enter a valid positive weight.');
            setSavingWeight(false);
            return;
        }

        let currentUnits = user.units || 'metric'; // Use current user units for conversion base
        if (currentUnits === 'imperial') {
            weightInKgToSave = weightInKgToSave / 2.20462; // Convert lbs to kg for saving
        }

        await base44.auth.updateMe({ weightKg: weightInKgToSave });
        const updatedUser = await base44.auth.me(); // Refresh user data to get latest state
        setUser(updatedUser);
        toast.success('Weight saved successfully!');
    } catch (error) {
        logger.error('Error saving weight:', error);
        toast.error('Failed to save weight.');
    } finally {
        setSavingWeight(false);
    }
  };

  const handleUnitsChange = async (newUnits) => {
    if (!user) return; // User must be loaded
    try {
      let currentWeightVal = parseFloat(weightInput);
      let newWeightInput = weightInput;

      if (!isNaN(currentWeightVal) && weightInput !== '') {
        // Convert current display weight to KG based on previous units (user.units)
        let weightInKg = currentWeightVal;
        if (user.units === 'imperial') {
          weightInKg = currentWeightVal / 2.20462;
        }

        // Convert KG to new display units
        if (newUnits === 'imperial') {
          newWeightInput = (weightInKg * 2.20462).toFixed(1);
        } else { // newUnits === 'metric'
          newWeightInput = weightInKg.toFixed(1);
        }
      }
      
      setWeightInput(newWeightInput); // Update display value immediately
      await base44.auth.updateMe({ units: newUnits }); // Save new units
      const updatedUser = await base44.auth.me(); // Refresh user data
      setUser(updatedUser);
      toast.success('Units updated!');
    } catch (error) {
      logger.error('Error updating units:', error);
      toast.error('Failed to update units.');
    }
  };

  const handleToleranceChange = async (newTolerance) => {
    if (!user) return;
    try {
        await base44.auth.updateMe({ tolerance: newTolerance });
        const updatedUser = await base44.auth.me(); // Refresh user data
        setUser(updatedUser);
        toast.success('Tolerance updated!');
    } catch (error) {
        logger.error('Error updating tolerance:', error);
        toast.error('Failed to update tolerance.');
    }
  };

  const handleUsageProfileChange = async (newProfile) => {
    if (!user) return;
    try {
        await base44.auth.updateMe({ usageProfile: newProfile });
        const updatedUser = await base44.auth.me();
        setUser(updatedUser);
        toast.success('Usage profile updated!');
    } catch (error) {
        logger.error('Error updating usage profile:', error);
        toast.error('Failed to update usage profile.');
    }
  };

  const handleMetabolismSave = async () => {
    setSavingMetabolism(true);
    try {
        await base44.auth.updateMe({ metabolismAdj: metabolismAdj });
        const updatedUser = await base44.auth.me();
        setUser(updatedUser);
        toast.success('Metabolism adjustment saved!');
    } catch (error) {
        logger.error('Error saving metabolism adjustment:', error);
        toast.error('Failed to save metabolism adjustment.');
    } finally {
        setSavingMetabolism(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.isPremium) {
      navigate(createPageUrl('Premium'));
      return;
    }

    // --- NATIVE IAP MANAGEMENT ---
    if (isNativeApp) {
        // Native apps typically manage subscriptions via the App Store / Play Store settings
        // Natively might provide a helper to open this, or we just instruct the user
        toast.info('Please manage your subscription via your device Settings (Apple ID / Google Play).', { duration: 5000 });
        
        // Try to deep link if Natively supports it (optional enhancement)
        // window.location.href = 'https://apps.apple.com/account/subscriptions'; // iOS generic
        return;
    }

    // --- WEB/STRIPE MANAGEMENT ---
    setManagingSubscription(true);
    try {
      logger.debug('[Settings] Opening customer portal for user:', user.id);
      const response = await base44.functions.invoke('openCustomerPortal');
      
      if (response.data?.error) {
        logger.error('[Settings] Portal error:', response.data);
        
        if (response.data.requiresResubscribe) {
          toast.error('Your test subscription needs to be upgraded. Redirecting to Premium...', { duration: 4000 });
          setTimeout(() => {
            navigate(createPageUrl('Premium'));
          }, 2000);
          return;
        }
        
        throw new Error(response.data.error);
      }

      if (response.data?.url) {
        logger.debug('[Settings] Redirecting to portal:', response.data.url);
        window.location.href = response.data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      logger.error('[Settings] Error opening portal:', error);
      
      // Check if it's the test subscription error
      if (error.response?.data?.requiresResubscribe) {
        toast.error('Your test subscription needs to be upgraded. Redirecting to Premium...', { duration: 4000 });
        setTimeout(() => {
          navigate(createPageUrl('Premium'));
        }, 2000);
        setManagingSubscription(false);
        return;
      }
      
      const errorMsg = error.response?.data?.error || error.message || 'Failed to open subscription management';
      toast.error(errorMsg);
      setManagingSubscription(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const { data } = await base44.functions.invoke('exportUserSessionsCSV');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-buddy-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Data exported successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.info('No sessions to export yet. Log a session to get started!');
      } else {
        logger.error('Error exporting data:', error);
        toast.error('Failed to export data');
      }
    } finally {
      setExportingData(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      const sessionsToDelete = await base44.entities.Session.filter({ uid: user.id });
      await Promise.all(sessionsToDelete.map(session => base44.entities.Session.delete(session.id)));
      toast.success('History cleared successfully');
      setShowClearDialog(false);
      // Invalidate react-query cache for sessions and badges to reflect changes
      // queryClient.invalidateQueries(['settings-sessions', user?.id]);
      // queryClient.invalidateQueries(['user-badges', user?.id]);
      // For simplicity in this context, might reload or trigger a re-fetch
      // A more robust solution would use queryClient.invalidateQueries if QueryClient instance is available here.
    } catch (error) {
      logger.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    } finally {
      setClearing(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      if (deleteConfirm !== 'DELETE') return;
      setDeletingAccount(true);
      await base44.functions.invoke('deleteAccount', { confirm: 'DELETE' });
      await base44.auth.logout(window.location.origin + createPageUrl('Landing'));
    } catch (error) {
      logger.error('Error deleting account:', error);
      toast.error('Failed to delete account.');
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    const landingUrl = window.location.origin + createPageUrl('Landing');
    await base44.auth.logout(landingUrl);
  };

  const handleAgeConfirmed = () => {
    setShowAgeGate(false);
    window.location.reload();
  };

  if (loading || sessionsLoading) { // badgesLoading removed
    return <LoadingScreen />;
  }

  if (showAgeGate) {
    return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  }

  if (!user) {
    return null; // Should ideally redirect to login if user isn't loaded and not in age gate
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account & preferences</p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsCard />
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-[#25A55F]/10">
                <UserIcon className="w-5 h-5 text-[#25A55F]" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Profile</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">First Name</Label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Your first name"
                    className="bg-[#0A0A0B] border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Last Name</Label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name (optional)"
                    className="bg-[#0A0A0B] border-gray-700 text-white"
                  />
                </div>
              </div>

              {user.isPremium && (
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">AI Companion Tone</Label>
                  <Select
                    value={formData.preferredTone}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, preferredTone: val }))}
                  >
                    <SelectTrigger className="bg-[#0A0A0B] border-gray-700 text-white hover:bg-gray-900 focus:ring-2 focus:ring-[#25A55F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141416] border-gray-700">
                      <SelectItem value="zen" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">🧘 Zen - Calm and mindful</SelectItem>
                      <SelectItem value="rick" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">🥒 Rick - Witty and sarcastic</SelectItem>
                      <SelectItem value="lofi" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">🎵 Lo-fi - Chill and relaxed</SelectItem>
                      <SelectItem value="clinical" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">🔬 Clinical - Facts and data</SelectItem>
                      <SelectItem value="dude" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">🥃 Dude - Laid-back and mellow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          </div>

          {/* Body Weight */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <Label className="text-white mb-2 block">Body Weight</Label>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder={user?.units === 'imperial' ? "Weight (lbs)" : "Weight (kg)"}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1 bg-[#0A0A0B] border-gray-700 text-white"
              />
              <Select value={user?.units || 'metric'} onValueChange={handleUnitsChange}>
                <SelectTrigger className="w-32 bg-[#0A0A0B] border-gray-700 text-white hover:bg-gray-900 focus:ring-2 focus:ring-[#25A55F]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141416] border-gray-700">
                  <SelectItem value="metric" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">kg</SelectItem>
                  <SelectItem value="imperial" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleWeightSave}
              disabled={!weightInput || savingWeight}
              className="w-full mt-3 bg-[#25A55F] hover:bg-[#1e8a4c] disabled:opacity-50 text-white"
            >
              {savingWeight ? 'Saving...' : 'Save Weight'}
            </Button>
          </div>

          {/* Default Tolerance */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <Label className="text-white mb-4 block">Default Tolerance Level</Label>
            <Select value={user?.tolerance || 'medium'} onValueChange={handleToleranceChange}>
              <SelectTrigger className="bg-[#0A0A0B] border-gray-700 text-white hover:bg-gray-900 focus:ring-2 focus:ring-[#25A55F]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#141416] border-gray-700">
                <SelectItem value="low" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Low - Occasional use</SelectItem>
                <SelectItem value="medium" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Medium - Regular use</SelectItem>
                <SelectItem value="high" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">High - Daily use</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Tolerance Settings */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-white block">Advanced Tolerance Settings</Label>
                <p className="text-gray-400 text-sm mt-1">Fine-tune your tolerance calculations</p>
              </div>
              <button
                onClick={() => setShowAdvancedTolerance(!showAdvancedTolerance)}
                className="text-[#25A55F] hover:text-[#1e8a4c] transition-colors"
              >
                {showAdvancedTolerance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {showAdvancedTolerance && (
              <div className="space-y-6 pt-4 border-t border-gray-800 mt-4">
                {/* Usage Profile */}
                <div>
                  <Label className="text-white mb-3 block">Usage Profile</Label>
                  <Select 
                    value={user?.usageProfile || 'frequent'} 
                    onValueChange={handleUsageProfileChange}
                  >
                    <SelectTrigger className="bg-[#0A0A0B] border-gray-700 text-white hover:bg-gray-900 focus:ring-2 focus:ring-[#25A55F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141416] border-gray-700">
                      <SelectItem value="first" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">First Timer - Never or rarely used</SelectItem>
                      <SelectItem value="occasional" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Occasional - 1-2 times per week</SelectItem>
                      <SelectItem value="frequent" className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Frequent - 3+ times per week</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-gray-500 text-xs mt-2">
                    Affects THC clearance rate and tolerance buildup
                  </p>
                </div>

                {/* Metabolism Adjustment */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white">Metabolism Adjust (%)</Label>
                    <span className="text-[#25A55F] font-semibold">
                      {metabolismAdj > 0 ? '+' : ''}{metabolismAdj}%
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={metabolismAdj}
                    onChange={(e) => setMetabolismAdj(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-[#25A55F]
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-white
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:border-2
                      [&::-moz-range-thumb]:border-[#25A55F]
                      [&::-moz-range-thumb]:shadow-md"
                    style={{
                      background: `linear-gradient(to right, 
                        #dc2626 0%, 
                        ${metabolismAdj < 0 ? `#dc2626` : `#374151`} ${((metabolismAdj + 20) / 40) * 100}%, 
                        ${metabolismAdj > 0 ? `#25A55F` : `#374151`} ${((metabolismAdj + 20) / 40) * 100}%, 
                        #25A55F 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>

                  <p className="text-gray-500 text-xs mt-3">
                    Adjust if you notice your effects lasting longer (-) or shorter (+) than predicted
                  </p>

                  <Button
                    onClick={handleMetabolismSave}
                    disabled={savingMetabolism}
                    className="w-full mt-3 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
                  >
                    {savingMetabolism ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Metabolism Setting'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* My Strains - NEW SECTION (Available to all users) */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[#25A55F]/10">
                <Leaf className="w-5 h-5 text-[#25A55F]" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg">My Strains</h2>
                <p className="text-gray-400 text-sm">Manage your saved strain profiles</p>
              </div>
            </div>
            
            <Button
              onClick={() => navigate(createPageUrl('MyStrains'))}
              variant="outline"
              className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start bg-[#0A0A0B]"
            >
              <Leaf className="mr-2 h-4 w-4" />
              View & Edit My Strains
            </Button>
            
            <p className="text-xs text-gray-500 mt-3">
              View and edit THC%, CBD%, and effect ratings for all your saved strains
            </p>
          </div>

          {/* Badge Progress Section removed as per instructions - now premium-only in Insights */}

          {/* Subscription Management */}
          {user?.isPremium ? (
            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="text-white font-semibold">Premium Subscription</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400">Status</span>
                  <span className="text-[#25A55F] font-medium">Active</span>
                </div>
                
                {isNativeApp ? (
                  <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer">
                    <Button
                      variant="outline"
                      className="w-full border-gray-800 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage on Apple Subscriptions
                    </Button>
                  </a>
                ) : (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    variant="outline"
                    className="w-full border-gray-800 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    {managingSubscription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  {isNativeApp ? 'Manage your subscription in your Apple ID settings' : 'Opens Stripe portal to manage billing and cancel subscription'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-[#25A55F]/10">
                  <Crown className="w-5 h-5 text-[#25A55F]" />
                </div>
                <h2 className="text-white font-semibold text-lg">Membership</h2>
              </div>
              <Button
                onClick={() => handleManageSubscription()}
                className="w-full bg-gradient-to-r from-[#25A55F] to-yellow-500 hover:from-[#1e8a4c] hover:to-yellow-600 text-white"
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </div>
          )}

          {/* Privacy & Data Card */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Privacy & Data</h2>
            </div>

            {/* NEW: Privacy Statement */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-2">
                    <strong className="text-white">Your privacy matters.</strong> All your session data is encrypted and stored securely. We never sell or share your personal information without your explicit consent.
                  </p>
                  <Link 
                    to={createPageUrl('PrivacyPolicy')} 
                    className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center gap-1"
                  >
                    Read our full Privacy Policy
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                disabled={exportingData}
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start bg-[#0A0A0B]"
              >
                {exportingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export My Data (CSV)
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowClearDialog(true)}
                variant="outline"
                className="w-full border-red-900/50 text-red-400 hover:bg-red-950/20 justify-start bg-[#0A0A0B]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Delete Account</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to enable"
                className="bg-[#0A0A0B] border-gray-700 text-white"
              />
              <Button
                onClick={() => setShowDeleteAccountDialog(true)}
                disabled={deleteConfirm !== 'DELETE'}
                variant="outline"
                className="border-red-900/50 text-red-400 hover:bg-red-950/20 bg-[#0A0A0B]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>

          {/* App Card */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Smartphone className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">App</h2>
            </div>

            <div className="space-y-3">
              <Link to={createPageUrl('Help')}>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start bg-[#0A0A0B]"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </Button>
              </Link>
              <Button
                onClick={() => setShowInstallModal(true)}
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start bg-[#0A0A0B]"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Install to Home Screen
              </Button>

              <a href="mailto:support@verdelabs.com.au">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800 justify-start bg-[#0A0A0B]"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          className="w-full bg-transparent border-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 h-12 rounded-xl mt-6 mb-6 transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm space-y-3">
          <p>Session Buddy v1.0.0</p>
          <p>by Verde Labs Australia</p>
          <p>Track responsibly. Stay safe.</p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-[#25A55F] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to={createPageUrl('TermsOfUse')} className="hover:text-[#25A55F] transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Install App Modal */}
      <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />

      {/* Clear History Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="bg-[#141416] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All History?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete all your session records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              disabled={clearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear History'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent className="bg-[#141416] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAccount}
              disabled={deletingAccount || deleteConfirm !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}