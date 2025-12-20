import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { TOLERANCE_BOUNDS } from './utils/absorptionConstants';

export default function SessionFeedbackModal({ isOpen, onClose, session, user }) {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const feedbackOptions = [
    { value: -2, label: 'Much Weaker', icon: ThumbsDown, color: 'text-red-400' },
    { value: -1, label: 'Bit Weaker', icon: ThumbsDown, color: 'text-orange-400' },
    { value: 0, label: 'As Expected', icon: Minus, color: 'text-gray-400' },
    { value: 1, label: 'Bit Stronger', icon: ThumbsUp, color: 'text-blue-400' },
    { value: 2, label: 'Much Stronger', icon: ThumbsUp, color: 'text-green-400' }
  ];

  const handleSubmit = async () => {
    if (selectedFeedback === null) return;
    
    setSubmitting(true);
    try {
      // Get current per-method tolerance multiplier
      const toleranceKey = `tolerance_${session.method}`;
      const currentMultiplier = user[toleranceKey] || TOLERANCE_BOUNDS.default;
      
      // Adjust multiplier based on feedback (-2 to +2 → ±0.1 per step)
      const adjustment = selectedFeedback * 0.1;
      let newMultiplier = currentMultiplier + adjustment;
      
      // Clamp to bounds
      newMultiplier = Math.max(TOLERANCE_BOUNDS.min, Math.min(TOLERANCE_BOUNDS.max, newMultiplier));
      
      // Update user's per-method tolerance
      await base44.auth.updateMe({
        [toleranceKey]: newMultiplier
      });
      
      toast.success('Thanks for the feedback! We\'ll adjust future estimates.');
      onClose();
    } catch (error) {
      console.error('[SessionFeedbackModal] Error saving feedback:', error);
      toast.error('Failed to save feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>How was that session?</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Help us improve your buzz estimates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Compared to what you expected, was this session:
          </p>

          <div className="space-y-2">
            {feedbackOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedFeedback(option.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedFeedback === option.value
                      ? 'bg-[#25A55F]/20 border-[#25A55F]'
                      : 'bg-[#0A0A0B] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${option.color}`} />
                  <span className="text-white font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-800 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFeedback === null || submitting}
              className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
            >
              {submitting ? 'Saving...' : 'Submit'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your feedback helps us personalize estimates for this method
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}