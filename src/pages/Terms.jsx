import React from "react";

import LegalFooter from "@/components/LegalFooter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-3xl mx-auto px-6 py-10 prose prose-invert">
        <h1>Terms & Conditions</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>Use of Service</h2>
        <p>
          Session Buddy is an educational, harm-reduction tool. It does not provide medical advice, diagnosis, or treatment.
        </p>
        <h2>Subscriptions</h2>
        <ul>
          <li>Managed via Apple App Store or Google Play. Follow store policies for cancellation/refunds.</li>
        </ul>
        <h2>User Content</h2>
        <p>You are responsible for content you input and must comply with applicable laws.</p>
        <h2>Liability</h2>
        <p>Service provided as-is to the extent permitted by law.</p>
        <p className="text-xs opacity-70">This content is informational and not legal advice.</p>
      </div>
    </div>
  );
}