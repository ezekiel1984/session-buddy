import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTICategory } from '@/components/utils/toleranceMath';

export default function ToleranceGauge({ TI, S }) {
  const [displayTI, setDisplayTI] = useState(0);
  const category = getTICategory(TI);
  
  // Animate count-up effect
  useEffect(() => {
    let start = 0;
    const end = TI;
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayTI(start + (end - start) * easeProgress);
      
      if (progress >= 1) {
        clearInterval(timer);
        setDisplayTI(end);
      }
    }, 16); // ~60fps
    
    return () => clearInterval(timer);
  }, [TI]);
  
  // Calculate gauge fill percentage
  const fillPercentage = Math.min(100, displayTI);
  
  return (
    <div className="relative">
      {/* Circular gauge */}
      <div className="relative w-48 h-48 mx-auto">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#2a2a2c"
            strokeWidth="8"
          />
          
          {/* Animated fill */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#25A55F"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 45 * (1 - fillPercentage / 100)
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <div className="text-5xl font-bold text-white mb-1">
              {Math.round(displayTI)}
            </div>
            <div className={`text-sm font-semibold ${category.color}`}>
              {category.label}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Sensitivity percentage */}
      <div className="text-center mt-4">
        <div className="text-sm text-gray-400 mb-1">Sensitivity</div>
        <div className="text-2xl font-bold text-[#25A55F]">
          {Math.round(S * 100)}%
        </div>
      </div>
    </div>
  );
}