import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';

export default function BadgeCard({ badgeId, locked = false, onClick }) {
  const badge = BADGE_DEFINITIONS[badgeId];

  if (!badge) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: locked ? 1 : 1.02 }}
      whileTap={{ scale: locked ? 1 : 0.98 }}
      onClick={onClick}
      disabled={locked}
      className={cn(
        "relative bg-[#141416] border rounded-2xl p-5 text-left transition-all duration-300 w-full",
        locked 
          ? "border-gray-800 opacity-60" 
          : "border-[#25A55F]/30 hover:border-[#25A55F] hover:shadow-lg hover:shadow-[#25A55F]/10"
      )}
    >
      {locked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-4 h-4 text-gray-600" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={cn(
          "text-5xl flex-shrink-0",
          locked && "grayscale opacity-50"
        )}>
          {badge.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-lg mb-1",
            locked ? "text-gray-500" : "text-white"
          )}>
            {badge.name}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {badge.description}
          </p>
          {badge.premium && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Premium</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}