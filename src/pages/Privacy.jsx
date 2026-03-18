import React from "react";

import LegalFooter from "@/components/LegalFooter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-3xl mx-auto px-6 py-10 prose prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          Session Buddy respects your privacy. We store only the data needed to provide the app: your account and
          your self-entered session logs. Your data belongs to you.
        </p>
        <h2>Data We Collect</h2>
        <ul>
          <li>Account information (email, name) for login</li>
          <li>Self-entered session data for insights and history</li>
        </ul>
        <h2>How We Use Data</h2>
        <ul>
          <li>Provide and improve the app experience</li>
          <li>Customer support and security</li>
        </ul>
        <h2>Sharing</h2>
        <p>We do not sell your data. We use trusted processors (hosting, payments) as needed.</p>
        <h2>Your Choices</h2>
        <p>You can delete your data by contacting support. For subscription billing, manage via Stripe (web) or your app store (native).</p>
        <p className="text-xs opacity-70">This content is informational and not legal advice.</p>
      </div>
    </div>
  );
}