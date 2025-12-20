import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Crown, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/components/utils/logger';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [user, setUser] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Use ref to track mounted state
  const isMounted = useRef(true);
  
  const maxPollingAttempts = 10; // Poll for up to 20 seconds

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // First, verify authentication
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (isMounted.current) {
          setUser(currentUser);
          setAuthCheckComplete(true);
        }
      } catch (error) {
        logger.error('[PaymentSuccess] User not authenticated, redirecting to login:', error);
        await base44.auth.redirectToLogin(window.location.href);
      }
    };
    
    verifyAuth();
  }, []);

  // Robust polling logic
  useEffect(() => {
    if (!authCheckComplete || !user || status !== 'checking') return;

    let timeoutId;

    const checkStatus = async () => {
      if (pollingAttempts >= maxPollingAttempts) {
        logger.error('[PaymentSuccess] Max polling attempts exceeded');
        setStatus('error');
        return;
      }

      try {
        logger.debug(`[PaymentSuccess] Polling attempt ${pollingAttempts + 1}/${maxPollingAttempts}`);
        const currentUser = await base44.auth.me();
        
        if (!isMounted.current) return;

        if (currentUser?.isPremium) {
          logger.info('[PaymentSuccess] Premium status confirmed');
          sessionStorage.setItem('payment_success_pending_refresh', 'true');
          setUser(currentUser);
          setStatus('success');
          startCountdown();
        } else {
          // Continue polling
          timeoutId = setTimeout(() => {
            if (isMounted.current) {
              setPollingAttempts(prev => prev + 1);
            }
          }, 2000);
        }
      } catch (error) {
        logger.error('[PaymentSuccess] Error checking premium status:', error);
        // Continue polling even on error until max attempts
        timeoutId = setTimeout(() => {
          if (isMounted.current) {
            setPollingAttempts(prev => prev + 1);
          }
        }, 2000);
      }
    };

    checkStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pollingAttempts, authCheckComplete, user, status]);

  const startCountdown = () => {
    const interval = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(interval);
        return;
      }
      
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          logger.debug('[PaymentSuccess] Countdown complete, navigating to Settings');
          navigate(createPageUrl('Settings'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Show loading while checking authentication or premium status
  if (!authCheckComplete || status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#25A55F]/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-[#25A55F] animate-spin" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            {!authCheckComplete ? 'Verifying Session...' : 'Processing Payment...'}
          </h2>
          
          <p className="text-gray-400 mb-6">
            {!authCheckComplete 
              ? "Please wait while we verify your login session."
              : "We're confirming your premium status. This usually takes just a few seconds."
            }
          </p>

          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#25A55F] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#25A55F] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#25A55F] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>

          {authCheckComplete && (
            <p className="text-gray-500 text-sm mt-8">
              Checking... {pollingAttempts} of {maxPollingAttempts}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] via-[#0D1410] to-[#0A0A0B] flex items-center justify-center p-6">
        {/* Animated background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md w-full text-center"
        >
          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mx-auto mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#25A55F] to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#25A55F]/50">
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            
            {/* Floating sparkles */}
            <motion.div
              animate={{ 
                y: [-10, -20, -10],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <motion.div
              animate={{ 
                y: [-15, -25, -15],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-2 -left-2"
            >
              <Sparkles className="w-5 h-5 text-[#25A55F]" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome to Premium! 🎉
            </h1>
            
            <p className="text-gray-400 text-lg mb-8">
              Your account has been upgraded successfully
            </p>

            {/* Premium Benefits */}
            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="text-white font-semibold">You now have access to:</h3>
              </div>
              
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-[#25A55F]">✓</span>
                  <span className="text-sm">AI Companion with personalized tones</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-[#25A55F]">✓</span>
                  <span className="text-sm">Advanced Insights & Analytics</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-[#25A55F]">✓</span>
                  <span className="text-sm">Session Predictor & Tolerance Coach</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-[#25A55F]">✓</span>
                  <span className="text-sm">Shareable stats cards</span>
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              Redirecting to your settings in {countdown} seconds...
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate(createPageUrl('Settings'))}
                className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
              >
                Go to Settings
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('AICompanion'))}
                variant="outline"
                className="flex-1 border-gray-700 bg-[#0A0A0B] text-white hover:bg-gray-800"
              >
                Try AI Companion
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          Payment Processing Delayed
        </h2>
        
        <p className="text-gray-400 mb-6">
          Your payment was successful, but we're still processing your premium upgrade. 
          This can sometimes take a few minutes.
        </p>

        <div className="bg-[#141416] border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Activation Delayed
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            We couldn't confirm your premium status yet. This often happens if the payment system is slow.
          </p>
          <p className="text-gray-300 text-sm mb-2">
            <strong>What to do:</strong>
          </p>
          <ul className="text-gray-300 text-sm list-disc list-inside space-y-1 ml-1">
            <li>Try refreshing the page below.</li>
            <li>Check your <strong>Settings</strong> page in a few minutes.</li>
            <li>
              If still not active, email <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] hover:underline">support@verdelabs.com.au</a> with your purchase time.
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
          >
            Refresh Page
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            variant="outline"
            className="flex-1 border-gray-700 bg-[#0A0A0B] text-white hover:bg-gray-800"
          >
            Go to Settings
          </Button>
        </div>
      </motion.div>
    </div>
  );
}