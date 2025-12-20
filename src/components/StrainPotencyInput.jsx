import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Info, Save, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function StrainPotencyInput({ 
  strainName, 
  method, 
  onPotencyLoaded, 
  userId 
}) {
  const [strainProfile, setStrainProfile] = useState(null);
  const [thcPercent, setThcPercent] = useState('');
  const [cbdPercent, setCbdPercent] = useState('');
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Use refs instead of state to track editing without triggering re-renders
  const isEditingRef = useRef(false);
  const lastLoadedStrainRef = useRef(null);
  const onPotencyLoadedRef = useRef(onPotencyLoaded);

  // Update the ref when callback changes, but don't trigger effect
  useEffect(() => {
    onPotencyLoadedRef.current = onPotencyLoaded;
  }, [onPotencyLoaded]);

  useEffect(() => {
    // Debounce the API call to prevent rate limiting
    const timer = setTimeout(() => {
      const loadStrainProfile = async () => {
        if (!strainName?.trim()) {
          // Clear state if no strain name
          setStrainProfile(null);
          setThcPercent('');
          setCbdPercent('');
          setSaved(false);
          setShowSaveOption(false);
          isEditingRef.current = false;
          lastLoadedStrainRef.current = null;
          if (onPotencyLoadedRef.current) {
            onPotencyLoadedRef.current(null, null);
          }
          return;
        }

        // FIXED: Don't reload if user is actively editing the same strain
        if (isEditingRef.current && lastLoadedStrainRef.current === strainName.trim()) {
          console.log('[StrainPotencyInput] User is editing, skipping reload');
          return;
        }

        try {
          const profiles = await base44.entities.StrainProfile.filter({
            strainName: strainName.trim()
          });

          if (profiles.length > 0) {
            const profile = profiles[0];
            setStrainProfile(profile);
            
            // Only update fields if not currently editing or if strain changed
            if (!isEditingRef.current || lastLoadedStrainRef.current !== strainName.trim()) {
              console.log('[StrainPotencyInput] Loading saved potency:', profile.thcPercent);
              setThcPercent(profile.thcPercent?.toString() || '');
              setCbdPercent(profile.cbdPercent?.toString() || '');
              setSaved(true);
              setShowSaveOption(false);
              isEditingRef.current = false;
            }
            
            lastLoadedStrainRef.current = strainName.trim();
            
            // Notify parent component of loaded potency
            if (onPotencyLoadedRef.current && profile.thcPercent) {
              onPotencyLoadedRef.current(profile.thcPercent, profile.cbdPercent);
            }
          } else {
            // New strain, show save option
            setStrainProfile(null);
            
            // Only clear fields if not editing or strain changed
            if (!isEditingRef.current || lastLoadedStrainRef.current !== strainName.trim()) {
              setThcPercent('');
              setCbdPercent('');
            }
            
            setShowSaveOption(true);
            setSaved(false);
            lastLoadedStrainRef.current = strainName.trim();
            
            // Notify parent that no potency was loaded
            if (onPotencyLoadedRef.current) {
              onPotencyLoadedRef.current(null, null);
            }
          }
        } catch (error) {
          console.error('Error loading strain profile:', error);
          // Don't show error toast for rate limiting during typing
          if (!error?.message?.includes('Rate limit')) {
            toast.error('Failed to load strain profile');
          }
        }
      };

      loadStrainProfile();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [strainName]); // FIXED: Only depend on strainName, not onPotencyLoaded

  const handleSaveProfile = async () => {
    if (!strainName?.trim()) {
      toast.error('Please enter a strain name first');
      return;
    }

    const thc = parseFloat(thcPercent);
    const cbd = parseFloat(cbdPercent);

    if (isNaN(thc) || thc < 0 || thc > 100) {
      toast.error('THC% must be between 0 and 100');
      return;
    }

    if (cbdPercent && (isNaN(cbd) || cbd < 0 || cbd > 100)) {
      toast.error('CBD% must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        uid: userId,
        strainName: strainName.trim(),
        thcPercent: thc,
        cbdPercent: cbd || null,
        lastUsed: new Date().toISOString(),
        totalSessions: strainProfile ? (strainProfile.totalSessions || 0) + 1 : 1
      };

      if (strainProfile) {
        await base44.entities.StrainProfile.update(strainProfile.id, profileData);
      } else {
        const newProfile = await base44.entities.StrainProfile.create(profileData);
        setStrainProfile(newProfile);
      }

      setSaved(true);
      setShowSaveOption(false);
      isEditingRef.current = false;
      toast.success('Strain potency saved! 🌿');
      
      // Notify parent
      if (onPotencyLoadedRef.current) {
        onPotencyLoadedRef.current(thc, cbd);
      }
    } catch (error) {
      console.error('Error saving strain profile:', error);
      toast.error('Failed to save strain profile');
    } finally {
      setSaving(false);
    }
  };

  const handleThcChange = (e) => {
    console.log('[StrainPotencyInput] User editing THC, setting isEditing=true');
    isEditingRef.current = true;
    setThcPercent(e.target.value);
    setShowSaveOption(true);
    setSaved(false);
  };

  const handleCbdChange = (e) => {
    console.log('[StrainPotencyInput] User editing CBD, setting isEditing=true');
    isEditingRef.current = true;
    setCbdPercent(e.target.value);
    setShowSaveOption(true);
    setSaved(false);
  };

  const handleFocus = () => {
    console.log('[StrainPotencyInput] Field focused, setting isEditing=true');
    isEditingRef.current = true;
  };

  if (!strainName?.trim()) return null;

  return (
    <div className="mt-4 p-4 bg-[#141416] rounded-lg border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-[#25A55F]" />
        <h3 className="text-white font-semibold text-sm">Strain Potency</h3>
        {saved && !isEditingRef.current && <Check className="w-4 h-4 text-green-500 ml-auto" />}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-gray-300 text-xs">THC %</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g. 20"
            value={thcPercent}
            onChange={handleThcChange}
            onFocus={handleFocus}
            className="bg-[#0A0A0B] border-gray-700 text-white h-9"
          />
        </div>

        <div>
          <Label className="text-gray-300 text-xs">CBD % (optional)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g. 1"
            value={cbdPercent}
            onChange={handleCbdChange}
            onFocus={handleFocus}
            className="bg-[#0A0A0B] border-gray-700 text-white h-9"
          />
        </div>
      </div>

      {showSaveOption && thcPercent && (
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          size="sm"
          className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white h-8"
        >
          {saving ? (
            'Saving...'
          ) : strainProfile ? (
            <>
              <Save className="w-3 h-3 mr-1" />
              Update Strain
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-1" />
              Save for Future Sessions
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {saved && !isEditingRef.current ? 
          'Saved! You can update this here or manage all your strains in Settings → My Strains.' :
          'Enter the THC% to save this strain profile. You can update it anytime in Settings → My Strains.'
        }
      </p>
    </div>
  );
}