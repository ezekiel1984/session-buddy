import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Crown, ExternalLink, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function isNativeApp() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Natively|BuildNatively/i.test(ua) || window.__NATIVELY__ === true;
}

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

  const native = isNativeApp();

  const goToWebCheckout = async () => {
    // Keep existing web Stripe flow – redirect to web upgrade route if present
    // If an existing upgrade flow/page exists elsewhere, navigate there. Otherwise, keep this page.
    navigate(createPageUrl('PremiumWeb') || '/Premium');
  };

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
          <p className="text-gray-400 mt-2 text-sm">Pricing shown during checkout. Subscription bills on a recurring basis; cancel anytime.</p>
        </div>

        {native ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141416] border border-gray-800">
              <p className="text-gray-200 font-medium mb-1">In‑App Purchases required</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                You're using the native app. Apple App Store and Google Play require native in‑app purchases for digital subscriptions.
                We're finalizing native billing. In the meantime, you can continue using the free tier.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 opacity-60 cursor-not-allowed" disabled>
                <RotateCcw className="w-4 h-4 mr-2" /> Restore Purchases
              </Button>
              <a
                href={typeof window !== 'undefined' ? window.location.origin + '/Premium' : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full h-11 bg-[#25A55F] hover:bg-[#1e8a4c]">
                  Learn More <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Web subscriptions (via Stripe) are for browser/PWA use only and won't unlock native apps. Native billing will be available soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141416] border border-gray-800">
              <p className="text-gray-200 font-medium mb-1">Browser checkout</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upgrade securely with Stripe in your browser. Your subscription unlocks Premium on the web/PWA. Native apps will use in‑app purchases.
              </p>
            </div>
            <Button className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" onClick={goToWebCheckout}>
              Continue to Secure Checkout
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Managed by Stripe. You can cancel anytime from Settings. Refunds subject to Stripe and local regulations.
            </p>
          </div>
        )}

        <div className="mt-8 p-4 rounded-xl bg-[#141416] border border-gray-800 text-sm text-gray-400">
          <p>
            Need help? See <a href="/Support" className="underline">Support</a>. Read our <a href="/Privacy" className="underline">Privacy Policy</a> and <a href="/Terms" className="underline">Terms</a>.
          </p>
        </div>
      </div>
    </div>
  );
}