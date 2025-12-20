import { useState, useEffect } from 'react';
import { logger } from '@/components/utils/logger';

// Helper for non-hook usage (e.g. one-off checks)
// Strict check: Must have the UA string. 
// Just having the SDK (which we inject in Layout.js) is not enough to be "Native App".
export const isNativelyApp = () => {
    if (typeof window === 'undefined') return false;
    return /Natively|BuildNatively/i.test(navigator.userAgent);
};

export const useNativelyEnvironment = () => {
  const [env, setEnv] = useState({
    isNativeApp: false,
    isNativeIOS: false,
    isNativeAndroid: false,
    appVersion: null,
    buildNumber: null,
  });

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const isNative = isNativelyApp();

        if (isNative) {
          logger.debug('[Natively] Native environment detected via User Agent');
          
          let browserInfo = {};
          
          // Try to get detailed info if SDK is available
          if (window.NativelyInfo) {
             try {
                 const info = new window.NativelyInfo();
                 await info.init();
                 browserInfo = await info.browserInfo();
                 logger.debug('[Natively] Browser Info:', browserInfo);
             } catch (e) {
                 logger.warn('[Natively] SDK init failed', e);
             }
          }

          // Fallback OS detection
          const os = browserInfo.os || (
            /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 
            /Android/i.test(navigator.userAgent) ? 'android' : 'web'
          );

          setEnv({
            isNativeApp: true,
            isNativeIOS: os === 'ios',
            isNativeAndroid: os === 'android',
            appVersion: browserInfo.appVersion || null,
            buildNumber: browserInfo.buildNumber || null,
          });
        } else {
             logger.debug('[Natively] Web environment detected (UA check)');
             setEnv(prev => ({ ...prev, isNativeApp: false }));
        }
      } catch (error) {
        logger.error('[Natively] Error checking environment:', error);
      }
    };

    checkEnvironment();
  }, []);

  return env;
};