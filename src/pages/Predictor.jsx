import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Crown,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Droplet,
  TestTube2,
  Loader2,
  Sparkles,
  User, // Added User icon
  Zap, // Added Zap icon
  FlaskConical // Added FlaskConical for the new premium page
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';
import THCTimelineChart from '@/components/predictor/THCTimelineChart';
import OnboardingTooltip from '@/components/OnboardingTooltip';
import { runSimulation as simulateDoses } from '@/components/predictor/lib/simulate';

export default function Predictor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Dose planning state
  const [doses, setDoses] = useState([
    {
      id: Date.now(),
      method: 'vape_dry',
      doseMg: 20,
      timeISO: new Date().toISOString().slice(0, 16),
      repeat: { enabled: false, count: 1, everyMinutes: 0 } // Updated repeat structure
    }
  ]);

  // User factors combined into a single state object
  const [userFactors, setUserFactors] = useState({
    tolerance: 'occasional',
    weightKg: '',
    metabolismAdjust: 0,
  });

  // Detection settings
  const [showBlood, setShowBlood] = useState(true);
  const [showSaliva, setShowSaliva] = useState(true);
  const [showUrine, setShowUrine] = useState(true);
  const [bloodThreshold, setBloodThreshold] = useState(1);
  const [salivaThreshold, setSalivaThreshold] = useState(5);
  const [uncertaintyPct, setUncertaintyPct] = useState(15);

  // Results
  const [simulationResult, setSimulationResult] = useState(null);

  // Demo simulation result for free users
  const demoResult = {
    keyMetrics: {
      peakTHC: 12.5,
      estimatedBuzz: 4.2,
      peakTime: new Date(Date.now() + 20 * 60000).toISOString(),
      timeTo1ngMl: new Date(Date.now() + 180 * 60000).toISOString(),
      soberTime: new Date(Date.now() + 300 * 60000).toISOString()
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();

        if (!currentUser) {
          await base44.auth.redirectToLogin(window.location.href);
          return;
        }

        setUser(currentUser);

        // Set defaults from user profile
        setUserFactors(prev => ({
          ...prev,
          tolerance: currentUser.tolerance || prev.tolerance,
          weightKg: currentUser.weightKg ? currentUser.weightKg.toString() : prev.weightKg,
        }));

        setLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        toast.error('Failed to load user data');
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const addDose = () => {
    setDoses([...doses, {
      id: Date.now(),
      method: 'vape_dry',
      doseMg: 20,
      timeISO: new Date().toISOString().slice(0, 16),
      repeat: { enabled: false, count: 1, everyMinutes: 60 }
    }]);
  };

  const removeDose = (id) => {
    setDoses(doses.filter(d => d.id !== id));
  };

  const updateDose = (id, field, value) => {
    setDoses(doses.map(d => {
      if (d.id === id) {
        if (field === 'repeat') {
          return { ...d, repeat: { ...d.repeat, ...value } };
        }
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const runSimulation = async () => {
    if (doses.length === 0) {
      toast.error('Add at least one dose to simulate');
      return;
    }

    setSimulating(true);

    try {
      const payload = {
        doses: doses.map(d => ({
          method: d.method,
          doseMg: parseFloat(d.doseMg) || 0,
          timeISO: new Date(d.timeISO).toISOString(),
          // FIXED: Changed count > 1 to count >= 1 to allow single repeats
          repeat: d.repeat.enabled && d.repeat.count >= 1 && d.repeat.everyMinutes > 0
            ? { count: d.repeat.count, everyMinutes: d.repeat.everyMinutes }
            : undefined
        })),
        userFactors: {
          tolerance: userFactors.tolerance,
          weightKg: userFactors.weightKg ? parseFloat(userFactors.weightKg) : undefined,
          metabolismAdjust: userFactors.metabolismAdjust
        },
        stepMinutes: 2,
        horizonHours: 48,
        uncertaintyPct,
        thresholds: {
          blood: bloodThreshold,
          saliva: salivaThreshold
        }
      };

      const result = simulateDoses(payload);

      setSimulationResult(result);
      toast.success('Simulation complete!');

    } catch (error) {
      console.error('Simulation error:', error);
      toast.error(error.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Show preview/info page for non-premium users
  if (!user?.isPremium) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <OnboardingTooltip
          pageName="Predictor"
          title="🔮 THC Predictor"
          description="Plan your sessions ahead of time by simulating how different doses, methods, and timing will affect your buzz and detection windows. Free users get one demo simulation!"
        />

        <div className="relative fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Premium Feature</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">THC Predictor</h1>
          <p className="text-gray-400 mb-8">Simulate and predict your buzz before you dose</p>

          {/* Free Demo Section */}
          <div className="bg-gradient-to-br from-[#25A55F]/10 to-[#25A55F]/5 border border-[#25A55F]/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#25A55F]" />
              <h3 className="text-white font-semibold">Free Demo Available!</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              See how the Predictor works with this example simulation using anonymized data.
            </p>
            <Button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
            >
              {showDemo ? 'Hide Demo' : 'Try Demo Simulation'}
            </Button>
          </div>

          {/* Demo Results */}
          {showDemo && (
            <div className="space-y-4 mb-6">
              <Card className="bg-[#141416] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                    Demo: 15mg Vape Session
                  </CardTitle>
                  <CardDescription className="text-xs">Example simulation for a moderate vape dose</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0A0A0B] rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Peak THC</p>
                      <p className="text-xl font-bold text-purple-400">
                        {demoResult.keyMetrics.peakTHC} <span className="text-xs text-gray-500">ng/mL</span>
                      </p>
                    </div>
                    <div className="p-3 bg-[#0A0A0B] rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Est. Buzz</p>
                      <p className="text-xl font-bold text-[#25A55F]">
                        {demoResult.keyMetrics.estimatedBuzz} <span className="text-xs text-gray-500">/10</span>
                      </p>
                    </div>
                    <div className="p-3 bg-[#0A0A0B] rounded-lg col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Peaks at</p>
                      <p className="text-sm font-medium text-white">
                        {new Date(demoResult.keyMetrics.peakTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (~20 min from now)
                      </p>
                    </div>
                    <div className="p-3 bg-[#0A0A0B] rounded-lg col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Sober at</p>
                      <p className="text-sm font-medium text-white">
                        {new Date(demoResult.keyMetrics.soberTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (~5 hours from now)
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <p className="text-xs text-blue-200">
                      <strong>Demo Results:</strong> This is an example simulation. Upgrade to Premium to run personalized predictions with your own doses and profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Feature Preview */}
          <div className="space-y-6">
            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">What is THC Predictor?</h3>
                  <p className="text-gray-400 text-sm">Plan your perfect session</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The THC Predictor lets you simulate different dosing scenarios before you consume.
                See how different methods, amounts, and timing affect your buzz intensity and duration.
              </p>
            </div>

            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-white font-semibold mb-4">Key Features:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Real-time Blood THC Simulation</p>
                    <p className="text-gray-400 text-sm">Visualize how THC levels change over time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Compare Different Methods</p>
                    <p className="text-gray-400 text-sm">See how vaping vs edibles vs smoking affects you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Stacking Simulations</p>
                    <p className="text-gray-400 text-sm">Plan multiple doses and see cumulative effects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Personalized to Your Tolerance</p>
                    <p className="text-gray-400 text-sm">Calculations based on your body weight and usage history</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Preview Image/Illustration */}
            <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-8 text-center shadow-lg">
              <FlaskConical className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 mb-6">
                Make informed decisions about your consumption with scientific predictions
              </p>
            </div>

            {/* Upgrade CTA */}
            <Button
              onClick={() => navigate(createPageUrl('Premium'))}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-14 text-lg font-semibold rounded-xl"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <OnboardingTooltip
        pageName="Predictor_Premium"
        title="🔮 THC Predictor"
        description="Plan ahead by simulating different dose scenarios. See predicted buzz levels, peak times, and detection windows before you consume. Always start low and go slow."
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Predictor</h1>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-gray-400">Plan doses. Predict your vibe.</p>
          </div>
        </div>

        {/* Disclaimer */}
        <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200 text-sm">
            These are estimates, not guarantees. Biology, test methods, and local laws vary. Not legal or medical advice.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Dose Planner */}
            <Card className="bg-[#141416] border-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#25A55F]" />
                  Dose Planner
                </CardTitle>
                <CardDescription>Add and configure doses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {doses.map((dose) => (
                  <div key={dose.id} className="p-4 bg-[#0A0A0B] rounded-lg border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Dose #{doses.indexOf(dose) + 1}</span>
                      {doses.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDose(dose.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Method</Label>
                        <Select
                          value={dose.method}
                          onValueChange={(v) => updateDose(dose.id, 'method', v)}
                        >
                          <SelectTrigger className="bg-[#141416] border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141416] border-gray-800 z-50" position="popper">
                            <SelectItem value="vape_dry" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                              Vape (Dry)
                            </SelectItem>
                            <SelectItem value="smoke" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                              Smoke
                            </SelectItem>
                            <SelectItem value="dab" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                              Dab
                            </SelectItem>
                            <SelectItem value="edible" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                              Edible
                            </SelectItem>
                            <SelectItem value="oil_sublingual" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                              Oil (Sublingual)
                            </SelectItem>
                            <SelectItem value="unknown" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                              Unknown
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-400 text-xs">THC (mg)</Label>
                        <Input
                          type="number"
                          value={dose.doseMg}
                          onChange={(e) => updateDose(dose.id, 'doseMg', parseFloat(e.target.value))}
                          className="bg-[#141416] border-gray-700 text-white"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs">Time</Label>
                      <Input
                        type="datetime-local"
                        value={dose.timeISO}
                        onChange={(e) => updateDose(dose.id, 'timeISO', e.target.value)}
                        className="bg-[#141416] border-gray-700 text-white"
                      />
                    </div>

                    {/* Repeat Options */}
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-400 text-xs">Repeat this dose?</Label>
                        <Switch
                          checked={dose.repeat?.enabled || false}
                          onCheckedChange={(checked) => {
                            const newRepeat = checked
                              ? { enabled: true, count: 1, everyMinutes: dose.repeat?.everyMinutes || 60 }
                              : { enabled: false, count: 1, everyMinutes: 0 };
                            updateDose(dose.id, 'repeat', newRepeat);
                          }}
                        />
                      </div>

                      {dose.repeat?.enabled && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <Label className="text-gray-400 text-xs">Times (repeats)</Label>
                            <Input
                              type="number"
                              value={dose.repeat.count}
                              onChange={(e) => {
                                const newCount = parseInt(e.target.value);
                                // Allow any positive number while typing
                                if (!isNaN(newCount) && newCount >= 0) {
                                  updateDose(dose.id, 'repeat', { count: newCount });
                                }
                              }}
                              onBlur={(e) => {
                                // On blur, ensure minimum of 1
                                let newCount = parseInt(e.target.value);
                                if (isNaN(newCount) || newCount < 1) {
                                  newCount = 1;
                                  updateDose(dose.id, 'repeat', { count: newCount });
                                }
                              }}
                              className="bg-[#141416] border-gray-700 text-white"
                              min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Total: {(dose.repeat.count || 0) + 1} doses
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Every (minutes)</Label>
                            <Input
                              type="number"
                              value={dose.repeat.everyMinutes}
                              onChange={(e) => {
                                const newMinutes = parseInt(e.target.value);
                                if (!isNaN(newMinutes) && newMinutes >= 0) {
                                  updateDose(dose.id, 'repeat', { everyMinutes: newMinutes });
                                }
                              }}
                              onBlur={(e) => {
                                let newMinutes = parseInt(e.target.value);
                                if (isNaN(newMinutes) || newMinutes < 1) {
                                  newMinutes = 1;
                                  updateDose(dose.id, 'repeat', { everyMinutes: newMinutes });
                                }
                              }}
                              className="bg-[#141416] border-gray-700 text-white"
                              min="1"
                              step="15"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addDose}
                  variant="outline"
                  className="w-full border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800 hover:border-[#25A55F]/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Dose
                </Button>
              </CardContent>
            </Card>

            {/* User Factors */}
            <Card className="bg-[#141416] border-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-[#25A55F]" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-400 text-xs">Tolerance Level</Label>
                  <Select value={userFactors.tolerance} onValueChange={(val) => setUserFactors({ ...userFactors, tolerance: val })}>
                    <SelectTrigger className="bg-[#141416] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141416] border-gray-800 z-50" position="popper">
                      <SelectItem value="first_time" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                        First-time
                      </SelectItem>
                      <SelectItem value="occasional" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                        Occasional
                      </SelectItem>
                      <SelectItem value="frequent" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">
                        Frequent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-400 text-xs">Body Weight (kg)</Label>
                  <Input
                    type="number"
                    value={userFactors.weightKg}
                    onChange={(e) => setUserFactors({ ...userFactors, weightKg: e.target.value })}
                    placeholder="70"
                    className="bg-[#141416] border-gray-700 text-white"
                    min="40"
                    max="150"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 text-xs">
                    Metabolism Adjust ({userFactors.metabolismAdjust > 0 ? '+' : ''}{userFactors.metabolismAdjust}%)
                  </Label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={userFactors.metabolismAdjust}
                    onChange={(e) => setUserFactors({ ...userFactors, metabolismAdjust: parseInt(e.target.value) })}
                    className="w-full accent-[#25A55F]"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slower</span>
                    <span>Normal</span>
                    <span>Faster</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detection Settings */}
            <Card className="bg-[#141416] border-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Detection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Blood Threshold</Label>
                  <Switch checked={showBlood} onCheckedChange={setShowBlood} />
                </div>

                {showBlood && (
                  <div>
                    <Label className="text-gray-400 text-xs">Blood (ng/mL)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={bloodThreshold}
                      onChange={(e) => setBloodThreshold(parseFloat(e.target.value) || 1)}
                      className="bg-[#141416] border-gray-700 text-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Saliva Threshold</Label>
                  <Switch checked={showSaliva} onCheckedChange={setShowSaliva} />
                </div>

                {showSaliva && (
                  <div>
                    <Label className="text-gray-400 text-xs">Saliva (ng/mL)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={salivaThreshold}
                      onChange={(e) => setSalivaThreshold(parseFloat(e.target.value) || 5)}
                      className="bg-[#141416] border-gray-700 text-white"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-gray-400 text-xs">Uncertainty (±%)</Label>
                  <p className="text-xs text-gray-500 mb-2">Affects blood & saliva calculations</p>
                  <Input
                    type="number"
                    step="1"
                    value={uncertaintyPct}
                    onChange={(e) => setUncertaintyPct(parseInt(e.target.value) || 15)}
                    className="bg-[#141416] border-gray-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Urine Windows</Label>
                  <Switch checked={showUrine} onCheckedChange={setShowUrine} />
                </div>
              </CardContent>
            </Card>

            {/* Simulate Button */}
            <Button
              onClick={runSimulation}
              disabled={simulating || doses.some(d => d.doseMg <= 0)}
              className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white h-12 text-lg"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {simulationResult ? (
              <>
                {/* Key Metrics */}
                <Card className="bg-[#141416] border-gray-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0A0A0B] rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Peak THC</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {simulationResult.keyMetrics.peakTHC} <span className="text-sm text-gray-500">ng/mL</span>
                        </p>
                      </div>
                      <div className="p-3 bg-[#0A0A0B] rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Est. Buzz</p>
                        <p className="text-2xl font-bold text-[#25A55F]">
                          {simulationResult.keyMetrics.estimatedBuzz} <span className="text-sm text-gray-500">/10</span>
                        </p>
                      </div>
                      <div className="p-3 bg-[#0A0A0B] rounded-lg col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Time to Peak</p>
                        <p className="text-sm font-medium text-white">
                          {new Date(simulationResult.keyMetrics.peakTime).toLocaleString()}
                        </p>
                      </div>
                      {showBlood && simulationResult.keyMetrics.timeTo1ngMl && (
                        <div className="p-3 bg-[#0A0A0B] rounded-lg col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Time to &lt; {bloodThreshold} ng/mL (Blood)</p>
                          <p className="text-sm font-medium text-white">
                            {new Date(simulationResult.keyMetrics.timeTo1ngMl).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {showSaliva && simulationResult.keyMetrics.timeTo5ngMl && (
                        <div className="p-3 bg-[#0A0A0B] rounded-lg col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Time to &lt; {salivaThreshold} ng/mL (Saliva)</p>
                          <p className="text-sm font-medium text-white">
                            {new Date(simulationResult.keyMetrics.timeTo5ngMl).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {simulationResult.keyMetrics.soberTime && (
                        <div className="p-3 bg-[#0A0A0B] rounded-lg col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Time to Sober (&lt; 0.1 ng/mL)</p>
                          <p className="text-sm font-medium text-white">
                            {new Date(simulationResult.keyMetrics.soberTime).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Chart */}
                <Card className="bg-[#141416] border-gray-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      THC Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {simulationResult.series.length > 0 ? (
                      <THCTimelineChart
                        series={simulationResult.series}
                        doses={doses}
                        showBlood={showBlood}
                        bloodThreshold={bloodThreshold}
                        showSaliva={showSaliva}
                        salivaThreshold={salivaThreshold}
                        keyMetrics={simulationResult.keyMetrics}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-sm">No data to display</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detection Windows */}
                <Card className="bg-[#141416] border-gray-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <TestTube2 className="w-5 h-5 text-purple-400" />
                      Detection Windows
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showBlood && (
                      <div className="p-3 bg-[#0A0A0B] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplet className="w-4 h-4 text-red-400" />
                          <p className="text-sm font-medium text-white">Blood</p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {simulationResult.keyMetrics.timeTo1ngMl
                            ? `Detectable until ${new Date(simulationResult.keyMetrics.timeTo1ngMl).toLocaleString()}`
                            : 'Below detection threshold'}
                        </p>
                      </div>
                    )}

                    {showSaliva && (
                      <div className="p-3 bg-[#0A0A0B] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplet className="w-4 h-4 text-blue-400" />
                          <p className="text-sm font-medium text-white">Saliva</p>
                        </div>
                        <p className="text-sm text-gray-400">{simulationResult.detectionWindows.saliva}</p>
                        {simulationResult.keyMetrics.timeTo5ngMl && (
                          <p className="text-xs text-gray-500 mt-1">
                            Est. below threshold: {new Date(simulationResult.keyMetrics.timeTo5ngMl).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {showUrine && (
                      <div className="p-3 bg-[#0A0A0B] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube2 className="w-4 h-4 text-yellow-400" />
                          <p className="text-sm font-medium text-white">Urine</p>
                        </div>
                        <p className="text-sm text-gray-400">{simulationResult.detectionWindows.urine}</p>
                      </div>
                    )}

                    <Alert className="bg-red-500/10 border-red-500/30">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200 text-xs">
                        Estimates only. Test methods and cutoffs vary by jurisdiction.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-[#141416] border-gray-800 shadow-xl">
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Ready to predict</p>
                  <p className="text-gray-500 text-sm">
                    Configure your doses and click "Run Simulation"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
}