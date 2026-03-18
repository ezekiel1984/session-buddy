import React from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Support</h1>
        <p className="text-gray-400 mb-6">Questions or issues? We're here to help.</p>
        <a href="mailto:support@sessionbuddy.app" className="inline-block">
          <Button className="h-11">
            <Mail className="w-4 h-4 mr-2" /> Email Support
          </Button>
        </a>
        <div className="mt-6 text-sm text-gray-400">
          <p>For billing:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Web/PWA: Manage via your Stripe customer portal link from Settings or your receipt email.</li>
            <li>Native apps: Manage subscriptions in your Apple App Store or Google Play account settings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}