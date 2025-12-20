import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { FlaskConical, TrendingUp, Clock, Loader2, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalThc7d: 0, avgBuzz7d: 0, longestSession: '0m' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get all user sessions
        const sessions = await base44.entities.Session.filter({ uid: currentUser.id });

        // Filter last 7 days
        const sessions7d = sessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo);

        if (sessions7d.length === 0) {
          setStats({ totalThc7d: 0, avgBuzz7d: 0, longestSession: '0m' });
          setLoading(false);
          return;
        }

        // Calculate total THC
        const totalThc = sessions7d.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);

        // Calculate average buzz
        const avgBuzz = sessions7d.reduce((sum, s) => sum + (parseFloat(s.buzzScore) || 0), 0) / sessions7d.length;

        // Find longest session
        let longestDuration = 0;
        sessions.forEach(s => {
          const start = new Date(s.startedAt);
          const end = new Date(s.soberAt);
          const duration = (end - start) / (1000 * 60); // minutes
          if (duration > longestDuration) {
            longestDuration = duration;
          }
        });

        const formatDuration = (minutes) => {
          if (minutes === 0) return '0m';
          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          if (hours === 0) return `${mins}m`;
          return `${hours}h ${mins}m`;
        };

        setStats({
          totalThc7d: Math.round(totalThc),
          avgBuzz7d: avgBuzz.toFixed(1),
          longestSession: formatDuration(longestDuration)
        });

      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Empty state
  if (stats.totalThc7d === 0) {
    return (
      <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-6 soft-shadow text-center">
        <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm mb-4">
          No sessions logged yet — light one up and tap Log Session! 🌿
        </p>
        <button
          onClick={() => navigate(createPageUrl('LogSession'))}
          className="text-[#25A55F] text-sm font-medium hover:underline"
        >
          Get Started →
        </button>
      </div>
    );
  }

  const tiles = [
    {
      icon: FlaskConical,
      label: 'Total THC This Week',
      value: `${stats.totalThc7d} mg`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      onClick: () => navigate(createPageUrl('History'))
    },
    {
      icon: TrendingUp,
      label: 'Avg Buzz (7d)',
      value: `${stats.avgBuzz7d} / 10`,
      color: 'text-[#25A55F]',
      bgColor: 'bg-[#25A55F]/10',
      onClick: () => navigate(createPageUrl('BuzzResult'))
    },
    {
      icon: Clock,
      label: 'Longest Session',
      value: stats.longestSession,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      onClick: () => {
        if (user?.isPremium) {
          navigate(createPageUrl('Insights'));
        } else {
          navigate(createPageUrl('Premium'));
        }
      }
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-5 soft-shadow">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#25A55F]" />
        Your Stats
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {tiles.map((tile, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            onClick={tile.onClick}
            className="bg-[#0A0A0B] rounded-xl p-3 text-center hover:bg-[#0D0D0F] transition-all duration-200 cursor-pointer group"
          >
            <div className={`w-8 h-8 ${tile.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
              <tile.icon className={`w-4 h-4 ${tile.color}`} />
            </div>
            <div className={`text-lg font-bold ${tile.color} mb-1`}>
              {tile.value}
            </div>
            <div className="text-gray-500 text-xs leading-tight">
              {tile.label}
            </div>
          </motion.button>
        ))}
      </div>

      {!user?.isPremium && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-3 border-t border-gray-800"
        >
          <button
            onClick={() => navigate(createPageUrl('Premium'))}
            className="w-full text-center text-sm text-gray-400 hover:text-[#25A55F] transition-colors flex items-center justify-center gap-2 group"
          >
            <Crown className="w-4 h-4 text-[#25A55F] group-hover:animate-pulse" />
            <span>Upgrade to Premium for full Insights, AI summaries, and weekly vibe reports</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}