import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Crown, Check, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { trackEvent, AnalyticsEvents } from '@/components/utils/analytics';
import AgeGate from '@/components/AgeGate';
import { PurchaseRouter } from '@/components/utils/purchaseRouter'; // Import router
import { useNativelyEnvironment } from '@/components/utils/natively';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { logger } from '@/components/utils/logger';

export default function Premium() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const nativeEnv = useNativelyEnvironment();
  
  // Initialize with Standard Web Prices immediately (Requirement #1)
  const [displayPrices, setDisplayPrices] = useState({ 
    monthly: '$4.99 USD / month', 
    yearly: '$39.99 USD / year',
    disclaimer: 'Prices shown in USD. In-app purchases are charged in your local currency.'
  });

  // Determine environment for UI
  const [isNative, setIsNative] = useState(false);
  const [billingReady, setBillingReady] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      // 1. Check Native Readiness (with timeout)
      await PurchaseRouter.waitForNativeBridge(3000);

      const looksNative = PurchaseRouter.isNativeEnvironment() || nativeEnv.isNativeApp;
      setIsNative(looksNative);

      const ready = PurchaseRouter.isNativeBilling();
      setBillingReady(ready);
      logger.debug('[Premium] Native wrapper:', looksNative, 'billing ready:', ready);

      // 2. Fetch Prices (deterministic)
      const prices = await PurchaseRouter.getDisplayPrices();
      setDisplayPrices(prev => ({ ...prev, ...prices }));
    };

    init();
    window.scrollTo(0, 0);
  }, [nativeEnv.isNativeApp]);

  // Reset checkout loading on visibility change (returning from Stripe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCheckoutLoading(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Load User & Sync Entitlements if Native
  useEffect(() => {
    const loadUser = async () => {
      try {
        let currentUser = await base44.auth.me();
        
        // If Native App, sync RevenueCat entitlements on load
        if (isNative) {
             try {
                 const syncRes = await base44.functions.invoke('syncRevenueCatEntitlements', { userId: currentUser.id });
                 if (syncRes.data?.isPremium && !currentUser.isPremium) {
                     currentUser = await base44.auth.me(); // Refresh
                     toast.success('Premium status synced!');
                 }
             } catch (e) {
                 logger.error('[Premium] RC Sync failed', e);
             }
        }

        setUser(currentUser);
        
        if (currentUser?.isPremium) {
          toast.success('You already have premium!');
          navigate(createPageUrl('Settings'), { replace: true });
          return;
        }
        
        if (!currentUser.ageConfirmed) {
          setShowAgeGate(true);
        }
        setLoading(false);
      } catch (error) {
        logger.error('[Premium] Error loading user:', error);
        const errorMessage = error?.message || String(error);
        if (errorMessage.toLowerCase().includes('logged in') || errorMessage.toLowerCase().includes('unauthorized')) {
             await base44.auth.redirectToLogin(window.location.href);
        } else {
             toast.error('Error loading premium page');
             setLoading(false);
        }
      }
    };
    loadUser();
  }, [navigate, isNative]);

  const handleUpgrade = async (plan) => {
    setCheckoutLoading(plan);
    let completed = false;

    // Watchdog timer: extend for native (TestFlight can be slow)
    const watchdog = setTimeout(() => {
        setCheckoutLoading(current => {
            if (current === plan) {
                toast.error("Process timed out. Please try again.");
                return null;
            }
            return current;
        });
    }, isNative ? 60000 : 10000);

    try {
      trackEvent(AnalyticsEvents.UPGRADE_CLICK, { plan, environment: isNative ? 'native' : 'web' });

      // ---------------------------------------------------------
      // WEB / PWA FLOW (STRIPE)
      // Must execute immediately if not native. No Router usage.
      // ---------------------------------------------------------
      const looksNative = PurchaseRouter.isNativeEnvironment() || nativeEnv.isNativeApp;
      if (!looksNative) {
          logger.debug('[Premium] Starting Stripe checkout...');
          
          // Clear loading after 10s max (Master Instruction requirement)
          setTimeout(() => {
             setCheckoutLoading(current => current === plan ? null : current);
          }, 10000);
          
          const successUrl = `${window.location.origin}${createPageUrl('PaymentSuccess')}?success=1`;
          const cancelUrl = `${window.location.origin}${createPageUrl('Premium')}?canceled=1`;

          // Call backend function directly
          const response = await base44.functions.invoke('createStripeCheckoutSession', {
             plan,
             successUrl,
             cancelUrl
          });

          // Handle response robustly
          const data = response.data || response;
          const url = data.url || data.checkoutUrl;

          if (url) {
              window.location.href = url; // Standard redirect
              return;
          } else {
              throw new Error(data.error || 'No checkout URL returned');
          }
      }

      if (looksNative && !PurchaseRouter.isNativeBilling()) {
          clearTimeout(watchdog);
          toast.error('In-app purchases are not available in this build. Please update the app.');
          setCheckoutLoading(null);
          return;
      }

      // ---------------------------------------------------------
      // NATIVE FLOW (REVENUECAT)
      // Only runs if isNative === true
      // ---------------------------------------------------------
      // Debug bridge state before attempting upgrade
      if (typeof window !== 'undefined' && typeof window.__SB_DEBUG_PURCHASES === 'function') {
        logger.debug('[Premium] __SB_DEBUG_PURCHASES pre-upgrade:', window.__SB_DEBUG_PURCHASES());
      }
      const result = await PurchaseRouter.startUpgrade(plan, user.id);

      if (result.ok) {
          clearTimeout(watchdog);
          toast.success('Upgrade successful! Welcome to Premium.');
          // Immediately unlock premium in UI and then refresh state
          setUser(prev => prev ? { ...prev, isPremium: true, premiumSource: 'revenuecat' } : prev);
          const updatedUser = await base44.auth.me();
          setUser(updatedUser);
          completed = true;
          window.location.reload();
      } else {
          clearTimeout(watchdog);
          if (!result.userCancelled) {
             toast.error(result.error || 'Failed to complete purchase.');
          }
          setCheckoutLoading(null);
      }
    } catch (error) {
       clearTimeout(watchdog);
       logger.error('Upgrade error:', error);
       toast.error(error.message || 'An unexpected error occurred.');
       setCheckoutLoading(null);
    } finally {
       if (!completed) {
         setCheckoutLoading(null);
       }
    }
  };

  const handleRestore = async () => {
      setRestoring(true);
      const result = await PurchaseRouter.restore(user.id);
      
      if (result.ok) {
          toast.success('Purchases restored!');
          setUser(prev => prev ? { ...prev, isPremium: true, premiumSource: 'revenuecat' } : prev);
          window.location.reload();
      } else {
          toast.error(result.error || 'Failed to restore purchases');
      }
      setRestoring(false);
  };

  const handleAgeConfirmed = () => {
    setShowAgeGate(false);
    window.location.reload();
  };

  if (showAgeGate) return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  if (loading) return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#25A55F] animate-spin" />
      </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] via-[#0D1410] to-[#0A0A0B] text-white pb-24">
      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25A55F]/10 border border-[#25A55F]/20 mb-4">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-[#25A55F]">Premium</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Unlock Your Full <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25A55F] to-yellow-500">Potential</span>
          </h1>
          <p className="text-gray-400 text-lg">Get AI companion and advanced features</p>
        </motion.div>

        {/* Plan Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-3 mb-8 bg-[#141416] p-2 rounded-2xl border border-gray-800">
          <button onClick={() => setSelectedPlan('monthly')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${selectedPlan === 'monthly' ? 'bg-[#25A55F] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            Monthly
          </button>
          <button onClick={() => setSelectedPlan('yearly')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all relative ${selectedPlan === 'yearly' ? 'bg-gradient-to-r from-[#25A55F] to-yellow-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            Yearly
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">Save 33%</span>
          </button>
        </motion.div>

        {/* Pricing Card */}
        <motion.div key={selectedPlan} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-3xl p-8 mb-8 soft-shadow-lg">
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2">
              {selectedPlan === 'monthly' ? displayPrices.monthly.split(' ')[0] : displayPrices.yearly.split(' ')[0]}
            </div>
            <div className="text-gray-400">
               {selectedPlan === 'monthly' ? displayPrices.monthly.replace(/^\S+\s/, '') : displayPrices.yearly.replace(/^\S+\s/, '')}
            </div>
          </div>
          
          {displayPrices.disclaimer && (
            <div className="text-center mb-6">
                <p className="text-xs text-gray-500 bg-[#1A1A1C] inline-block px-3 py-1 rounded-full border border-gray-800">
                    {displayPrices.disclaimer}
                </p>
            </div>
          )}

          <Button
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={checkoutLoading !== null || (isNative && !billingReady)}
            className="w-full bg-gradient-to-r from-[#25A55F] to-yellow-500 hover:from-[#1e8a4c] hover:to-yellow-600 text-white h-14 text-lg font-semibold rounded-xl mb-6"
          >
            {checkoutLoading !== null ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-5 w-5" />
                {isNative ? 'Continue' : 'Upgrade to Premium'}
              </>
            )}
          </Button>

          {isNative && (
               <div className="text-center mb-4">
                   <button onClick={handleRestore} disabled={restoring} className="text-sm text-gray-400 underline hover:text-white flex items-center justify-center mx-auto gap-2">
                       {restoring && <Loader2 className="w-3 h-3 animate-spin" />}
                       Restore Purchases
                   </button>
               </div>
          )}

          <div className="text-center text-gray-500 text-sm mb-6">
            {checkoutLoading !== null ? 'Please wait...' : (isNative ? 'Secure checkout via App Store' : 'Secure checkout powered by Stripe')}
          </div>
          
          <div className="space-y-3 text-sm">
             <div className="flex items-center gap-2 text-gray-300"><Check className="w-4 h-4 text-[#25A55F]" /><span>AI Companion Access</span></div>
             <div className="flex items-center gap-2 text-gray-300"><Check className="w-4 h-4 text-[#25A55F]" /><span>Advanced Analytics</span></div>
             <div className="flex items-center gap-2 text-gray-300"><Check className="w-4 h-4 text-[#25A55F]" /><span>Priority Support</span></div>
             <div className="flex items-center gap-2 text-gray-300"><Check className="w-4 h-4 text-[#25A55F]" /><span>Cancel Anytime</span></div>
          </div>
        </motion.div>

        {/* Install Instructions (Only show on Web if not native) */}
        {!isNative && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#141416] border border-gray-800 rounded-3xl p-8 mb-8 soft-shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-4">Get the Full Experience!</h3>
              <p className="text-gray-400 mb-6">Install our app on your device for a seamless experience.</p>
              {/* ... existing install instructions ... */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg text-white mb-3">iPhone & iPad</h4>
                <ol className="list-decimal list-inside text-gray-300 space-y-2 pl-4">
                    <li>Tap Share button</li>
                    <li>Add to Home Screen</li>
                </ol>
              </div>
            </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
