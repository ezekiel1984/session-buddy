import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Crown, RotateCcw, Check, AlertCircle, Sparkles, TrendingUp, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LegalFooter from "@/components/LegalFooter";
import { PurchaseRouter } from "@/components/utils/purchaseRouter";

export default function Premium() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNative, setIsNative] = useState(false);
  const [prices, setPrices] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // 'monthly' | 'yearly' | 'restore' | null
  const [message, setMessage] = useState(null); // { type, text }
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);

        // Give the native bridge a moment to load before checking
        await PurchaseRouter.waitForNativeBridge(3000);
        const native = PurchaseRouter.isNativeBilling();
        setIsNative(native);

        if (native) {
          const displayPrices = await PurchaseRouter.getDisplayPrices();
          setPrices(displayPrices);
        }

        // Check for Stripe success redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'success') {
          setMessage({ type: 'success', text: 'Payment successful — activating your premium access.' });
          try {
            const updated = await base44.auth.me();
            setUser(updated);
          } catch {}
          window.history.replaceState({}, '', window.location.pathname);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, []);

  const handleNativeUpgrade = async (plan) => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Unable to identify your account. Please restart the app.' });
      return;
    }
    setActionLoading(plan);
    setMessage(null);
    try {
      const result = await PurchaseRouter.startUpgrade(plan, user.id);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Purchase successful — activating premium…' });
        try { setUser(await base44.auth.me()); } catch {}
      } else if (result.userCancelled) {
        // Silent on cancel
      } else {
        setMessage({ type: 'error', text: result.error || 'Purchase failed. Please try again.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Purchase failed. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async () => {
    if (!user?.id) return;
    setActionLoading('restore');
    setMessage(null);
    try {
      const result = await PurchaseRouter.restore(user.id);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Purchases restored — checking premium status…' });
        try { setUser(await base44.auth.me()); } catch {}
      } else {
        setMessage({ type: 'error', text: result.error || 'No previous purchases found.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Restore failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleWebUpgrade = async (plan) => {
    setActionLoading(plan);
    setMessage(null);
    try {
      const result = await base44.functions.invoke("createStripeCheckoutSession", {
        plan,
        successUrl: window.location.origin + "/Premium?status=success",
        cancelUrl: window.location.href
      });
      const redirectUrl = result?.url || result?.checkout_url || result?.session_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setMessage({ type: 'error', text: 'Checkout session created but no redirect URL was returned.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to start checkout. Please try again.' });
    } finally {
      setActionLoading(null);
    }
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
        <LegalFooter />
      </div>
    );
  }

  const features = [
    { icon: TrendingUp, title: 'Deep Insights', desc: 'Track tolerance trends and consumption patterns over time.' },
    { icon: Brain, title: 'AI Companion', desc: 'Chat with an AI buddy that knows your session history.' },
    { icon: Sparkles, title: 'Advanced Tools', desc: 'Predictor, tolerance coach, and shareable stats cards.' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Premium</span>
          </div>
          <h1 className="text-3xl font-bold mt-4">Upgrade to Premium</h1>
          <p className="text-gray-400 mt-2">
            Deeper insights, personalized trends, and powerful tools for mindful consumption. Educational and harm-reduction focused — not medical advice.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-[#141416] border border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-[#25A55F]/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-[#25A55F]" />
              </div>
              <div>
                <p className="font-medium text-gray-100">{f.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status / error / success message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-[#25A55F]/10 border-[#25A55F]/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {message.type === 'success'
              ? <Check className="w-5 h-5 text-[#25A55F] flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
            <p className={`text-sm leading-relaxed ${message.type === 'success' ? 'text-[#25A55F]' : 'text-red-400'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Billing — Native (in-app purchase) */}
        {isNative && (
          <div className="space-y-4">
            {/* Monthly plan */}
            <div className="p-5 rounded-xl bg-[#141416] border border-gray-800">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-100">Monthly</p>
                  <p className="text-sm text-gray-400 mt-0.5">{prices?.monthly || 'Loading price…'}</p>
                </div>
              </div>
              <Button
                className="w-full h-11 bg-[#25A55F] hover:bg-[#1e8a4c]"
                disabled={actionLoading !== null}
                onClick={() => handleNativeUpgrade('monthly')}
              >
                {actionLoading === 'monthly' ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : 'Upgrade Monthly'}
              </Button>
            </div>

            {/* Yearly plan */}
            <div className="p-5 rounded-xl bg-[#141416] border border-[#25A55F]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#25A55F] text-white text-xs font-semibold px-2.5 py-1 rounded-bl-lg">
                Best Value
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-100">Yearly</p>
                  <p className="text-sm text-gray-400 mt-0.5">{prices?.yearly || 'Loading price…'}</p>
                </div>
              </div>
              <Button
                className="w-full h-11 bg-[#25A55F] hover:bg-[#1e8a4c]"
                disabled={actionLoading !== null}
                onClick={() => handleNativeUpgrade('yearly')}
              >
                {actionLoading === 'yearly' ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : 'Upgrade Yearly'}
              </Button>
            </div>

            {/* Restore */}
            <Button
              variant="outline"
              className="w-full h-11"
              disabled={actionLoading !== null}
              onClick={handleRestore}
            >
              {actionLoading === 'restore' ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Restoring…</>
              ) : <><RotateCcw className="w-4 h-4 mr-2" /> Restore Purchases</>}
            </Button>

            {prices?.disclaimer && (
              <p className="text-xs text-gray-500 text-center px-4">{prices.disclaimer}</p>
            )}
          </div>
        )}

        {/* Billing — Web (Stripe checkout) */}
        {!isNative && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[#141416] border border-gray-800">
              <p className="font-semibold text-gray-100 mb-1">Monthly</p>
              <p className="text-sm text-gray-400">$4.99 USD / month</p>
              <Button
                className="w-full h-11 mt-4 bg-[#25A55F] hover:bg-[#1e8a4c]"
                disabled={actionLoading !== null}
                onClick={() => handleWebUpgrade('monthly')}
              >
                {actionLoading === 'monthly' ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirecting…</>
                ) : 'Upgrade Monthly'}
              </Button>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-[#25A55F]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#25A55F] text-white text-xs font-semibold px-2.5 py-1 rounded-bl-lg">
                Best Value
              </div>
              <p className="font-semibold text-gray-100 mb-1">Yearly</p>
              <p className="text-sm text-gray-400">$39.99 USD / year</p>
              <Button
                className="w-full h-11 mt-4 bg-[#25A55F] hover:bg-[#1e8a4c]"
                disabled={actionLoading !== null}
                onClick={() => handleWebUpgrade('yearly')}
              >
                {actionLoading === 'yearly' ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirecting…</>
                ) : 'Upgrade Yearly'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center px-4">
              Secure checkout via Stripe. Cancel anytime from your account settings.
            </p>
          </div>
        )}
      </div>
      <LegalFooter />
    </div>
  );
}