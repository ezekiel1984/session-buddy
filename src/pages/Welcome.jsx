import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Brain, Shield, TrendingUp, ArrowRight, Crown } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(createPageUrl('Landing'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] via-[#0D1410] to-[#0A0A0B] text-white overflow-hidden">
      {/* Animated background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Logo and Hero */}
        <div className="text-center mb-16 mt-8">
          <div className="mb-8 flex justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
              alt="Session Buddy Logo"
              className="w-32 h-32 object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25A55F]/10 border border-[#25A55F]/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#25A55F]" />
            <span className="text-sm font-medium text-[#25A55F]">Track Smart. Stay Safe.</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
            Welcome to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25A55F] to-[#1e8a4c]">
              Session Buddy
            </span>
          </h1>
          
          <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
            Your AI-powered cannabis companion. Track sessions, predict your buzz, understand your tolerance, and stay in control.
          </p>

          <Button
            onClick={handleGetStarted}
            className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-[#25A55F]/20 transition-all duration-300 hover:shadow-[#25A55F]/40 hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-[#141416]/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-[#25A55F]/30 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#25A55F]/10">
                <Zap className="w-6 h-6 text-[#25A55F]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-2">Real-Time Buzz Tracking</h3>
                <p className="text-gray-400 text-sm">Know exactly how high you are, when you'll peak, and when you'll be sober with science-backed calculations.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#141416]/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-[#25A55F]/30 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-white">AI Companion</h3>
                  <Crown className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm">Chat with your personal AI buddy that understands your vibe and provides mindful guidance tailored to you.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#141416]/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-[#25A55F]/30 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-white">Tolerance Insights</h3>
                  <Crown className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm">Understand your tolerance patterns, see recovery timelines, and optimize your dosing for the perfect experience.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#141416]/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-[#25A55F]/30 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#25A55F]/10">
                <Shield className="w-6 h-6 text-[#25A55F]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-2">Privacy First</h3>
                <p className="text-gray-400 text-sm">Your data stays yours. No selling, no sharing. Built with your privacy and safety in mind.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-8 text-center mb-12">
          <h3 className="text-2xl font-bold text-white mb-4">Join Thousands of Mindful Users</h3>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <div>
              <p className="text-3xl font-bold text-[#25A55F]">10,000+</p>
              <p className="text-sm">Sessions Tracked</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#25A55F]">95%</p>
              <p className="text-sm">User Satisfaction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#25A55F]">24/7</p>
              <p className="text-sm">AI Support</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-[#25A55F] to-yellow-500 hover:from-[#1e8a4c] hover:to-yellow-600 text-white px-10 py-6 text-xl rounded-2xl shadow-lg shadow-[#25A55F]/20 transition-all duration-300 hover:shadow-[#25A55F]/40 hover:scale-105"
          >
            Start Tracking Your Vibe
            <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            Free forever. No credit card required.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p className="mb-2">Built for responsible consumption</p>
          <p>Session Buddy © 2025 Verde Labs</p>
        </div>
      </div>
    </div>
  );
}