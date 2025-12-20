import React from 'react';
import { Trophy } from 'lucide-react';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';

export default function ShareableBadgeCard({ badgeId }) {
  const badge = BADGE_DEFINITIONS[badgeId];

  if (!badge) return null;

  return (
    <div 
      id="shareable-badge-card"
      className="w-[1080px] h-[1080px] bg-gradient-to-br from-[#0A0A0B] to-[#141416] text-white flex flex-col items-center justify-between relative overflow-hidden p-12"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Animated background effects */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl" />

      {/* Header - Logo and Badge */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
          alt="Session Buddy"
          className="w-20 h-20"
        />
        <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25A55F]/10 border-2 border-[#25A55F]/20">
          <Trophy className="w-5 h-5 text-[#25A55F]" />
          <span className="text-xl font-medium text-[#25A55F] leading-none">Achievement Unlocked!</span>
        </div>
      </div>

      {/* Main badge display - centered */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-16">
        {/* Glow effect behind emoji */}
        <div className="absolute inset-0 bg-[#25A55F]/5 blur-3xl rounded-full" />

        {/* Badge emoji - moved much higher with more spacing */}
        <div className="text-[280px] leading-none mb-24 relative z-10">
          {badge.emoji}
        </div>

        {/* Badge name */}
        <h2 className="text-7xl font-bold text-white mb-6 text-center leading-tight">
          {badge.name}
        </h2>

        {/* Badge description */}
        <p className="text-3xl text-gray-300 text-center max-w-2xl leading-snug">
          {badge.description}
        </p>

        {/* Premium badge if applicable */}
        {badge.premium && (
          <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 border-2 border-purple-500/20 mt-6">
            <span className="text-xl leading-none">👑</span>
            <span className="text-lg font-medium text-purple-400 leading-none">Premium Badge</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center">
        <p className="text-xl text-gray-400 mb-3 leading-relaxed">Track your vibe. Stay mindful. Enjoy the ride.</p>
        <div className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-[#25A55F]/10 border-2 border-[#25A55F]/30">
          <span className="text-2xl font-bold text-[#25A55F] leading-none">session-buddy.app</span>
        </div>
      </div>
    </div>
  );
}