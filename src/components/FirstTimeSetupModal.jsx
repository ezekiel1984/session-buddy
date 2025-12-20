
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FirstTimeSetupModal({ isOpen, onComplete }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tolerance: 'medium',
    weightKg: '',
    units: 'metric'
  });

  const handleSave = async () => {
    if (!formData.tolerance) {
      toast.error('Please select your tolerance level');
      return;
    }

    // Make body weight a mandatory field
    if (!formData.weightKg || formData.weightKg.trim() === '') {
      toast.error('Please enter your body weight');
      return;
    }

    setSaving(true);
    try {
      let kg = parseFloat(formData.weightKg);
      if (formData.units === 'imperial') {
        kg = kg / 2.20462;
      }

      const updateData = {
        tolerance: formData.tolerance,
        units: formData.units,
        weightKg: kg // weightKg is now always included and validated
      };

      await base44.auth.updateMe(updateData);
      toast.success('Defaults saved!');
      onComplete(updateData);
    } catch (error) {
      console.error('Error saving defaults:', error);
      toast.error('Failed to save defaults');
    } finally {
      setSaving(false);
    }
  };

  const getWeightPlaceholder = () => {
    return formData.units === 'metric' ? '70' : '154';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-[#25A55F]/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#25A55F]" />
            </div>
            Set Your Defaults
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            These help us personalize your buzz estimates. You can change them anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Tolerance Level *</Label>
            <Select value={formData.tolerance} onValueChange={(value) => setFormData(prev => ({ ...prev, tolerance: value }))}>
              <SelectTrigger className="bg-[#0A0A0B] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Occasional use</SelectItem>
                <SelectItem value="medium">Medium - Regular use</SelectItem>
                <SelectItem value="high">High - Daily use</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Units</Label>
            <Select value={formData.units} onValueChange={(value) => setFormData(prev => ({ ...prev, units: value }))}>
              <SelectTrigger className="bg-[#0A0A0B] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">
              Body Weight ({formData.units === 'metric' ? 'kg' : 'lbs'}) *
            </Label>
            <Input
              type="number"
              step="0.1"
              value={formData.weightKg}
              onChange={(e) => setFormData(prev => ({ ...prev, weightKg: e.target.value }))}
              placeholder={getWeightPlaceholder()}
              required // Added required attribute
              className="bg-[#0A0A0B] border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500">
              Required for accurate buzz calculations
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
