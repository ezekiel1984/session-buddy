import React, { useState } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  User, 
  Flame, 
  History, 
  MessageCircle, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  Crown,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  Leaf,
  Smile,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Help() {
  const navigate = useNavigate();
  // Initialize expandedSection to 'getting-started', then add other IDs as needed
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-[#25A55F]/10">
              <HelpCircle className="w-8 h-8 text-[#25A55F]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
          <p className="text-gray-400">Learn how to get the most out of Session Buddy</p>
        </div>

        {/* Support Quick Help - prominent email */}
        <div className="bg-[#141416] border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-300">Need help? Email us at</p>
          <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] font-semibold underline break-all">support@verdelabs.com.au</a>
        </div>

        {/* Welcome Section */}
        <Section
          id="getting-started"
          title="Welcome to Session Buddy! 🌿"
          icon={Sparkles}
          expanded={expandedSection === 'getting-started'}
          onToggle={toggleSection}
        >
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Session Buddy</strong> is your personal cannabis companion designed to help you track your consumption, understand its effects, and manage your tolerance mindfully. We promote responsible use through data-driven insights and personalized feedback.
            </p>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#25A55F]" />
                Your First Steps
              </h3>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>Complete your profile in <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Settings'))} className="inline-flex items-center gap-1 h-auto p-0 text-[#25A55F] hover:text-[#1e8a4c] hover:bg-transparent"><Settings className="inline w-4 h-4" /> Settings</Button> (body weight, tolerance, units)</li>
                <li>Navigate to the "Log Dose" tab</li>
                <li>Select your consumption method (Vape, Smoke, Dab, etc.)</li>
                <li>Choose a Quick Select option or enter custom details</li>
                <li>Enter your strain/product name</li>
                <li>Tap "Log Dose" to see your instant buzz calculation!</li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-[#25A55F]/10 to-[#25A55F]/5 rounded-xl p-4 border border-[#25A55F]/30">
              <h3 className="text-[#25A55F] font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Complete Your Profile for Best Results!
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                For the most accurate buzz calculations, sober time estimates, and personalized insights, head to <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Settings'))} className="inline-flex items-center gap-1 h-auto p-0 text-[#25A55F] hover:text-[#1e8a4c] hover:bg-transparent"><Settings className="inline w-4 h-4" /> Settings</Button> and fill out:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Body Weight:</strong> Helps calculate THC distribution in your body</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Default Tolerance:</strong> Low, Medium, or High - significantly impacts your buzz score</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Preferred Units:</strong> Metric (kg) or Imperial (lbs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>AI Tone</strong> (Premium): Choose your AI companion's personality</span>
                </li>
              </ul>
              <p className="text-xs text-[#25A55F] mt-3 italic">
                💡 The more complete your profile, the better Session Buddy adapts to you!
              </p>
            </div>
          </div>
        </Section>

        {/* Log Dose Guide */}
        <Section
          id="log-dose-guide"
          title="Log Dose Guide"
          icon={Flame}
          expanded={expandedSection === 'log-dose-guide'}
          onToggle={toggleSection}
          customIconColor="text-orange-400"
          customBgColor="bg-orange-500/10"
          customBorderColor="border-orange-500/30"
        >
          <div className="space-y-3">
            <HelpItem
              title="Choose Your Method"
              content="Select how you consumed - vape (dry herb or cart), smoke, dab, edible, or oil. Each method affects how THC is absorbed and how long effects last."
            />
            <HelpItem
              title="Quick Select or Custom"
              content="Use Quick Select for common amounts (Light, Moderate, Heavy), or choose Custom to enter exact details like grams, puffs, or mg THC."
            />
            <HelpItem
              title="Strain & Potency"
              content="Enter your strain name. If you've saved this strain before, the THC% will auto-fill. You can update it here for different batches, or manage all your saved strains in Settings → My Strains."
            />
            <HelpItem
              title="Advanced Settings"
              content="Click 'Show Advanced' to customize THC percentages, oil strength (mg/mL), cart density, and other method-specific details. These values are saved for future sessions."
            />
            <HelpItem
              title="When Did You Consume?"
              content="Select 'Just Now' or 'Earlier' to backdate your session (up to 24 hours). This helps track your buzz accurately based on when you actually consumed."
            />
            <HelpItem
              title="Session Stacking"
              content="If you log a dose within 4 hours of your last session, you'll be asked if you want to stack it. Stacking combines doses for accurate cumulative buzz tracking."
            />
          </div>
        </Section>

        {/* Navigation & Core Features */}
        <Section
          id="navigation"
          title="App Navigation & Core Features"
          icon={Target}
          expanded={expandedSection === 'navigation'}
          onToggle={toggleSection}
        >
          <div className="space-y-4 text-gray-300 text-sm">
            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Bottom Navigation Bar</h3>
              <div className="space-y-3">
                <NavItem icon={Sparkles} label="Log Dose" description="Record a new session" />
                <NavItem icon={Flame} label="Buzz" description="View your current buzz status" />
                <NavItem icon={History} label="History" description="See all past sessions" />
                <NavItem icon={MessageCircle} label="AI" description="Chat with your companion (Premium)" />
                <NavItem icon={Target} label="Predictor" description="Plan future sessions (Premium)" />
                <NavItem icon={BarChart3} label="Insights" description="View detailed analytics (Premium)" />
                <NavItem icon={Brain} label="Tolerance" description="Understand tolerance patterns (Premium)" />
              </div>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Logging a Dose</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-white mb-1">Methods & Units</p>
                  <p className="text-xs">Choose from Vape (Dry/Cart), Smoke, Dab, Oil, or Edible. Each method has different units (grams, puffs, mL, mg) depending on how you consume.</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Quick Select vs. Custom</p>
                  <p className="text-xs">Quick Select offers preset dosages (Light, Moderate, Heavy) for convenience. Choose "Custom" for precise control over amounts and percentages.</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-[#25A55F]" />
                    Strain Potency (NEW!)
                  </p>
                  <p className="text-xs">Enter your strain name and save its THC% to automatically use it for future sessions. The saved potency syncs to Advanced Settings but can be overridden for different batches.</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Show Delivered Estimate (Advanced)</p>
                  <p className="text-xs">This option accounts for method-specific absorption efficiency. For example, smoking doesn't deliver 100% of THC to your bloodstream. Enable this for a more realistic intake estimate.</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Dose Stacking</p>
                  <p className="text-xs">If you log another dose within 4 hours of your last one, the app will ask if you want to stack them together. This combines the effects into one session for accurate combined tracking.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Understanding Your Buzz Result</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-white mb-1">Buzz Score (0-10)</p>
                  <p className="text-xs mb-2">Your buzz intensity on a scale of 0 (sober) to 10 (very high). Categories include Light (1-3), Moderate (4-6), Strong (7-8), and Very Strong (9-10).</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Peak & Sober Time</p>
                  <p className="text-xs">We estimate when your buzz will peak and when you'll return to baseline. Use these for planning and responsible decision-making (e.g., driving, work).</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1 flex items-center gap-2">
                    <Smile className="w-4 h-4 text-[#25A55F]" />
                    Mood Tagging (NEW!)
                  </p>
                  <p className="text-xs">Tag how you're feeling during or after your session (Relaxed, Creative, Focused, etc.). This helps you identify which strains/methods work best for different situations.</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Strain Effect Rating (NEW!)
                  </p>
                  <p className="text-xs">After viewing your buzz result, you'll be prompted to rate how the strain made you feel across 8 dimensions (Energy, Focus, Relaxation, etc.). These ratings build your personal strain profile over time.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Session History</h3>
              <p className="text-xs mb-2">View all your logged sessions in chronological order. Tap any session to:</p>
              <ul className="space-y-1 ml-4">
                <li className="text-xs">• View detailed information</li>
                <li className="text-xs">• Use "Prefill" to quickly log the same dose again</li>
                <li className="text-xs">• Delete the session if needed</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* My Strains */}
        <Section
          id="my-strains"
          title="My Strains"
          icon={Sparkles}
          expanded={expandedSection === 'my-strains'}
          onToggle={toggleSection}
          customIconColor="text-purple-400"
          customBgColor="bg-purple-500/10"
          customBorderColor="border-purple-500/30"
        >
          <div className="space-y-3">
            <HelpItem
              title="What is My Strains?"
              content="My Strains is your personal strain library where you can save and manage THC%, CBD%, and effect ratings for all your cannabis products. This helps improve calculation accuracy and lets you remember which strains work best for you."
            />
            <HelpItem
              title="Where to Find It"
              content="Access My Strains from Settings → My Strains. It's available to all users (free and premium)."
            />
            <HelpItem
              title="Saving Strain Potency"
              content="When logging a dose, enter the strain name and THC%. If it's a new strain, you can save it for future sessions. If you've already saved this strain, the THC% will auto-fill."
            />
            <HelpItem
              title="Updating Strain Info"
              content="To update a saved strain's THC%, CBD%, or notes, go to Settings → My Strains. This is useful when you get a different batch of the same strain with different potency."
            />
            <HelpItem
              title="Effect Ratings (Premium)"
              content="Premium users can rate how each strain affects them (Energy, Focus, Relaxation, etc.). These ratings are averaged over time to build your personal strain profile."
            />
          </div>
        </Section>

        {/* Premium Features */}
        <Section
          id="premium"
          title="Premium Features"
          icon={Crown}
          expanded={expandedSection === 'premium'}
          onToggle={toggleSection}
        >
          <div className="space-y-4 text-gray-300 text-sm">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
              <p className="text-purple-300 text-xs mb-2 flex items-center gap-2">
                <Crown className="inline w-4 h-4" />
                Unlock advanced features with Premium subscription
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Premium'))}
                className="w-full bg-gradient-to-r from-[#25A55F] to-yellow-500 hover:from-[#1e8a4c] hover:to-yellow-600 text-white mt-2"
              >
                Upgrade to Premium
              </Button>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25A55F]" />
                AI Companion
              </h3>
              <p className="text-xs mb-3">Chat with an AI assistant that understands your consumption patterns and provides personalized guidance.</p>
              <ul className="space-y-2">
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Customizable Tones:</strong> Choose from Zen, Rick, Lo-fi, Clinical, or Dude</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Context-Aware:</strong> Knows your recent sessions and profile</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Multiple Chats:</strong> Create separate conversations for different topics</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Enhanced Buzz Insights:</strong> Get personalized AI insights on your Buzz Result page analyzing your current state and patterns</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#25A55F]" />
                Insights & Analytics
              </h3>
              <p className="text-xs mb-3">Deep dive into your consumption patterns with visual analytics:</p>
              <ul className="space-y-2">
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Blood THC Graph:</strong> Visualize estimated THC concentration in your bloodstream over time (up to 24 hours)</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Daily Buzz Trends:</strong> See your average buzz scores over the past 7 days</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Method Breakdown:</strong> Understand which consumption methods you use most</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Shareable Stats:</strong> Create beautiful image cards of your stats to share</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>My Strains:</strong> View all your saved strain profiles with potency, effects, and personal notes</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#25A55F]" />
                Session Predictor
              </h3>
              <p className="text-xs mb-2">Plan future sessions by simulating different scenarios:</p>
              <ul className="space-y-1 ml-4">
                <li className="text-xs">• Preview predicted buzz levels before consuming</li>
                <li className="text-xs">• Adjust dosage and timing to achieve desired effects</li>
                <li className="text-xs">• See estimated blood THC curves for planned sessions</li>
                <li className="text-xs">• Calculate detection windows for drug testing</li>
              </ul>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#25A55F]" />
                Tolerance Coach
              </h3>
              <p className="text-xs mb-2">Understand and manage your tolerance over time:</p>
              <ul className="space-y-1 ml-4">
                <li className="text-xs">• View your current tolerance index (based on actual logged sessions from past ~14-21 days)</li>
                <li className="text-xs">• See recovery timelines and predictions</li>
                <li className="text-xs">• Get smart dose adjustment recommendations</li>
                <li className="text-xs">• Understand how your tolerance naturally decays over time without use</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Advanced Settings */}
        <Section
          id="advanced"
          title="Advanced Tolerance Settings (NEW!)"
          icon={Sliders}
          expanded={expandedSection === 'advanced'}
          onToggle={toggleSection}
        >
          <div className="space-y-4 text-gray-300 text-sm">
            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Usage Profile</h3>
              <p className="text-xs mb-2">Found in Settings → Advanced Tolerance Settings. Choose from:</p>
              <ul className="space-y-2">
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>First Timer:</strong> Never or rarely used cannabis</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Occasional:</strong> 1-2 times per week</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F] mt-1.5 flex-shrink-0" />
                  <span><strong>Frequent:</strong> 3+ times per week</span>
                </li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">This affects THC clearance rate and tolerance buildup calculations.</p>
            </div>

            <div className="bg-[#0A0A0B] rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Metabolism Adjust</h3>
              <p className="text-xs mb-2">Fine-tune metabolism speed from -20% (Slow) to +20% (Fast).</p>
              <p className="text-xs text-gray-400">Use this if you notice your effects lasting longer (-) or shorter (+) than predicted. Affects how quickly THC clears from your system.</p>
            </div>
          </div>
        </Section>

        {/* Tips & Best Practices */}
        <Section
          id="tips"
          title="Tips & Best Practices"
          icon={Info}
          expanded={expandedSection === 'tips'}
          onToggle={toggleSection}
        >
          <div className="space-y-3 text-sm text-gray-300">
            <TipCard
              icon={CheckCircle}
              title="Keep Your Profile Updated"
              description="As your tolerance changes or your weight fluctuates, update your profile for continued accuracy."
            />
            <TipCard
              icon={CheckCircle}
              title="Be Honest with Your Tracking"
              description="Accurate data leads to accurate insights. Don't skip sessions or underestimate amounts."
            />
            <TipCard
              icon={CheckCircle}
              title="Use Mood Tags & Strain Effect Ratings"
              description="Tagging your mood and rating strain effects helps you identify which strains and methods work best for different situations."
            />
            <TipCard
              icon={CheckCircle}
              title="Save Your Strain Potencies"
              description="Enter THC% for your strains to get more accurate calculations without re-entering it every time."
            />
            <TipCard
              icon={CheckCircle}
              title="Review Your Insights Regularly"
              description="Premium users: Check your Insights page weekly to identify consumption patterns and adjust accordingly."
            />
            <TipCard
              icon={CheckCircle}
              title="Understand Your Tolerance Index"
              description="Your Tolerance Index is based on actual logged sessions, not just your profile setting. It reflects real consumption patterns and decays naturally over time without use."
            />
          </div>
        </Section>

        {/* Important Reminders */}
        <Section
          id="safety"
          title="Important Reminders"
          icon={AlertTriangle}
          expanded={expandedSection === 'safety'}
          onToggle={toggleSection}
          variant="warning"
        >
          <div className="space-y-4 text-sm">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Medical Disclaimer
              </h3>
              <p className="text-red-200 text-xs">
                Session Buddy is for tracking and educational purposes only. It is <strong>not medical advice</strong> and should not be used to diagnose, treat, or prevent any medical condition. All calculations are estimates based on general models and may not reflect your individual physiology. Consult a healthcare professional for medical guidance.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Legal Compliance
              </h3>
              <p className="text-yellow-200 text-xs">
                You are responsible for ensuring your cannabis use complies with local, state, and federal laws. Session Buddy does not encourage or condone illegal activity. By using this app, you confirm you meet the legal age requirements in your jurisdiction.
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Responsible Use
              </h3>
              <p className="text-blue-200 text-xs">
                Never drive, operate machinery, or make important decisions while under the influence. Use the "Sober At" estimate as a general guideline, but always err on the side of caution. Individual responses vary.
              </p>
            </div>

            <div className="bg-[#0A0A0B] border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Your Privacy Matters</h3>
              <p className="text-gray-300 text-xs">
                Your data is private and secure. We never sell or share your consumption data. You can export or delete your data at any time from Settings. Read our full <Button variant="link" onClick={() => navigate(createPageUrl('PrivacyPolicy'))} className="inline h-auto p-0 text-[#25A55F] hover:text-[#1e8a4c]">Privacy Policy</Button> for details.
              </p>
            </div>
          </div>
        </Section>

        {/* Subscriptions & Support (Apple IAP, Restore, Deletion) */}
        <Section
          id="subscriptions"
          title="Subscriptions & Support"
          icon={Crown}
          expanded={expandedSection === 'subscriptions'}
          onToggle={toggleSection}
        >
          <div className="space-y-3 text-sm text-gray-300">
            <HelpItem
              title="How subscriptions work (iOS via Apple In‑App Purchase)"
              content="On iOS, purchases are processed securely through Apple In‑App Purchase (RevenueCat). On the Premium screen, tap Continue to buy through the App Store. No web checkout is used on iOS."
            />
            <HelpItem
              title="Restore Purchases"
              content="If you reinstalled the app or switched devices, open Premium and tap Restore Purchases. Make sure you're signed into the same Apple ID you originally used."
            />
            <HelpItem
              title="Manage Subscription (iOS)"
              content="Apple manages your subscription and billing. To update or cancel, go to your device Settings → Apple ID → Subscriptions, or visit https://apps.apple.com/account/subscriptions."
            />
            <HelpItem
              title="Delete your account"
              content="Go to Settings → Delete Account, type DELETE, then confirm. This permanently removes your account and all associated data."
            />
            <HelpItem
              title="Contact support"
              content={<span>Email <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] underline">support@verdelabs.com.au</a> and we'll get back to you promptly.</span>}
            />
          </div>
        </Section>

        {/* Support */}
        <div className="mt-8 text-center">
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-2">Need More Help?</h3>
            <p className="text-gray-400 text-sm mb-4">
              We're here to support you on your journey to mindful consumption.
            </p>
            <Button
              onClick={() => window.location.href = 'mailto:support@verdelabs.com.au'}
              className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
            >
              Contact Support
            </Button>
            <p className="text-xs text-gray-400 mt-3">
              Or email us at <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] underline">support@verdelabs.com.au</a>
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Section({ id, title, icon: Icon, children, expanded, onToggle, variant = 'default', customBgColor, customBorderColor, customIconColor }) {
  // Determine default colors based on variant
  const defaultBgColor = variant === 'warning' ? 'bg-yellow-500/10' : 'bg-[#141416]';
  const defaultBorderColor = variant === 'warning' ? 'border-yellow-500/30' : 'border-gray-800';
  const defaultIconColor = variant === 'warning' ? 'text-yellow-400' : 'text-[#25A55F]';

  // Use custom colors if provided, otherwise fallback to defaults
  const finalBgColor = customBgColor || defaultBgColor;
  const finalBorderColor = customBorderColor || defaultBorderColor;
  const finalIconColor = customIconColor || defaultIconColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${finalBgColor} border ${finalBorderColor} rounded-2xl overflow-hidden mb-4`}
    >
      <button
        onClick={() => onToggle(id)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${finalIconColor}`} />
          <h2 className="text-white font-semibold text-lg">{title}</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-6 pb-6"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

function NavItem({ icon: Icon, label, description }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[#25A55F] mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-white text-xs">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function TipCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-[#0A0A0B] border border-gray-800 rounded-xl p-4 flex items-start gap-3">
      <Icon className="w-5 h-5 text-[#25A55F] flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
    </div>
  );
}

function HelpItem({ title, content }) {
  return (
    <div className="bg-[#0A0A0B] border border-gray-800 rounded-xl p-4">
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <p className="text-gray-300 text-xs">{content}</p>
    </div>
  );
}