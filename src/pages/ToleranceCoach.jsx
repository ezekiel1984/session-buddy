
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, Crown, Sparkles, Info } from 'lucide-react';
import { toleranceToday, forecastTI, calculateMilestones } from '@/components/utils/toleranceMath';
import { trackEvent } from '@/components/utils/analytics';
import ToleranceGauge from '@/components/tolerance/ToleranceGauge';
import RecoveryChart from '@/components/tolerance/RecoveryChart';
import DoseAdjuster from '@/components/tolerance/DoseAdjuster';
import BottomNav from '@/components/BottomNav';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';
import OnboardingTooltip from '@/components/OnboardingTooltip';

export default function ToleranceCoach() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [aucDays, setAucDays] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [milestones, setMilestones] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check premium status
        if (!currentUser?.isPremium) {
          setLoading(false);
          return;
        }
        
        trackEvent('tolerance_view');
        
        // Fetch AUC data
        const { data: aucData } = await base44.functions.invoke('calculateUserAUC');
        setAucDays(aucData?.aucDays || []);
        
        // Calculate metrics
        const usageProfile = currentUser.usageProfile || 'frequent';
        const metabolismAdj = currentUser.metabolismAdj || 0;
        
        const currentMetrics = toleranceToday({
          aucDays: aucData?.aucDays || [],
          usageProfile,
          metabolismAdj
        });
        
        setMetrics(currentMetrics);
        
        // Generate forecast
        const forecastData = forecastTI(currentMetrics.TI, currentMetrics.tau, 14);
        setForecast(forecastData);
        
        // Calculate milestones
        const milestonesData = calculateMilestones(currentMetrics.TI, currentMetrics.tau);
        setMilestones(milestonesData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading tolerance data:', error);
        toast.error('Failed to load tolerance data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Show preview/info page for non-premium users
  if (!user?.isPremium) {
    return (
      <>
        <OnboardingTooltip
          pageName="ToleranceCoach"
          title="✨ Tolerance Coach"
          description="Understand your tolerance level and get personalized recommendations for optimal consumption. See the demo below for an example of the insights you'll receive!"
        />
        <div className="min-h-screen bg-[#0A0A0B] pb-24">
          <div className="max-w-lg mx-auto px-6 py-8">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Premium Feature</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Tolerance Coach</h1>
            <p className="text-gray-400 mb-8">Optimize your tolerance and consumption patterns</p>

            {/* Demo Guidance */}
            <div className="bg-[#141416] border border-[#25A55F]/20 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#25A55F]" />
                <h3 className="text-white font-semibold">Sample Tolerance Guidance</h3>
              </div>
              <Button
                onClick={() => setShowDemo(!showDemo)}
                variant="outline"
                className="w-full border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800 mb-4"
              >
                {showDemo ? 'Hide Sample' : 'Show Sample'}
              </Button>
              
              {showDemo && (
                <div className="space-y-4">
                  <div className="bg-[#0A0A0B] border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Your Tolerance Status</p>
                        <p className="text-gray-400 text-xs">Based on recent usage patterns</p>
                      </div>
                    </div>
                    <div className="bg-[#141416] rounded-lg p-3 mb-3">
                      <p className="text-2xl font-bold text-yellow-400 text-center mb-1">Moderate-High</p>
                      <p className="text-xs text-gray-400 text-center">Tolerance Index: 0.65</p>
                    </div>
                    <p className="text-sm text-gray-300">
                      You've been consuming regularly over the past 2 weeks. Your system has adapted, so you may need slightly higher doses for the same effect.
                    </p>
                  </div>

                  <div className="bg-[#0A0A0B] border border-gray-800 rounded-xl p-4">
                    <p className="text-white font-semibold text-sm mb-2">💡 Recommendation</p>
                    <p className="text-sm text-gray-300 mb-2">
                      Consider a <strong className="text-[#25A55F]">2-3 day tolerance break</strong> to reset your CB1 receptors. After the break:
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                      <li>Your tolerance would drop by ~40%</li>
                      <li>You'd need 25-30% less THC for the same effect</li>
                      <li>Effects would feel more pronounced and last longer</li>
                      <li>You'd save money on product</li>
                    </ul>
                  </div>

                  <div className="bg-[#0A0A0B] border border-gray-800 rounded-xl p-4">
                    <p className="text-white font-semibold text-sm mb-2">📊 Recovery Timeline</p>
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>After 1 day:</span>
                        <span className="text-[#25A55F]">15% decrease</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After 3 days:</span>
                        <span className="text-[#25A55F]">40% decrease</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After 7 days:</span>
                        <span className="text-[#25A55F]">70% decrease</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After 14 days:</span>
                        <span className="text-[#25A55F]">Near baseline</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <p className="text-xs text-blue-200 text-center">
                      <strong>This is demo data.</strong> Upgrade to Premium for real tolerance tracking based on your actual logged sessions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Feature Preview */}
            <div className="space-y-6">
              <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">What is Tolerance Coach?</h3>
                    <p className="text-gray-400 text-sm">Science-backed tolerance management</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  The Tolerance Coach helps you understand your current tolerance level and provides 
                  personalized recommendations to optimize your consumption for maximum effect and minimum waste.
                </p>
              </div>

              <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
                <h3 className="text-white font-semibold mb-4">Key Features:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#25A55F]">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Tolerance Level Tracking</p>
                      <p className="text-gray-400 text-sm">See your current tolerance based on usage patterns</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#25A55F]">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Recovery Timeline</p>
                      <p className="text-gray-400 text-sm">Understand how long breaks affect your tolerance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#25A55F]">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Dose Recommendations</p>
                      <p className="text-gray-400 text-sm">Get personalized dosing suggestions based on your goals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#25A55F]">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">T-Break Planning</p>
                      <p className="text-gray-400 text-sm">Plan effective tolerance breaks with daily insights</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Preview Image/Illustration */}
              <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-8 text-center soft-shadow">
                <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 mb-6">
                  Take control of your tolerance and get the most out of every session
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
          <BottomNav />
        </div>
      </>
    );
  }
  
  // No data state
  if (!metrics || aucDays.length === 0) {
    return (
      <>
        <OnboardingTooltip
          pageName="ToleranceCoach_Premium"
          title="✨ Tolerance Coach"
          description="Track your tolerance level based on your consumption patterns. Get personalized break recommendations and dose adjustments. Start low, go slow, and take breaks when needed."
        />
        <div className="min-h-screen bg-[#0A0A0B] pb-24">
          <div className="max-w-lg mx-auto px-6 py-12">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-[#25A55F]" />
                Tolerance Coach
              </h1>
              <p className="text-gray-400">
                See where your tolerance's at, how fast it resets, and tune your dose to your vibe.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mt-3">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-yellow-500 font-medium">Educational Only</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="text-gray-500 mb-4">Not enough data yet</div>
                <p className="text-gray-400 mb-6 max-w-sm">
                  Log a few sessions to start tracking your tolerance patterns. We need at least a few days of data to generate insights.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('LogDose'))}
                  className="bg-[#25A55F] hover:bg-[#1e8a4c]"
                >
                  Log Your First Dose
                </Button>
              </div>
            </div>
          </div>
          <BottomNav />
        </div>
      </>
    );
  }
  
  return (
    <>
      <OnboardingTooltip
        pageName="ToleranceCoach_Premium"
        title="✨ Tolerance Coach"
        description="Your tolerance score is calculated from your recent logged sessions. Take tolerance breaks when scores are high, and always consume mindfully to maintain effectiveness."
      />
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <div className="max-w-lg mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-8 h-8 text-[#25A55F]" />
              Tolerance Coach
            </h1>
            <p className="text-gray-400">
              See where your tolerance's at, how fast it resets, and tune your dose to your vibe.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mt-3">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-500 font-medium">Educational Only</span>
            </div>
          </div>

          {/* NEW: Calculation Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 soft-shadow">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">How Your Tolerance is Calculated</p>
                <p className="text-blue-300/80">
                  Your Tolerance Index (TI) is based on your <strong>actual logged sessions</strong> from the past ~14-21 days, not just your usage profile setting. 
                  If you haven't logged sessions recently, your TI will be low regardless of your profile. 
                  The "Frequent user" setting affects how quickly your tolerance <em>decays</em> during breaks, not its current level.
                </p>
              </div>
            </div>
          </div>
          
          {/* Section A: Your Tolerance Today */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-6 soft-shadow">
            <h2 className="text-xl font-semibold text-white mb-4">Your Tolerance Today</h2>
            <ToleranceGauge TI={metrics.TI} S={metrics.S} />
            
            {/* Profile badges */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <div className="px-3 py-1 bg-[#0A0A0B] border border-gray-800 rounded-full text-xs text-gray-300">
                {user.usageProfile === 'first' ? 'First-time' : user.usageProfile === 'occasional' ? 'Occasional' : 'Frequent'} user
              </div>
              {user.metabolismAdj !== 0 && (
                <div className="px-3 py-1 bg-[#0A0A0B] border border-gray-800 rounded-full text-xs text-gray-300">
                  Metabolism {user.metabolismAdj > 0 ? '+' : ''}{user.metabolismAdj}%
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 text-center mt-4">
              Based on your recent use pattern
            </p>
          </div>
          
          {/* Section B: Recovery Forecast */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-6 soft-shadow">
            <h2 className="text-xl font-semibold text-white mb-4">Recovery Forecast</h2>
            <RecoveryChart forecast={forecast} milestones={milestones} />
          </div>
          
          {/* Section C: Dose Adjuster */}
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-6 soft-shadow">
            <h2 className="text-xl font-semibold text-white mb-4">Dose Adjuster</h2>
            <p className="text-sm text-gray-400 mb-6">
              See how much you'd need to hit your target buzz based on your current or future tolerance.
            </p>
            <DoseAdjuster
              currentMetrics={metrics}
              aucDays={aucDays}
              usageProfile={user.usageProfile}
              metabolismAdj={user.metabolismAdj}
            />
          </div>
          
          {/* Footer disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 soft-shadow">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              <strong className="text-yellow-500">Educational tool only.</strong> This is not medical advice. 
              Tolerance varies by individual. Start low, go slow, and always consume responsibly.
            </p>
          </div>
        </div>
        
        <BottomNav />
      </div>
    </>
  );
}
