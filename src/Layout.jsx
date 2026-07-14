import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings, HelpCircle, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "@/components/utils/purchaseRouter";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rootTabPages = new Set(['LogDose','BuzzResult','History','AICompanion','Predictor','Insights','ToleranceCoach']);
  const isRootTab = rootTabPages.has(currentPageName);
  // Sync dark mode with system preference
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      if (!mql) return;
      const root = document.documentElement;
      if (mql.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    apply();
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    } else if (mql && mql.addListener) {
      mql.addListener(apply);
      return () => mql.removeListener(apply);
    }
  }, []);
  
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

  // Save and restore scroll position per route (preserve across tab switches)
  React.useEffect(() => {
    const key = 'scroll:' + location.pathname;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(saved, 10) || 0);
      }, 0);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          try {
            sessionStorage.setItem('scroll:' + location.pathname, String(window.scrollY || 0));
          } catch {}
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Inject Natively SDK when running inside a native wrapper (for in-app purchases)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('natively-sdk')) return;

    const ua = navigator.userAgent || '';
    const looksNative = /Natively|BuildNatively/i.test(ua) || window.__NATIVELY__ === true;

    if (looksNative) {
      const script = document.createElement('script');
      script.id = 'natively-sdk';
      script.src = 'https://cdn.jsdelivr.net/npm/natively@2.22.0/natively-frontend.min.js';
      script.async = true;
      script.onload = () => {
        if (window.natively) window.natively.setDebug(false);
      };
      document.head.appendChild(script);
    }
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
        
        /* iOS native-like behavior */
        body { overscroll-behavior-y: none; -webkit-overflow-scrolling: touch; }
        .no-select { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
      `}</style>
      
      {/* Header with Logo and Settings */}
      <header className="fixed top-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-gray-800 z-40 no-select" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          {isRootTab ? (
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
          ) : (
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-200" />
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <Link
              to={createPageUrl('Help')}
              className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors p-0"
            >
              <HelpCircle className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </Link>
            <Link
              to={createPageUrl('Settings')}
              className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors p-0"
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