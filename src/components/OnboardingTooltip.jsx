import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingTooltip({ pageName, title, description, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already seen this tooltip
    const key = `tooltip_dismissed_${pageName}`;
    const dismissed = localStorage.getItem(key);
    
    if (!dismissed) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setHasBeenDismissed(true);
    }
  }, [pageName]);

  const handleDismiss = () => {
    const key = `tooltip_dismissed_${pageName}`;
    localStorage.setItem(key, 'true');
    setIsVisible(false);
    setHasBeenDismissed(true);
  };

  const handleShow = () => {
    setIsVisible(true);
  };

  return (
    <>
      {/* Help icon to re-show tooltip */}
      {hasBeenDismissed && !isVisible && (
        <button
          onClick={handleShow}
          className="fixed top-20 right-6 z-50 p-2 bg-[#25A55F]/10 border border-[#25A55F]/30 rounded-full hover:bg-[#25A55F]/20 transition-colors"
          aria-label="Show help"
        >
          <HelpCircle className="w-5 h-5 text-[#25A55F]" />
        </button>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-50 px-6"
          >
            <div className="max-w-lg mx-auto bg-[#141416] border border-[#25A55F]/30 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
                  {children}
                </div>
                <button
                  onClick={handleDismiss}
                  className="ml-3 p-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white py-2 rounded-lg font-medium"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}