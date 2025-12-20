import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, Check } from 'lucide-react';

export default function AgeGate({ user, onConfirm }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!agreed) return;
    
    setLoading(true);
    try {
      await base44.auth.updateMe({ ageConfirmed: true });
      onConfirm();
    } catch (error) {
      console.error('Error confirming age:', error);
      alert('Failed to confirm age. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-6">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
            alt="Session Buddy"
            className="w-24 h-24 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Session Buddy</h1>
        </div>

        {/* Age Gate Card */}
        <div className="bg-[#141416] border border-gray-800 rounded-3xl p-8 soft-shadow-lg">
          <div className="w-16 h-16 bg-[#25A55F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#25A55F]" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Age Verification Required
          </h2>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-yellow-500 mb-2">Important Notice</p>
                <p>
                  Session Buddy is a cannabis tracking tool. You must be of legal age in your jurisdiction to use this app. Cannabis laws vary by location.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => setAgreed(!agreed)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                agreed 
                  ? 'bg-[#25A55F]/10 border-[#25A55F] shadow-lg shadow-[#25A55F]/20' 
                  : 'bg-[#0A0A0B] border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                agreed 
                  ? 'bg-[#25A55F] border-[#25A55F]' 
                  : 'border-gray-600'
              }`}>
                {agreed && <Check className="w-4 h-4 text-white" />}
              </div>
              <label className="text-sm text-gray-300 leading-relaxed cursor-pointer text-left">
                I confirm that I am <strong className="text-white">18 years of age or older</strong> (or meet the legal age requirement in my jurisdiction) and that cannabis consumption is legal in my location. I understand this app is for educational and tracking purposes only.
              </label>
            </button>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className={`w-full h-12 rounded-xl font-semibold mb-3 transition-all duration-300 ${
              agreed && !loading
                ? 'bg-[#25A55F] hover:bg-[#1e8a4c] text-white shadow-lg shadow-[#25A55F]/20 hover:shadow-[#25A55F]/40 hover:scale-[1.02]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming...
              </div>
            ) : agreed ? (
              'I Agree - Enter App'
            ) : (
              'Please check the box above to continue'
            )}
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
          >
            I Do Not Meet Requirements
          </Button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          By continuing, you agree to use Session Buddy responsibly and in compliance with local laws.
        </p>
      </div>
    </div>
  );
}