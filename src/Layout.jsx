import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { logger } from "@/components/utils/logger";
import "@/components/utils/purchaseRouter"; // Force load for diagnostics

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [debugOverlay, setDebugOverlay] = React.useState('Debug: Init...');

  // Visual Diagnostics for Native Build (Base44 Support Request)
  React.useEffect(() => {
    const updateDebug = () => {
        if (typeof window === 'undefined') return;
        const routerLoaded = window.__PURCHASE_ROUTER_LOADED__ ? 'YES' : 'NO';
        const natObj = window.natively ? 'YES' : 'NO';
        const natPurch = window.NativelyPurchases ? (typeof window.NativelyPurchases === 'function' ? 'FN' : 'OBJ') : 'NO';
        
        // Manual bridge extraction logic matching the updated router
        let bridgeStatus = 'NO';
        try {
            if (window.NativelyPurchases && typeof window.NativelyPurchases === 'function') {
                 const testInst = new window.NativelyPurchases();
                 if (testInst) bridgeStatus = 'YES(CTOR)';
            } else if (window.natively && window.natively.purchases) {
                 bridgeStatus = 'YES(MOD)';
            }
        } catch(e) { bridgeStatus = 'ERR'; }

        const status = window.__PURCHASE_STATUS__ || '-';
        
        // Introspect keys if bridge exists
        let keys = '';
        if (window.NativelyPurchases && typeof window.NativelyPurchases === 'function') {
            try {
                const i = new window.NativelyPurchases();
                keys = Object.keys(i).filter(k => typeof i[k] === 'function').join(',');
            } catch(e) {}
        }
        
        setDebugOverlay(`R:${routerLoaded} | B:${bridgeStatus} | S:${status} | FNs:${keys.substring(0, 30)}`);
        };

        updateDebug();
    const interval = setInterval(updateDebug, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Service Worker Registration removed - not supported in Base44 platform
  // PWA functionality is handled by Base44's built-in manifest and meta tags
  
  // Check authentication for protected pages - MUST be before any returns
  React.useEffect(() => {
    // Skip auth check for public pages
    if (currentPageName === "Landing" || currentPageName === "ShareView" || currentPageName === "Welcome" || currentPageName === "Help") {
      return;
    }
    
    const checkAuth = async () => {
      try {
        await base44.auth.me();
      } catch (error) {
        // User not authenticated - redirect to landing page first
        const nextUrl = window.location.href;
        window.location.href = createPageUrl('Landing') + `?next=${encodeURIComponent(nextUrl)}`;
      }
    };
    
    checkAuth();
  }, [currentPageName]);

  // PWA State Refresh: Listen for when app regains focus after external navigation (like Stripe payment)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      // When the app becomes visible again (e.g., returning from Stripe payment in external browser)
      if (document.visibilityState === 'visible') {
        logger.debug('[Layout] App regained visibility');
        
        // Check if we're returning from a successful payment
        const paymentSuccessPending = sessionStorage.getItem('payment_success_pending_refresh');
        
        if (paymentSuccessPending === 'true') {
          logger.debug('[Layout] Payment success detected, forcing full PWA refresh');
          // Clear the flag
          sessionStorage.removeItem('payment_success_pending_refresh');
          // Force a full page reload to ensure PWA state is completely refreshed
          window.location.reload();
        }
      }
    };

    const handleFocus = () => {
      // Additional handler for window focus events
      logger.debug('[Layout] Window regained focus');
      
      // Check if we're returning from a successful payment
      const paymentSuccessPending = sessionStorage.getItem('payment_success_pending_refresh');
      
      if (paymentSuccessPending === 'true') {
        logger.debug('[Layout] Payment success detected on focus, forcing full PWA refresh');
        // Clear the flag
        sessionStorage.removeItem('payment_success_pending_refresh');
        // Small delay to ensure the browser context has fully restored
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    // Inject Natively SDK ONLY if missing AND we look like a native wrapper
    const loadNativelySDK = () => {
      if (typeof window === 'undefined') return;
      // Prevent multiple injections
      if (document.getElementById('natively-sdk')) return;

      // Strict check: Only inject on actual native wrapper to avoid Web/PWA issues
      const ua = navigator.userAgent || '';
      // Native = running inside BuildNatively wrapper only
      const looksNative = /Natively|BuildNatively/i.test(ua) || window.__NATIVELY__ === true;

      if (looksNative) {
          logger.debug('[Layout] Native environment detected, injecting SDK...');
          const script = document.createElement('script');
          script.id = 'natively-sdk';
          script.src = 'https://cdn.jsdelivr.net/npm/natively@2.22.0/natively-frontend.min.js';
          script.async = true;
          script.onload = () => {
             logger.debug('[Layout] Natively SDK loaded dynamically');
             if (window.natively) window.natively.setDebug(false);
          };
          document.head.appendChild(script);
      }
    };
    loadNativelySDK();

    // Robust PWA detection
    const checkPWA = () => {
      try {
        if (typeof window === 'undefined') return false;
        
        const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator && window.navigator.standalone === true;
        
        return isStandalone || isIOSStandalone;
      } catch (e) {
        return false;
      }
    };

    const isPWA = checkPWA();
    
    if (isPWA) {
      logger.debug('[Layout] PWA detected, installing visibility listeners');
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (isPWA) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []);
  
  // No layout wrapper for landing page, share view, and welcome page
  if (currentPageName === "Landing" || currentPageName === "ShareView" || currentPageName === "Welcome") {
    return <div className="min-h-screen bg-[#0A0A0B]">{children}</div>;
  }
  
  return (
    <>
      <style>{`
        :root {
          --primary-green: #25A55F;
          --bg-dark: #0A0A0B;
          --bg-dark-elevated: #141416;
          --border-dark: rgba(255, 255, 255, 0.1);
        }
        
        .soft-shadow {
          box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(0, 0, 0, 0.2);
        }
        
        .soft-shadow-lg {
          box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 4px 16px -2px rgba(0, 0, 0, 0.3);
        }
        
        button, a, input, select, textarea {
          transition: all 0.2s ease;
        }
        
        button:hover:not(:disabled), a:hover {
          transform: translateY(-1px);
        }
        
        button:active:not(:disabled), a:active {
          transform: translateY(0);
        }
        
        [role="menu"], [role="listbox"], [role="dialog"] {
          animation: none !important;
        }
      `}</style>
      
      {/* Header with Logo and Settings */}
      <header className="fixed top-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-gray-800 z-40 no-select" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          <Link to={createPageUrl('LogDose')} className="flex items-center gap-3 group">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
              alt="Session Buddy"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <h1 className="text-lg font-bold text-white group-hover:text-[#25A55F] transition-colors">
                Session Buddy
              </h1>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link
              to={createPageUrl('Help')}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </Link>
            <Link
              to={createPageUrl('Settings')}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </header>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPageName}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="min-h-screen bg-[#0A0A0B] text-white"
          style={{ paddingTop: '4rem', paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

    </>
    );
    }