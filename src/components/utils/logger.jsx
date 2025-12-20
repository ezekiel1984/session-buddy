const isDev = () => {
  try {
    // Standard checks for development environment
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent || '';
      const isNative = /Natively|BuildNatively/i.test(ua);

      return window.location.hostname.includes('localhost') || 
             window.location.hostname.includes('127.0.0.1') ||
             window.location.hostname.includes('base44.app') ||
             isNative; // Enable logging in Native wrapper for debugging
    }
    return false;
  } catch (e) {
    return false;
  }
};

const shouldLog = isDev();

export const logger = {
  debug: (...args) => {
    if (shouldLog) {
      (console.debug || console.log)(...args);
    }
  },
  log: (...args) => {
    if (shouldLog) {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (shouldLog) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    // Always warn, as these might be important even in prod
    console.warn(...args);
  },
  error: (...args) => {
    // Always error
    console.error(...args);
  }
};

export default logger;