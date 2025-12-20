import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/components/utils/logger';

const EFFECTS = [
  { key: 'effectEnergy', label: 'Energy', icon: '⚡', color: 'text-yellow-400' },
  { key: 'effectFocus', label: 'Focus', icon: '🎯', color: 'text-blue-400' },
  { key: 'effectRelaxation', label: 'Relaxation', icon: '😌', color: 'text-green-400' },
  { key: 'effectCreativity', label: 'Creativity', icon: '🎨', color: 'text-purple-400' },
  { key: 'effectSleep', label: 'Sleepiness', icon: '😴', color: 'text-indigo-400' },
  { key: 'effectAnxiety', label: 'Anxiety Relief', icon: '🧘', color: 'text-teal-400' },
  { key: 'effectPainRelief', label: 'Pain Relief', icon: '💊', color: 'text-red-400' },
  { key: 'effectEuphoria', label: 'Euphoria', icon: '✨', color: 'text-pink-400' }
];

export default function StrainEffectRating({ strainName, userId, sessionId, onComplete }) {
  const [ratings, setRatings] = useState({});
  const [saving, setSaving] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    const checkIfRated = async () => {
      if (!strainName?.trim()) {
        logger.debug('[StrainEffectRating] Missing strainName:', { strainName });
        return;
      }

      try {
        // FIXED: Don't include created_by in filter - RLS handles it automatically
        const profiles = await base44.entities.StrainProfile.filter({
          strainName: strainName.trim()
        });

        logger.debug('[StrainEffectRating] Found profiles:', profiles.length);

        if (profiles.length > 0 && profiles[0].totalRatings > 0) {
          // User has rated this strain before, show a condensed version
          setShowRating(true);
        } else {
          // First time rating this strain, definitely show it
          setShowRating(true);
        }
      } catch (error) {
        logger.error('[StrainEffectRating] Error checking strain ratings:', error);
      }
    };

    checkIfRated();
  }, [strainName]);

  const handleRatingChange = (effectKey, value) => {
    setRatings(prev => ({ ...prev, [effectKey]: value }));
  };

  const handleSubmit = async () => {
    if (Object.keys(ratings).length === 0) {
      toast.error('Please rate at least one effect');
      return;
    }

    if (!strainName?.trim()) {
      logger.error('[StrainEffectRating] Missing strainName');
      toast.error('Strain name is missing. Please try again.');
      return;
    }

    logger.debug('[StrainEffectRating] Starting save:', {
      strainName: strainName.trim(),
      ratingsCount: Object.keys(ratings).length,
      ratingsData: ratings
    });

    setSaving(true);
    try {
      // FIXED: Don't include created_by in filter - RLS handles it automatically
      const profiles = await base44.entities.StrainProfile.filter({
        strainName: strainName.trim()
      });

      logger.debug('[StrainEffectRating] Found existing profiles:', profiles.length);

      let profile = profiles.length > 0 ? profiles[0] : null;
      const totalRatings = profile?.totalRatings || 0;
      const newTotalRatings = totalRatings + 1;

      // Calculate new averages
      const updatedEffects = {};
      EFFECTS.forEach(effect => {
        const currentRating = ratings[effect.key];
        if (currentRating !== undefined) {
          const oldAverage = profile?.[effect.key] || 0;
          const newAverage = ((oldAverage * totalRatings) + currentRating) / newTotalRatings;
          updatedEffects[effect.key] = Math.round(newAverage * 10) / 10;
        } else if (profile?.[effect.key]) {
          // Keep existing average if not rated this time
          updatedEffects[effect.key] = profile[effect.key];
        }
      });

      const profileData = {
        uid: userId,
        strainName: strainName.trim(),
        ...updatedEffects,
        totalRatings: newTotalRatings,
        lastUsed: new Date().toISOString()
      };

      logger.debug('[StrainEffectRating] Profile data to save:', {
        isUpdate: !!profile,
        profileId: profile?.id,
        profileData
      });

      if (profile) {
        const updateResult = await base44.entities.StrainProfile.update(profile.id, profileData);
        logger.debug('[StrainEffectRating] Update successful:', updateResult);
      } else {
        const createResult = await base44.entities.StrainProfile.create(profileData);
        logger.debug('[StrainEffectRating] Create successful:', createResult);
      }

      toast.success('Effects saved! Building your strain profile 🌿');
      setShowRating(false);
      if (onComplete) onComplete();
    } catch (error) {
      logger.error('[StrainEffectRating] Error saving strain effects:', {
        error: error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        strainName: strainName.trim(),
        ratings
      });
      toast.error('Failed to save effects');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setShowRating(false);
    if (onComplete) onComplete();
  };

  if (!showRating) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-6 p-6 bg-[#141416] border border-gray-800 rounded-2xl soft-shadow"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#25A55F]" />
          <h3 className="text-white font-semibold">How does {strainName} make you feel?</h3>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Rate the effects to build your personal strain profile (optional). <br/>
          <span className="text-xs text-gray-500 italic">You can rate this strain multiple times; each rating contributes to its average profile.</span>
        </p>

        <div className="space-y-4">
          {EFFECTS.map(effect => (
            <div key={effect.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{effect.icon}</span>
                <Label className="text-gray-300 text-sm">{effect.label}</Label>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange(effect.key, value)}
                    className={`flex-1 h-10 rounded-lg border-2 transition-all ${
                      ratings[effect.key] === value
                        ? 'bg-[#25A55F] border-[#25A55F] text-white'
                        : 'bg-[#0A0A0B] border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-gray-600 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800 hover:border-gray-500"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || Object.keys(ratings).length === 0}
            className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Effects'
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}