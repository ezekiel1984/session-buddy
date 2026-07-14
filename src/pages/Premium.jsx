import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Crown, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LegalFooter from "@/components/LegalFooter";

export default function Premium() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-[#25A55F] rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.isPremium) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
        <div className="max-w-lg mx-auto px-6 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#25A55F]/15 border border-[#25A55F]/30 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-[#25A55F]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Premium</h1>
          <p className="text-gray-400">Thanks for supporting Session Buddy. Enjoy all premium features.</p>
          <Button className="mt-6 bg-[#25A55F] hover:bg-[#1e8a4c]" onClick={() => navigate(createPageUrl('Insights') || '/')}>Go to Insights</Button>
        </div>
        <LegalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Premium</span>
          </div>
          <h1 className="text-3xl font-bold mt-4">Upgrade to Premium</h1>
          <p className="text-gray-400 mt-2">
            Deeper insights, personalized trends, and powerful tools for mindful consumption. Educational and harm-reduction focused — not medical advice.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#141416] border border-gray-800">
            <p className="text-gray-200 font-medium mb-1">In-App Purchases</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium is available as an in-app purchase via the Apple App Store or Google Play. Subscription bills on a recurring basis; cancel anytime from your device's store settings.
            </p>
          </div>
          <Button variant="outline" className="w-full h-11" disabled>
            <RotateCcw className="w-4 h-4 mr-2" /> Restore Purchases
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Native billing will be available in a future app update.
          </p>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
}