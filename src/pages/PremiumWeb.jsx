import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { stripeCreateCheckout } from '@/functions/stripeCreateCheckout';
import LegalFooter from '@/components/LegalFooter';

function isNativeApp() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Natively|BuildNatively/i.test(ua) || window.__NATIVELY__ === true;
}

export default function PremiumWeb() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [params] = useSearchParams();
  const status = params.get('status');
  const native = isNativeApp();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const startCheckout = async () => {
    try {
      setLoading(true);
      setError('');
      const origin = window.location.origin;
      const res = await stripeCreateCheckout({ origin });
      const data = res.data || res; // SDK returns axios-like response
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error || 'Could not start checkout. Configure STRIPE_PRICE_ID in Settings.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (native) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="p-4 rounded-xl bg-[#141416] border border-gray-800">
            <div className="flex items-center gap-3 text-yellow-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-semibold">Not available in native app</p>
            </div>
            <p className="text-gray-400 text-sm">
              Apple/Google require native In‑App Purchases for digital subscriptions. Use the web app for Stripe checkout, or check back soon for native billing.
            </p>
          </div>
          <a href={window.location.origin + '/Premium'} className="inline-block mt-4">
            <Button className="h-11"><Crown className="w-4 h-4 mr-2" /> Premium Info <ExternalLink className="w-4 h-4 ml-2" /></Button>
          </a>
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
            <span className="text-sm font-medium text-purple-300">Web Checkout</span>
          </div>
          <h1 className="text-3xl font-bold mt-4">Premium via Stripe</h1>
          <p className="text-gray-400 mt-2 text-sm">Subscription bills on a recurring basis; cancel anytime from Settings. Refunds per Stripe and local rules.</p>
        </div>

        {status === 'success' && (
          <div className="p-4 rounded-xl bg-[#141416] border border-green-700/30 text-green-300 mb-4">
            Payment complete. Your Premium will unlock automatically within a few seconds once confirmed.
          </div>
        )}
        {status === 'cancel' && (
          <div className="p-4 rounded-xl bg-[#141416] border border-yellow-700/30 text-yellow-300 mb-4">
            Checkout canceled. You can try again anytime.
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-[#141416] border border-red-700/30 text-red-300 mb-4">{error}</div>
        )}

        <Button className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" onClick={startCheckout} disabled={loading}>
          {loading ? 'Starting…' : 'Start Secure Checkout'}
        </Button>
      </div>
      <LegalFooter />
    </div>
  );
}