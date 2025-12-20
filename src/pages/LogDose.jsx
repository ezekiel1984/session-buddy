import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Zap, Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { getBuzzAndSoberInfo } from '@/components/utils/buzzCalculator';
import {
  calculateTHC,
  CONVERSION_FACTORS,
  DEFAULT_THC_PERCENTAGES,
  DEFAULT_OIL_STRENGTH,
  getMethodTooltip
} from '@/components/utils/absorptionConstants';
import { trackEvent, AnalyticsEvents } from '@/components/utils/analytics';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import AgeGate from '@/components/AgeGate';
import LoadingScreen from '@/components/LoadingScreen';
import AbsorptionInfoModal from '@/components/AbsorptionInfoModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import StrainPotencyInput from '@/components/StrainPotencyInput';
import OnboardingTooltip from '@/components/OnboardingTooltip';
import { logger } from '@/components/utils/logger';

export default function LogDose() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showAbsorptionInfo, setShowAbsorptionInfo] = useState(false);
  const [showStackDialog, setShowStackDialog] = useState(false);
  const [recentSession, setRecentSession] = useState(null);
  const [potentialStackRootId, setPotentialStackRootId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useDelivered, setUseDelivered] = useState(false);
  const [strainPotency, setStrainPotency] = useState(null);

  const [formData, setFormData] = useState({
    method: 'vape_dry',
    quickSelect: 'moderate',
    strain: '',
    timeOption: 'now',
    customTime: '',

    vd_unit: 'caps',
    vd_capsCount: '',
    vd_capsuleSize: CONVERSION_FACTORS.capsule_standard,
    vd_grams: '',
    vd_thcPercent: DEFAULT_THC_PERCENTAGES.flower,

    smoke_unit: 'cones',
    smoke_count: '',
    smoke_coneSize: CONVERSION_FACTORS.cone_standard,
    smoke_jointSize: CONVERSION_FACTORS.joint_standard,
    smoke_grams: '',
    smoke_thcPercent: DEFAULT_THC_PERCENTAGES.flower,

    dab_grams: '',
    dab_thcPercent: DEFAULT_THC_PERCENTAGES.concentrate,

    cart_inputMode: 'puffs',
    cart_puffs: '',
    cart_puffMass: CONVERSION_FACTORS.puff_medium,
    cart_ml: '',
    cart_density: CONVERSION_FACTORS.cart_density,
    cart_thcPercent: DEFAULT_THC_PERCENTAGES.vape_oil,

    edible_labelMg: '',

    oil_inputMode: 'ml',
    oil_ml: '',
    oil_drops: '',
    oil_dropSize: CONVERSION_FACTORS.drop_size_ml,
    oil_mgPerMl: DEFAULT_OIL_STRENGTH
  });

  const [thcEstimate, setThcEstimate] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    try {
      const prefillData = sessionStorage.getItem('dosePrefill');
      if (prefillData) {
        const data = JSON.parse(prefillData);

        setFormData(prev => {
          const newFormData = {
            ...prev,
            method: data.method || prev.method,
            strain: data.strain || '',
            timeOption: 'now',
            customTime: '',
            quickSelect: data.quickSelect || 'moderate',
          };

          if (data.rawInput) {
            Object.keys(data.rawInput).forEach(key => {
              if (newFormData.hasOwnProperty(key)) {
                if (typeof data.rawInput[key] === 'number') {
                  newFormData[key] = data.rawInput[key].toString();
                } else {
                  newFormData[key] = data.rawInput[key];
                }
              }
            });
          }
          return newFormData;
        });

        sessionStorage.removeItem('dosePrefill');
        toast.success('Dose template loaded! Ready to log again 🔥');
      }
    } catch (error) {
      logger.error('Error loading prefill data:', error);
      toast.error('Error loading prefill data.');
    }
  }, []);

  useEffect(() => {
    const methodDefaults = {
      vape_dry: 'moderate',
      smoke: 'standard',
      dab: 'standard',
      vape_cart: 'short',
      edible: 'moderate',
      oil_sublingual: 'moderate',
      oil_ingested: 'moderate'
    };

    const newDefault = methodDefaults[formData.method] || 'moderate';
    if (formData.quickSelect !== newDefault && formData.quickSelect !== 'custom') {
      handleChange('quickSelect', newDefault);
    }
  }, [formData.method]);

  // Sync strain potency to Advanced Settings THC% field
  useEffect(() => {
    if (strainPotency?.thc && formData.strain?.trim()) {
      // Only sync if the current Advanced Settings field is empty or matches a default
      // This prevents overwriting a manual user edit
      const currentThcField = (() => {
        switch (formData.method) {
          case 'vape_dry': return 'vd_thcPercent';
          case 'smoke': return 'smoke_thcPercent';
          case 'dab': return 'dab_thcPercent';
          case 'vape_cart': return 'cart_thcPercent';
          default: return null;
        }
      })();

      if (currentThcField) {
        const currentValue = parseFloat(formData[currentThcField]);
        const defaultValue = (() => {
          switch (formData.method) {
            case 'vape_dry':
            case 'smoke':
              return DEFAULT_THC_PERCENTAGES.flower;
            case 'dab':
              return DEFAULT_THC_PERCENTAGES.concentrate;
            case 'vape_cart':
              return DEFAULT_THC_PERCENTAGES.vape_oil;
            default:
              return 0; // Should not happen for these methods
          }
        })();

        // Only auto-sync if field is empty, at default, or matches a previous strain potency
        // Don't override if user has manually entered a different value
        if (isNaN(currentValue) || currentValue === defaultValue || (strainPotency.thc && currentValue === strainPotency.thc)) {
          handleChange(currentThcField, strainPotency.thc.toString());
        }
      }
    }
  }, [strainPotency, formData.method, formData.strain]); // Added formData.strain to dependencies for when strain name changes

  useEffect(() => {
    const loadUser = async (retries = 3) => {
      try {
        const currentUser = await base44.auth.me();

        if (!currentUser.ageConfirmed) {
          setUser(currentUser);
          setShowAgeGate(true);
          setAuthLoading(false);
          return;
        }

        setUser(currentUser);

        if (currentUser.advancedSettings) {
          const advancedSettingsToApply = {};
          for (const key in currentUser.advancedSettings) {
            if (currentUser.advancedSettings.hasOwnProperty(key)) {
              const value = currentUser.advancedSettings[key];
              advancedSettingsToApply[key] = typeof value === 'number' ? value.toString() : value;
            }
          }
          setFormData(prev => ({ ...prev, ...advancedSettingsToApply }));
        }

        setAuthLoading(false);
      } catch (error) {
        logger.error('Error loading user in LogDose:', error);

        // Retry on network errors
        if (retries > 0 && (error.message === 'Network Error' || !error.response)) {
          logger.warn(`[LogDose] Retrying loadUser... (${retries} attempts left)`);
          setTimeout(() => loadUser(retries - 1), 1000);
          return;
        }

        const errorMessage = error?.message || String(error);
        const isAuthError = errorMessage.toLowerCase().includes('logged in') ||
                          errorMessage.toLowerCase().includes('unauthorized') ||
                          errorMessage.toLowerCase().includes('jwt');

        if (isAuthError) {
          base44.auth.redirectToLogin(window.location.pathname);
        } else {
          toast.error('Error loading user data. Please check your connection.');
          setAuthLoading(false);
        }
      }
    };

    loadUser();
  }, [navigate]);

  useEffect(() => {
    const checkRecentSession = async () => {
      if (!user?.id) return;

      try {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const recentSessions = await base44.entities.Session.filter(
          { uid: user.id },
          '-created_date',
          10
        );

        logger.debug('[LogDose] Checking for recent sessions. Found:', recentSessions.length);

        const activeSession = recentSessions.find(s => {
          const sessionDate = new Date(s.startedAt);
          const isRecent = sessionDate >= fourHoursAgo;
          logger.debug('[LogDose] Session', s.id, 'started at', sessionDate, 'is recent?', isRecent);
          return isRecent;
        });

        if (activeSession) {
          logger.debug('[LogDose] Found recent session within 4hr window:', activeSession.id);
          setRecentSession(activeSession);
        } else {
          logger.debug('[LogDose] No recent sessions within 4hr window');
          setRecentSession(null);
        }
      } catch (error) {
        logger.error('[LogDose] Error checking recent sessions:', error);
        setRecentSession(null);
      }
    };

    if (user?.id) {
      checkRecentSession();
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStackSession = (shouldStack) => {
    logger.debug('[LogDose] Stack dialog response:', shouldStack ? 'Yes, stack it' : 'No, new session');
    setShowStackDialog(false);
    if (shouldStack && potentialStackRootId) {
      logger.debug('[LogDose] Stacking with root session:', potentialStackRootId);
      handleSubmit(null, potentialStackRootId);
    } else {
      logger.debug('[LogDose] Creating new standalone session (stackedWith: null)');
      handleSubmit(null, null);
    }
    setPotentialStackRootId(null);
  };

  const handleSubmit = async (e, stackWithSessionId = undefined) => {
    if (e) e.preventDefault();

    logger.debug('[LogDose] handleSubmit - stackWithSessionId:', stackWithSessionId);

    setLoading(true);

    try {
      if (!user?.id) {
        logger.error('[LogDose] No user ID');
        toast.error('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      logger.debug('[LogDose] User ID:', user.id);

      if (!formData.strain?.trim()) {
        toast.error('Please enter a strain name');
        setLoading(false);
        return;
      }

      if (!thcEstimate?.totalTHCMg || isNaN(thcEstimate.totalTHCMg)) {
        toast.error('Please enter valid dosage information');
        setLoading(false);
        return;
      }

      let startedAt;
      if (formData.timeOption === 'earlier' && formData.customTime) {
        const selectedDate = new Date(formData.customTime);

        if (isNaN(selectedDate.getTime())) {
          toast.error('Please select a valid date and time');
          setLoading(false);
          return;
        }

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        if (selectedDate > now) {
          toast.error('Start time cannot be in the future');
          setLoading(false);
          return;
        }

        if (selectedDate < twentyFourHoursAgo) {
          toast.error('Start time must be within the last 24 hours');
          setLoading(false);
          return;
        }

        startedAt = selectedDate.toISOString();
      } else {
        startedAt = new Date().toISOString();
      }

      const STACK_WINDOW_HOURS = 3;
      let determinedStackWithId = stackWithSessionId;

      if (stackWithSessionId === undefined) {
        const doseStartedAt = new Date(startedAt);
        const allUserSessions = await base44.entities.Session.filter(
          { uid: user.id },
          '-startedAt',
          50
        );

        logger.debug(`[LogDose] Checking stacking logic for new dose startedAt: ${doseStartedAt}`);

        // Find sessions within the window (both before and after)
        const nearbySessions = allUserSessions.filter(s => {
          const sessionTime = new Date(s.startedAt);
          const timeDiffMs = Math.abs(doseStartedAt - sessionTime);
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          return timeDiffHours <= STACK_WINDOW_HOURS;
        });

        if (nearbySessions.length > 0) {
          // Find the closest session
          const closestSession = nearbySessions.reduce((closest, s) => {
            const sTime = new Date(s.startedAt);
            const closestTime = new Date(closest.startedAt);
            const sDiff = Math.abs(doseStartedAt - sTime);
            const closestDiff = Math.abs(doseStartedAt - closestTime);
            return sDiff < closestDiff ? s : closest;
          });

          const closestTime = new Date(closestSession.startedAt);
          const timeDiffMs = Math.abs(doseStartedAt - closestTime);
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

          logger.debug(`[LogDose] Closest session: ${closestSession.id}, startedAt: ${closestTime}, Time diff: ${timeDiffHours.toFixed(2)} hours`);

          const calculatedStackRootId = closestSession.stackedWith || closestSession.id;
          logger.debug(`[LogDose] Potential stacking detected. Root session for stacking: ${calculatedStackRootId}`);
          
          setPotentialStackRootId(calculatedStackRootId);
          setShowStackDialog(true);
          setLoading(false);
          return;
        }
      } else {
        determinedStackWithId = stackWithSessionId;
      }

      const tolerance = user.tolerance || 'medium';
      const bodyWeightKg = user.weightKg || 70;

      const dosageMg = useDelivered && thcEstimate.deliveredMg
        ? thcEstimate.deliveredMg
        : thcEstimate.totalTHCMg;

      logger.debug('[LogDose] Calculating buzz info with:', {
        dosageMg,
        method: formData.method,
        tolerance,
        bodyWeightKg,
        startedAt
      });

      const buzzInfo = getBuzzAndSoberInfo({
        dosageMg,
        method: formData.method,
        tolerance,
        bodyWeightKg,
        startedAt
      });

      logger.debug('[LogDose] Buzz info calculated:', {
        initialBuzzScore: buzzInfo.initialBuzzScore,
        soberAt: buzzInfo.soberAt
      });

      let rawInputData = {};
      if (formData.method === 'vape_dry' && formData.quickSelect === 'custom') {
        if (formData.vd_unit === 'caps') {
          rawInputData = {
            vd_unit: formData.vd_unit,
            vd_capsCount: parseFloat(formData.vd_capsCount),
            vd_capsuleSize: parseFloat(formData.vd_capsuleSize),
            vd_thcPercent: parseFloat(formData.vd_thcPercent)
          };
        } else {
          rawInputData = {
            vd_unit: formData.vd_unit,
            vd_grams: parseFloat(formData.vd_grams),
            vd_thcPercent: parseFloat(formData.vd_thcPercent)
          };
        }
      } else if (formData.method === 'smoke' && formData.quickSelect === 'custom') {
        if (formData.smoke_unit === 'grams') {
          rawInputData = {
            smoke_unit: formData.smoke_unit,
            smoke_grams: parseFloat(formData.smoke_grams),
            smoke_thcPercent: parseFloat(formData.smoke_thcPercent)
          };
        } else {
          rawInputData = {
            smoke_unit: formData.smoke_unit,
            smoke_count: parseFloat(formData.smoke_count),
            smoke_coneSize: parseFloat(formData.smoke_coneSize),
            smoke_jointSize: parseFloat(formData.smoke_jointSize),
            smoke_thcPercent: parseFloat(formData.smoke_thcPercent)
          };
        }
      } else if (formData.method === 'dab' && formData.quickSelect === 'custom') {
        rawInputData = {
          dab_grams: parseFloat(formData.dab_grams),
          dab_thcPercent: parseFloat(formData.dab_thcPercent)
        };
      } else if (formData.method === 'vape_cart' && formData.quickSelect === 'custom') {
        if (formData.cart_inputMode === 'puffs') {
          rawInputData = {
            cart_inputMode: formData.cart_inputMode,
            cart_puffs: parseFloat(formData.cart_puffs),
            cart_puffMass: parseFloat(formData.cart_puffMass),
            cart_density: parseFloat(formData.cart_density),
            cart_thcPercent: parseFloat(formData.cart_thcPercent)
          };
        } else {
          rawInputData = {
            cart_inputMode: formData.cart_inputMode,
            cart_ml: parseFloat(formData.cart_ml),
            cart_density: parseFloat(formData.cart_density),
            cart_thcPercent: parseFloat(formData.cart_thcPercent)
          };
        }
      } else if (formData.method === 'edible' && formData.quickSelect === 'custom') {
        rawInputData = {
          edible_labelMg: parseFloat(formData.edible_labelMg)
        };
      } else if ((formData.method === 'oil_sublingual' || formData.method === 'oil_ingested') && formData.quickSelect === 'custom') {
        if (formData.oil_inputMode === 'ml') {
          rawInputData = {
            oil_inputMode: formData.oil_inputMode,
            oil_ml: parseFloat(formData.oil_ml),
            oil_mgPerMl: parseFloat(formData.oil_mgPerMl)
          };
        } else {
          rawInputData = {
            oil_inputMode: formData.oil_inputMode,
            oil_drops: parseFloat(formData.oil_drops),
            oil_dropSize: parseFloat(formData.oil_dropSize),
            oil_mgPerMl: parseFloat(formData.oil_mgPerMl)
          };
        }
      }

      // Override THC% in rawInputData if strainPotency is available
      // This ensures the value used for logging is the correct one, even if the user manually changed the Advanced Setting field
      // The Advanced Setting field is merely for user input, the `thcEstimate` and this logic below is for the final value.
      if (strainPotency?.thc && formData.quickSelect === 'custom') { // Only override for custom inputs, quickselects use their hardcoded values or are based on form field values for potency
        if (formData.method === 'vape_dry' && rawInputData.vd_thcPercent !== undefined) {
          rawInputData.vd_thcPercent = strainPotency.thc;
        } else if (formData.method === 'smoke' && rawInputData.smoke_thcPercent !== undefined) {
          rawInputData.smoke_thcPercent = strainPotency.thc;
        } else if (formData.method === 'dab' && rawInputData.dab_thcPercent !== undefined) {
          rawInputData.dab_thcPercent = strainPotency.thc;
        } else if (formData.method === 'vape_cart' && rawInputData.cart_thcPercent !== undefined) {
          rawInputData.cart_thcPercent = strainPotency.thc;
        }
      }
      // Add CBD if available for future use
      if (strainPotency?.cbd) {
        rawInputData.cbdPercent = strainPotency.cbd;
      }


      rawInputData = {
        ...rawInputData,
        quickSelect: formData.quickSelect,
        method: formData.method,
      };

      const finalStackedWith = determinedStackWithId === undefined ? null : (determinedStackWithId || null);

      logger.debug('[LogDose] Final stackedWith:', finalStackedWith);

      const sessionData = {
        uid: user.id,
        method: formData.method,
        dosageMg: dosageMg,
        totalTHCMg: thcEstimate.totalTHCMg,
        rawInput: rawInputData,
        strain: formData.strain.trim(),
        startedAt: startedAt,
        tolerance: tolerance,
        buzzScore: buzzInfo.initialBuzzScore,
        soberAt: buzzInfo.soberAt,
        bodyWeightKg: bodyWeightKg,
        stackedWith: finalStackedWith
      };

      logger.debug('[LogDose] Creating session with data:', JSON.stringify(sessionData, null, 2));

      let session;
      try {
        session = await base44.entities.Session.create(sessionData);
        logger.debug('[LogDose] ✅ Session created! Response:', JSON.stringify(session, null, 2));
      } catch (createError) {
        logger.error('[LogDose] ❌ ERROR creating session:', createError);
        throw new Error(`Failed to create session: ${createError.message}`);
      }

      if (!session?.id) {
        logger.error('[LogDose] ❌ Session created but no ID returned:', session);
        throw new Error('Session created but no ID returned');
      }

      logger.debug('[LogDose] ✅ Session created successfully! ID:', session.id);

      try {
        await base44.auth.updateMe({
          advancedSettings: {
            vd_thcPercent: formData.vd_thcPercent,
            smoke_thcPercent: formData.smoke_thcPercent,
            dab_thcPercent: formData.dab_thcPercent,
            cart_thcPercent: formData.cart_thcPercent,
            cart_density: formData.cart_density,
            cart_puffMass: formData.cart_puffMass,
            oil_mgPerMl: formData.oil_mgPerMl,
            oil_dropSize: formData.oil_dropSize
          }
        });
      } catch (settingsError) {
        logger.warn('[LogDose] Failed to save settings:', settingsError);
      }

      trackEvent(AnalyticsEvents.SESSION_LOGGED, {
        method: formData.method,
        dosageMg: dosageMg,
        quickSelect: formData.quickSelect,
        isStacked: !!(finalStackedWith)
      });

      toast.success('Dose logged successfully! 🔥');

      logger.debug('[LogDose] Navigating to BuzzResult');
      navigate(createPageUrl('BuzzResult'));

    } catch (error) {
      logger.error('[LogDose] ❌❌❌ CRITICAL ERROR:', error);
      toast.error(`Failed to log dose: ${error?.message || 'Unknown error'}. Please try again.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      let rawInput = {};

      switch (formData.method) {
        case 'vape_dry':
          if (formData.quickSelect !== 'custom') {
            const presets = {
              light: 0.08,
              moderate: 0.10,
              heavy: 0.15
            };
            const gramsAmount = presets[formData.quickSelect];
            if (!gramsAmount) {
              setThcEstimate(null);
              return;
            }
            // Use strain potency if available, otherwise use form THC%
            const thcToUse = strainPotency?.thc || parseFloat(formData.vd_thcPercent);
            rawInput = {
              grams: gramsAmount,
              thcPercent: thcToUse
            };
          } else if (formData.vd_unit === 'caps') {
            const capsCount = parseFloat(formData.vd_capsCount);
            if (!capsCount || isNaN(capsCount) || capsCount <= 0) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.vd_thcPercent);
            rawInput = {
              capsCount: capsCount,
              capsuleSize: parseFloat(formData.vd_capsuleSize),
              thcPercent: thcToUse
            };
          } else {
            const grams = parseFloat(formData.vd_grams);
            if (!grams || isNaN(grams) || grams <= 0) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.vd_thcPercent);
            rawInput = {
              grams: grams,
              thcPercent: thcToUse
            };
          }
          break;

        case 'smoke':
          if (formData.quickSelect !== 'custom') {
            const presets = {
              light: { unit: 'cones', count: 1, size: CONVERSION_FACTORS.cone_small },
              standard: { unit: 'cones', count: 1, size: CONVERSION_FACTORS.cone_standard },
              heavy: { unit: 'cones', count: 2, size: CONVERSION_FACTORS.cone_standard }
            };
            const preset = presets[formData.quickSelect];
            if (!preset) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.smoke_thcPercent);
            rawInput = {
              count: preset.count,
              size: preset.size,
              unit: preset.unit,
              thcPercent: thcToUse
            };
          } else if (formData.smoke_unit === 'grams') {
            const grams = parseFloat(formData.smoke_grams);
            if (!grams || isNaN(grams) || grams <= 0) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.smoke_thcPercent);
            rawInput = {
              grams: grams,
              thcPercent: thcToUse
            };
          } else {
            const count = parseFloat(formData.smoke_count);
            if (!count || isNaN(count) || count <= 0) {
              setThcEstimate(null);
              return;
            }
            const size = formData.smoke_unit === 'cones'
              ? parseFloat(formData.smoke_coneSize)
              : parseFloat(formData.smoke_jointSize);
            const thcToUse = strainPotency?.thc || parseFloat(formData.smoke_thcPercent);
            rawInput = {
              count: count,
              size: size,
              unit: formData.smoke_unit,
              thcPercent: thcToUse
            };
          }
          break;

        case 'dab':
          if (formData.quickSelect !== 'custom') {
            const presets = { tap: 0.025, standard: 0.05, fat: 0.10 };
            const grams = presets[formData.quickSelect];
            if (!grams) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.dab_thcPercent);
            rawInput = {
              grams: grams,
              thcPercent: thcToUse
            };
          } else {
            const grams = parseFloat(formData.dab_grams);
            if (!grams || isNaN(grams) || grams <= 0) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.dab_thcPercent);
            rawInput = {
              grams: grams,
              thcPercent: thcToUse
            };
          }
          break;

        case 'vape_cart':
          if (formData.quickSelect !== 'custom') {
            const presets = { short: 3, moderate: 5, heavy: 10 };
            const puffs = presets[formData.quickSelect];
            if (!puffs) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.cart_thcPercent);
            rawInput = {
              puffs: puffs,
              puffMass: parseFloat(formData.cart_puffMass),
              density: parseFloat(formData.cart_density),
              thcPercent: thcToUse
            };
          } else if (formData.cart_inputMode === 'puffs') {
            const puffs = parseFloat(formData.cart_puffs);
            if (!puffs || isNaN(puffs) || puffs <= 0) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.cart_thcPercent);
            rawInput = {
              puffs: puffs,
              puffMass: parseFloat(formData.cart_puffMass),
              density: parseFloat(formData.cart_density),
              thcPercent: thcToUse
            };
          } else {
            const ml = parseFloat(formData.cart_ml);
            if (!ml || isNaN(ml) || ml <= 0) {
              setThcEstimate(null);
              return;
            }
            const thcToUse = strainPotency?.thc || parseFloat(formData.cart_thcPercent);
            rawInput = {
              ml: ml,
              density: parseFloat(formData.cart_density),
              thcPercent: thcToUse
            };
          }
          break;

        case 'edible':
          if (formData.quickSelect !== 'custom') {
            const presets = { light: 5, moderate: 10, heavy: 20 };
            const mg = presets[formData.quickSelect];
            if (!mg) {
              setThcEstimate(null);
              return;
            }
            rawInput = { labelMg: mg };
          } else {
            const mg = parseFloat(formData.edible_labelMg);
            if (!mg || isNaN(mg) || mg <= 0) {
              setThcEstimate(null);
              return;
            }
            rawInput = { labelMg: mg };
          }
          break;

        case 'oil_sublingual':
        case 'oil_ingested':
          if (formData.quickSelect !== 'custom') {
            const presets = { light: 0.25, moderate: 0.5, heavy: 1.0 };
            const ml = presets[formData.quickSelect];
            if (!ml) {
              setThcEstimate(null);
              return;
            }
            rawInput = {
              ml: ml,
              mgPerMl: parseFloat(formData.oil_mgPerMl)
            };
          } else if (formData.oil_inputMode === 'ml') {
            const ml = parseFloat(formData.oil_ml);
            if (!ml || isNaN(ml) || ml <= 0) {
              setThcEstimate(null);
              return;
            }
            rawInput = {
              ml: ml,
              mgPerMl: parseFloat(formData.oil_mgPerMl)
            };
          } else {
            const drops = parseFloat(formData.oil_drops);
            if (!drops || isNaN(drops) || drops <= 0) {
              setThcEstimate(null);
              return;
            }
            rawInput = {
              drops: drops,
              dropSize: parseFloat(formData.oil_dropSize),
              mgPerMl: parseFloat(formData.oil_mgPerMl)
            };
          }
          break;

        default:
          setThcEstimate(null);
          return;
      }

      const estimate = calculateTHC({
        method: formData.method,
        rawInput,
        useDelivered
      });

      setThcEstimate(estimate);
    } catch (error) {
      logger.error('[LogDose] Error calculating THC:', error);
      setThcEstimate(null);
    }
  }, [formData, useDelivered, strainPotency]);

  const handleAgeConfirmed = async () => {
    try {
      await base44.auth.updateMe({ ageConfirmed: true });
      setUser(prev => ({ ...prev, ageConfirmed: true }));
      setShowAgeGate(false);
    } catch (error) {
      logger.error('Error updating age confirmation:', error);
      toast.error('Error confirming age. Please try again.');
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (showAgeGate) {
    return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  }

  const methodOptions = [
    { value: 'vape_dry', label: 'Vape (Dry Herb)' },
    { value: 'smoke', label: 'Smoke' },
    { value: 'dab', label: 'Dab' },
    { value: 'vape_cart', label: 'Vape (Cart)' },
    { value: 'edible', label: 'Edible' },
    { value: 'oil_sublingual', label: 'Oil (Sublingual)' },
    { value: 'oil_ingested', label: 'Oil (Ingested)' }
  ];

  const getQuickSelectOptions = () => {
    switch (formData.method) {
      case 'vape_dry':
        return [
          { value: 'light', label: 'Light', subtitle: '0.08g' },
          { value: 'moderate', label: 'Moderate', subtitle: '0.10g' },
          { value: 'heavy', label: 'Heavy', subtitle: '0.15g' },
          { value: 'custom', label: 'Custom', subtitle: '' }
        ];
      case 'smoke':
        return [
          { value: 'light', label: 'Light', subtitle: '1 small cone' },
          { value: 'standard', label: 'Standard', subtitle: '1 std cone' },
          { value: 'heavy', label: 'Heavy', subtitle: '2 std cones' },
          { value: 'custom', label: 'Custom', subtitle: '' }
        ];
      case 'dab':
        return [
          { value: 'tap', label: 'Tap', subtitle: '0.025g' },
          { value: 'standard', label: 'Standard', subtitle: '0.05g' },
          { value: 'fat', label: 'Fat', subtitle: '0.10g' },
          { value: 'custom', label: 'Custom', subtitle: '' }
        ];
      case 'vape_cart':
        return [
          { value: 'short', label: 'Short', subtitle: '3 puffs' },
          { value: 'moderate', label: 'Moderate', subtitle: '5 puffs' },
          { value: 'heavy', label: 'Heavy', subtitle: '10 puffs' },
          { value: 'custom', label: 'Custom', subtitle: '' }
        ];
      case 'edible':
        return [
          { value: 'light', label: 'Light', subtitle: '5mg' },
          { value: 'moderate', label: 'Moderate', subtitle: '10mg' },
          { value: 'heavy', label: 'Heavy', subtitle: '20mg' },
          { value: 'custom', label: 'Custom', subtitle: '' }
        ];
      case 'oil_sublingual':
      case 'oil_ingested':
        return [
          { value: 'light', label: 'Light', subtitle: '0.25mL' },
          { value: 'moderate', label: 'Moderate', subtitle: '0.5mL' },
          { value: 'heavy', label: 'Heavy', subtitle: '1.0mL' },
          { value: 'custom', label: 'Custom', subtitle: '' }
        ];
      default:
        return [];
    }
  };

  const methodTooltip = getMethodTooltip(formData.method);
  const shouldShowAdvanced = ['vape_dry', 'smoke', 'dab', 'vape_cart', 'oil_sublingual', 'oil_ingested'].includes(formData.method);
  const shouldShowDelivered = ['vape_dry', 'vape_cart', 'smoke', 'dab', 'oil_sublingual', 'oil_ingested'].includes(formData.method);

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <OnboardingTooltip
        pageName="LogDose"
        title="📝 Log Your Dose"
        description="Track your cannabis consumption by logging each dose. Choose your method, enter the amount, and we'll calculate your buzz level. Remember: start low, go slow, and wait 30-60 minutes before re-dosing."
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#25A55F]" />
            Log Dose
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-white">Method</Label>
            <Select value={formData.method} onValueChange={(val) => handleChange('method', val)}>
              <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#141416] border-gray-800">
                {methodOptions.map(opt => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value}
                    className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {methodTooltip && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-200">{methodTooltip}</p>
              </div>
            )}
          </div>

          <div>
            <Label className="text-white mb-3 block">Quick Select</Label>
            <div className="grid grid-cols-2 gap-3">
              {getQuickSelectOptions().map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('quickSelect', opt.value)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                    ${formData.quickSelect === opt.value
                      ? 'bg-[#25A55F] border-[#25A55F] text-white shadow-lg shadow-[#25A55F]/20'
                      : 'bg-[#141416] border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <span className="font-semibold text-base">{opt.label}</span>
                  {opt.subtitle && (
                    <span className={`text-xs mt-1 ${formData.quickSelect === opt.value ? 'text-white/80' : 'text-gray-500'}`}>
                      {opt.subtitle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom inputs section */}
          {formData.quickSelect === 'custom' && (
            <div className="space-y-4">
              {/* Vape Dry Herb custom inputs */}
              {formData.method === 'vape_dry' && (
                <>
                  <div>
                    <Label className="text-white">Unit</Label>
                    <Select value={formData.vd_unit} onValueChange={(val) => handleChange('vd_unit', val)}>
                      <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141416] border-gray-800">
                        <SelectItem value="caps" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Caps
                        </SelectItem>
                        <SelectItem value="grams" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Grams
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.vd_unit === 'caps' ? (
                    <>
                      <div>
                        <Label className="text-white">Number of Caps</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 1"
                          value={formData.vd_capsCount}
                          onChange={(e) => handleChange('vd_capsCount', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Capsule Size</Label>
                        <Select
                          value={formData.vd_capsuleSize.toString()}
                          onValueChange={(val) => handleChange('vd_capsuleSize', parseFloat(val))}
                        >
                          <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141416] border-gray-800">
                            <SelectItem 
                              value={CONVERSION_FACTORS.capsule_small.toString()}
                              className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                            >
                              Small (0.10 g)
                            </SelectItem>
                            <SelectItem 
                              value={CONVERSION_FACTORS.capsule_standard.toString()}
                              className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                            >
                              Standard (0.12 g)
                            </SelectItem>
                            <SelectItem 
                              value={CONVERSION_FACTORS.capsule_heavy.toString()}
                              className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                            >
                              Heavy (0.15 g)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label className="text-white">Grams</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 0.10"
                        value={formData.vd_grams}
                        onChange={(e) => handleChange('vd_grams', e.target.value)}
                        className="bg-[#141416] border-gray-800 text-white"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Smoke custom inputs */}
              {formData.method === 'smoke' && (
                <>
                  <div>
                    <Label className="text-white">Unit</Label>
                    <Select value={formData.smoke_unit} onValueChange={(val) => handleChange('smoke_unit', val)}>
                      <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141416] border-gray-800">
                        <SelectItem value="cones" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Cones
                        </SelectItem>
                        <SelectItem value="joints" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Joints
                        </SelectItem>
                        <SelectItem value="grams" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Grams
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.smoke_unit === 'grams' ? (
                    <div>
                      <Label className="text-white">Grams</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 0.50"
                        value={formData.smoke_grams}
                        onChange={(e) => handleChange('smoke_grams', e.target.value)}
                        className="bg-[#141416] border-gray-800 text-white"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-white">
                          Number of {formData.smoke_unit === 'cones' ? 'Cones' : 'Joints'}
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g. 1"
                          value={formData.smoke_count}
                          onChange={(e) => handleChange('smoke_count', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">
                          {formData.smoke_unit === 'cones' ? 'Cone' : 'Joint'} Size
                        </Label>
                        <Select
                          value={
                            formData.smoke_unit === 'cones'
                              ? formData.smoke_coneSize.toString()
                              : formData.smoke_jointSize.toString()
                          }
                          onValueChange={(val) =>
                            formData.smoke_unit === 'cones'
                              ? handleChange('smoke_coneSize', parseFloat(val))
                              : handleChange('smoke_jointSize', parseFloat(val))
                          }
                        >
                          <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141416] border-gray-800">
                            {formData.smoke_unit === 'cones' ? (
                              <>
                                <SelectItem 
                                  value={CONVERSION_FACTORS.cone_small.toString()}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                                >
                                  Small (0.10 g)
                                </SelectItem>
                                <SelectItem 
                                  value={CONVERSION_FACTORS.cone_standard.toString()}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                                >
                                  Standard (0.15 g)
                                </SelectItem>
                                <SelectItem 
                                  value={CONVERSION_FACTORS.cone_fat.toString()}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                                >
                                  Fat (0.20 g)
                                </SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem 
                                  value={CONVERSION_FACTORS.joint_half.toString()}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                                >
                                  Half (0.25 g)
                                </SelectItem>
                                <SelectItem 
                                  value={CONVERSION_FACTORS.joint_standard.toString()}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                                >
                                  Standard (0.50 g)
                                </SelectItem>
                                <SelectItem 
                                  value={CONVERSION_FACTORS.joint_fat.toString()}
                                  className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                                >
                                  Fat (0.75 g)
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Dab custom inputs */}
              {formData.method === 'dab' && (
                <div>
                  <Label className="text-white">Grams</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.05"
                    value={formData.dab_grams}
                    onChange={(e) => handleChange('dab_grams', e.target.value)}
                    className="bg-[#141416] border-gray-800 text-white"
                  />
                </div>
              )}

              {/* Vape Cart custom inputs */}
              {formData.method === 'vape_cart' && (
                <>
                  <div>
                    <Label className="text-white">Input Mode</Label>
                    <Select
                      value={formData.cart_inputMode}
                      onValueChange={(val) => handleChange('cart_inputMode', val)}
                    >
                      <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141416] border-gray-800">
                        <SelectItem value="puffs" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Puffs
                        </SelectItem>
                        <SelectItem value="ml" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          mL
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.cart_inputMode === 'puffs' ? (
                    <>
                      <div>
                        <Label className="text-white">Number of Puffs</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g. 5"
                          value={formData.cart_puffs}
                          onChange={(e) => handleChange('cart_puffs', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Puff Mass (mg vapor)</Label>
                        <Select
                          value={formData.cart_puffMass.toString()}
                          onValueChange={(val) => handleChange('cart_puffMass', parseFloat(val))}
                        >
                          <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141416] border-gray-800">
                            <SelectItem 
                              value={CONVERSION_FACTORS.puff_small.toString()}
                              className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                            >
                              Small (3mg)
                            </SelectItem>
                            <SelectItem 
                              value={CONVERSION_FACTORS.puff_medium.toString()}
                              className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                            >
                              Medium (5mg)
                            </SelectItem>
                            <SelectItem 
                              value={CONVERSION_FACTORS.puff_large.toString()}
                              className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white"
                            >
                              Large (7mg)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label className="text-white">mL</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 0.05"
                        value={formData.cart_ml}
                        onChange={(e) => handleChange('cart_ml', e.target.value)}
                        className="bg-[#141416] border-gray-800 text-white"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Edible custom inputs */}
              {formData.method === 'edible' && (
                <div>
                  <Label className="text-white">Label mg THC</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="e.g. 10"
                    value={formData.edible_labelMg}
                    onChange={(e) => handleChange('edible_labelMg', e.target.value)}
                    className="bg-[#141416] border-gray-800 text-white"
                  />
                </div>
              )}

              {/* Oil custom inputs */}
              {(formData.method === 'oil_sublingual' || formData.method === 'oil_ingested') && (
                <>
                  <div>
                    <Label className="text-white">Input Mode</Label>
                    <Select
                      value={formData.oil_inputMode}
                      onValueChange={(val) => handleChange('oil_inputMode', val)}
                    >
                      <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#141416] border-gray-800">
                        <SelectItem value="ml" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          mL
                        </SelectItem>
                        <SelectItem value="drops" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                          Drops
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.oil_inputMode === 'ml' ? (
                    <div>
                      <Label className="text-white">mL</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 0.5"
                        value={formData.oil_ml}
                        onChange={(e) => handleChange('oil_ml', e.target.value)}
                        className="bg-[#141416] border-gray-800 text-white"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-white">Number of Drops</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g. 10"
                          value={formData.oil_drops}
                          onChange={(e) => handleChange('oil_drops', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Drop Size (mL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.oil_dropSize}
                          onChange={(e) => handleChange('oil_dropSize', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">Default: {CONVERSION_FACTORS.drop_size_ml} mL</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Strain/Product Name - Now with asterisk */}
          <div>
            <Label className="text-white">
              Strain/Product Name <span className="text-[#25A55F]">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Blue Dream"
              value={formData.strain}
              onChange={(e) => handleChange('strain', e.target.value)}
              className="bg-[#141416] border-gray-800 text-white"
              required
            />
          </div>

          {/* Strain Potency Input Component - Now always visible for applicable methods */}
          {user?.id && ['vape_dry', 'smoke', 'dab', 'vape_cart'].includes(formData.method) && (
            <StrainPotencyInput
              strainName={formData.strain}
              method={formData.method}
              userId={user.id}
              onPotencyLoaded={(thc, cbd) => setStrainPotency({ thc, cbd })}
            />
          )}

          {shouldShowAdvanced && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#141416] px-4 py-2 rounded-lg border border-gray-800 w-full justify-center"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </button>
          )}

          {/* Render advanced settings */}
          {showAdvanced && (
            (() => {
              switch (formData.method) {
                case 'vape_dry':
                case 'smoke':
                  const thcField = formData.method === 'vape_dry' ? 'vd_thcPercent' : 'smoke_thcPercent';
                  const currentThc = formData[thcField];
                  const hasSavedPotencyFlower = strainPotency?.thc && formData.strain?.trim();
                  
                  return (
                    <div className="mt-4 p-4 bg-[#141416] rounded-lg border border-gray-800">
                      <h3 className="text-white font-semibold mb-3">Advanced Settings</h3>
                      <div>
                        <Label className="text-white">THC % (optional)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder={hasSavedPotencyFlower ? `Using saved: ${strainPotency.thc}%` : `e.g. ${DEFAULT_THC_PERCENTAGES.flower}`}
                          value={currentThc}
                          onChange={(e) => handleChange(thcField, e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {hasSavedPotencyFlower
                            ? `Saved potency for '${formData.strain}': ${strainPotency.thc}% (override if different batch)`
                            : `Default: ${DEFAULT_THC_PERCENTAGES.flower}% for flower`
                          }
                        </p>
                      </div>
                    </div>
                  );

                case 'dab':
                  const hasSavedDabPotency = strainPotency?.thc && formData.strain?.trim();
                  
                  return (
                    <div className="mt-4 p-4 bg-[#141416] rounded-lg border border-gray-800">
                      <h3 className="text-white font-semibold mb-3">Advanced Settings</h3>
                      <div>
                        <Label className="text-white">THC % (optional)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder={hasSavedDabPotency ? `Using saved: ${strainPotency.thc}%` : `e.g. ${DEFAULT_THC_PERCENTAGES.concentrate}`}
                          value={formData.dab_thcPercent}
                          onChange={(e) => handleChange('dab_thcPercent', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {hasSavedDabPotency
                            ? `Saved potency for '${formData.strain}': ${strainPotency.thc}% (override if different batch)`
                            : `Default: ${DEFAULT_THC_PERCENTAGES.concentrate}% for concentrates`
                          }
                        </p>
                      </div>
                    </div>
                  );

                case 'vape_cart':
                  const hasSavedCartPotency = strainPotency?.thc && formData.strain?.trim();
                  
                  return (
                    <div className="mt-4 p-4 bg-[#141416] rounded-lg border border-gray-800 space-y-4">
                      <h3 className="text-white font-semibold mb-3">Advanced Settings</h3>
                      <div>
                        <Label className="text-white">THC % (optional)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder={hasSavedCartPotency ? `Using saved: ${strainPotency.thc}%` : `e.g. ${DEFAULT_THC_PERCENTAGES.vape_oil}`}
                          value={formData.cart_thcPercent}
                          onChange={(e) => handleChange('cart_thcPercent', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {hasSavedCartPotency
                            ? `Saved potency for '${formData.strain}': ${strainPotency.thc}% (override if different batch)`
                            : `Default: ${DEFAULT_THC_PERCENTAGES.vape_oil}% for cart oil`
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-white">Oil Density (g/mL)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.cart_density}
                          onChange={(e) => handleChange('cart_density', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Default: {CONVERSION_FACTORS.cart_density} g/mL
                        </p>
                      </div>
                    </div>
                  );

                case 'oil_sublingual':
                case 'oil_ingested':
                  return (
                    <div className="mt-4 p-4 bg-[#141416] rounded-lg border border-gray-800">
                      <h3 className="text-white font-semibold mb-3">Advanced Settings</h3>
                      <div>
                        <Label className="text-white">THC Strength (mg/mL)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g. 10"
                          value={formData.oil_mgPerMl}
                          onChange={(e) => handleChange('oil_mgPerMl', e.target.value)}
                          className="bg-[#141416] border-gray-800 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Default: {DEFAULT_OIL_STRENGTH} mg/mL
                        </p>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })()
          )}

          {shouldShowDelivered && (
            <div className="p-4 bg-[#141416] rounded-lg border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-white text-sm">Show Delivered Estimate</Label>
                  <button
                    type="button"
                    onClick={() => setShowAbsorptionInfo(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Learn about delivered dosage calculation"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <Switch checked={useDelivered} onCheckedChange={setUseDelivered} />
              </div>
              <p className="text-xs text-gray-400">
                Applies method-specific extraction efficiency to compute delivered mg (accounting for bioavailability and absorption)
              </p>
            </div>
          )}

          {thcEstimate && (
            <div className="p-4 bg-[#25A55F]/10 border border-[#25A55F]/30 rounded-lg">
              <p className="text-sm text-[#25A55F] mb-1">Estimated THC Intake</p>
              <p className="text-2xl font-bold text-[#25A55F]">
                {useDelivered && thcEstimate.deliveredMg
                  ? `${Math.round(thcEstimate.deliveredMg)}mg`
                  : `${Math.round(thcEstimate.totalTHCMg)}mg`}
              </p>
              {useDelivered && thcEstimate.deliveredMg && (
                <p className="text-xs text-[#25A55F] mt-1">
                  (from {Math.round(thcEstimate.totalTHCMg)}mg total)
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="text-white">When did you consume?</Label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                type="button"
                variant={formData.timeOption === 'now' ? 'default' : 'outline'}
                onClick={() => handleChange('timeOption', 'now')}
                className={
                  formData.timeOption === 'now'
                    ? 'bg-[#25A55F] hover:bg-[#1e8a4c] text-white border-[#25A55F]'
                    : 'bg-[#141416] hover:bg-gray-800 text-white border-gray-800'
                }
              >
                Just Now
              </Button>
              <Button
                type="button"
                variant={formData.timeOption === 'earlier' ? 'default' : 'outline'}
                onClick={() => handleChange('timeOption', 'earlier')}
                className={
                  formData.timeOption === 'earlier'
                    ? 'bg-[#25A55F] hover:bg-[#1e8a4c] text-white border-[#25A55F]'
                    : 'bg-[#141416] hover:bg-gray-800 text-white border-gray-800'
                }
              >
                Earlier
              </Button>
            </div>
            {formData.timeOption === 'earlier' && (
              <Input
                type="datetime-local"
                value={formData.customTime}
                onChange={(e) => handleChange('customTime', e.target.value)}
                className="bg-[#141416] border-gray-800 text-white"
                required
              />
            )}
          </div>

          {/* Harm Reduction Notice */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-200 space-y-2">
                <p><strong>Start low, go slow:</strong> Begin with a small dose and wait at least 30-60 minutes before re-dosing. Effects can take time to peak, especially with edibles and oils.</p>
                <Link 
                  to={createPageUrl('SafetyInfo')}
                  className="inline-block text-yellow-400 hover:text-yellow-300 underline text-xs mt-2"
                >
                  Learn more about safe consumption →
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !thcEstimate}
            className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white py-6 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Logging Dose...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Log Dose
              </>
            )}
          </Button>
        </form>
      </div>

      <AlertDialog open={showStackDialog} onOpenChange={setShowStackDialog}>
        <AlertDialogContent className="bg-[#141416] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Add to Nearby Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              You logged a dose close to another session (within 3 hours). Would you like to add this dose to that session for combined tracking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => handleStackSession(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            >
              No, New Session
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStackSession(true)}
              className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
            >
              Yes, Add to Current
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAbsorptionInfo && (
        <AbsorptionInfoModal isOpen={showAbsorptionInfo} onClose={() => setShowAbsorptionInfo(false)} />
      )}

      <BottomNav />
    </div>
  );
}