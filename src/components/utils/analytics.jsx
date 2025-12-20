import { logger } from '@/components/utils/logger';

// Analytics event tracking utility
export const trackEvent = (eventName, properties = {}) => {
  if (!eventName) return;

  try {
    // Development logging
    logger.debug(`[Analytics] Track: ${eventName}`, properties);
    
    // Future integration hooks
    if (typeof window !== 'undefined' && window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track(eventName, properties);
    }
    
    // Example: Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', eventName, properties);
    }

  } catch (error) {
    // Fail gracefully without breaking app flow
    logger.warn('[Analytics] Failed to track event:', error);
  }
};

export const trackPageView = (pageName) => {
  try {
    logger.debug(`[Analytics] Page View: ${pageName}`);
    // Add provider calls here when ready
  } catch (error) {
    logger.warn('[Analytics] Failed to track page view:', error);
  }
};

export const AnalyticsEvents = {
  SESSION_LOGGED: 'session_logged',
  VIEW_BUZZ_RESULT: 'view_buzz_result',
  UPGRADE_CLICK: 'upgrade_click',
  UPGRADE_SUCCESS: 'upgrade_success',
  AI_AGENT_MSG: 'ai_agent_msg',
  AI_AGENT_VIEW: 'ai_agent_view'
};