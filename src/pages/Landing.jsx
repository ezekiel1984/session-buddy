import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, TrendingUp, Shield, ArrowRight, BarChart3, Trophy, MessageCircle, FlaskConical, Brain, Zap, Star, Lock, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function Landing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Auth check removed from mount to ensure instant "Light Landing" render
  // Auth is now checked only when user interacts

  const handleCTA = async () => {
    setIsLoading(true);
    try {
      // Create a 2s timeout for the auth check
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 2000)
      );
      
      // Check if user is already authenticated
      // Race against timeout to prevent hanging in embedded browsers
      await Promise.race([
        base44.auth.me(),
        timeoutPromise
      ]);
      
      // If successful (logged in), navigate to app
      navigate(createPageUrl('LogDose'));
    } catch (error) {
      // If not logged in, error, or timeout -> redirect to login
      // This ensures we always move the user forward
      const nextUrl = window.location.origin + createPageUrl('LogDose');
      try {
        await base44.auth.redirectToLogin(nextUrl);
      } catch (loginError) {
        // Fallback if redirectToLogin fails
        window.location.href = nextUrl; 
      }
    }
    // No finally block needed as we redirect/navigate away
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] via-[#0D1410] to-[#0A0A0B] text-white overflow-hidden">
      {/* Animated background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        {/* Hero Section with Logo */}
        <div className="text-center mb-16 mt-8">
          <div className="mb-8 flex justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
              alt="Session Buddy Logo"
              className="w-32 h-32 object-contain"
              fetchPriority="high"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25A55F]/10 border border-[#25A55F]/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#25A55F]" />
            <span className="text-sm font-medium text-[#25A55F]">Track Smart. Stay Safe.</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            Session
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25A55F] to-[#1e8a4c]">
              Buddy
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            Your personal cannabis companion. Track sessions, predict your buzz, understand your tolerance, and get AI-powered insights.
          </p>

          <Button
            onClick={handleCTA}
            disabled={isLoading}
            className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-[#25A55F]/20 transition-all duration-300 hover:shadow-[#25A55F]/40 hover:scale-105"
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>

          {/* Quick Help & Support */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link to={createPageUrl('Help')}>
              <Button variant="outline" className="bg-[#141416] border border-gray-800 text-white hover:bg-gray-800/70 rounded-xl px-4 py-2 transition-all duration-200 shadow-sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </Button>
            </Link>
            <a href="mailto:support@verdelabs.com.au">
              <Button className="bg-[#141416] border border-gray-800 text-white hover:bg-gray-800">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </a>
          </div>

          {/* NEW: Privacy Statement */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong className="text-white">Session Buddy respects your privacy.</strong> Your data is encrypted and never shared without your consent.{' '}
                  <Link 
                    to={createPageUrl('PrivacyPolicy')} 
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    See our Privacy Policy for details.
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Core Features</h2>
          
          <FeatureCard
            icon={TrendingUp}
            title="Smart Session Tracking"
            description="Log sessions with detailed metrics and get instant buzz score calculations based on method, dosage, and your body weight"
          />
          <FeatureCard
            icon={Zap}
            title="Real-Time Buzz Calculator"
            description="Know exactly when you'll peak and when you'll be sober with science-backed pharmacokinetic modeling"
          />
          <FeatureCard
            icon={BarChart3}
            title="Detailed History & Stats"
            description="Visualize your consumption patterns and track progress over time with beautiful charts and insights"
          />
          <FeatureCard
            icon={Trophy}
            title="Achievements & Goals"
            description="Earn badges and celebrate your milestones for responsible and mindful consumption"
          />
        </div>

        {/* Premium Features */}
        <div className="space-y-4 mb-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Premium Features</span>
            </div>
            <h2 className="text-2xl font-bold">Unlock Your Full Potential</h2>
          </div>

          <FeatureCard
            icon={MessageCircle}
            title="AI Companion"
            description="Chat with your personal AI buddy that understands your vibe, provides mindful guidance, and adapts to your preferred tone"
            premium
          />
          <FeatureCard
            icon={FlaskConical}
            title="Session Predictor"
            description="Plan future sessions with customizable doses and timing. See predicted blood THC levels, buzz intensity, and detection windows"
            premium
          />
          <FeatureCard
            icon={Brain}
            title="Tolerance Coach"
            description="Understand your tolerance patterns with personalized forecasts, recovery timelines, and smart dose adjustments"
            premium
          />
          <FeatureCard
            icon={Star} 
            title="Strain Rating & Discovery"
            description="Rate and review strains from our curated database, discover new favorites, and understand how different strains affect your sessions and mood."
            premium
          />
          <FeatureCard
            icon={BarChart3}
            title="Advanced Insights"
            description="Deep analytics with blood THC graphs, weekly vibe reports, method breakdowns, and shareable stats cards"
            premium
          />
        </div>

        {/* Why Session Buddy */}
        <div className="mb-12 bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">Why Session Buddy?</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#25A55F] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Science-Backed</p>
                <p className="text-sm text-gray-400">Built on pharmacokinetic models and real cannabis research</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#25A55F] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Privacy-First</p>
                <p className="text-sm text-gray-400">Your data stays yours. No selling, no sharing, period.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#25A55F] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Mindful Consumption</p>
                <p className="text-sm text-gray-400">Tools designed to help you track, understand, and control your usage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm space-y-2">
          <p>Built by Verde Labs Australia for responsible consumption</p>
          <div className="flex items-center justify-center gap-4">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-[#25A55F] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to={createPageUrl('TermsOfUse')} className="hover:text-[#25A55F] transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, premium }) {
  return (
    <div className={cn(
      "backdrop-blur-sm border rounded-2xl p-6 hover:border-[#25A55F]/30 transition-all duration-300 group",
      premium ? "bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20" : "bg-[#141416]/50 border-gray-800"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          premium ? "bg-purple-500/10 group-hover:bg-purple-500/20" : "bg-[#25A55F]/10 group-hover:bg-[#25A55F]/20"
        )}>
          <Icon className={cn("w-6 h-6", premium ? "text-purple-400" : "text-[#25A55F]")} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            {premium && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Premium
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}