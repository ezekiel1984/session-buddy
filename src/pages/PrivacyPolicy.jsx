
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('en-AU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Australia/Sydney'
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to={createPageUrl('Landing')}>
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white hover:bg-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-3">
              This Privacy Policy explains how <strong>Verde Labs Australia</strong> (ABN 66 798 124 069) ("we," "our," or "us"), collects, uses, discloses, and protects your personal information when you use the Session Buddy web application (the "Service").
            </p>
            <p className="mb-3">
              Session Buddy is a Progressive Web Application (PWA) that helps adults track cannabis consumption responsibly. We are committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
            </p>
            <p>
              <strong>Contact:</strong> For privacy inquiries, email us at <a href="mailto:sessionbuddy@verdelabs.com.au" className="text-[#25A55F] hover:underline">sessionbuddy@verdelabs.com.au</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, full name, and password (encrypted)</li>
              <li><strong>Profile Data:</strong> Optional body weight, tolerance level, preferred units (metric/imperial), and preferred AI companion tone</li>
              <li><strong>Session Data:</strong> Consumption method, dosage (mg), strain names, timestamps, tolerance levels, mood tags, and calculated buzz scores</li>
              <li><strong>Mood Tags:</strong> Optional emotional state tags (relaxed, creative, focused, social, sleepy, energized, happy, calm) associated with sessions</li>
              <li><strong>AI Chat History:</strong> Conversations with the AI Companion feature (Premium only)</li>
              <li><strong>Badge Data:</strong> Achievement milestones and earned badges</li>
              <li><strong>Sharing Preferences:</strong> Social sharing settings and generated share images</li>
              <li><strong>Age Verification:</strong> Confirmation that you are 18 years or older</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.2 Payment Information</h3>
            <p className="mb-3">
              Payment processing is handled securely by <strong>Stripe, Inc.</strong> We do not store your full credit card details. Stripe provides us with:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Stripe Customer ID</li>
              <li>Subscription status and metadata</li>
              <li>Payment method type (e.g., card brand)</li>
            </ul>
            <p className="mt-3">
              Stripe's privacy practices are governed by their Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">stripe.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.3 Automatically Collected Information</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, session duration, and interaction patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, IP address (anonymized)</li>
              <li><strong>Authentication Tokens:</strong> Stored locally in your browser to maintain your logged-in session</li>
              <li><strong>Local Storage:</strong> Session state, preferences, and cached data for PWA functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.4 AI-Generated Content (Premium Feature)</h3>
            <p>
              When you use the AI Companion feature (Premium only), we send anonymized session data to <strong>OpenAI</strong> via the Base44 platform to generate personalized insights. This data includes:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Session method, dosage, and timestamps (no personally identifiable information)</li>
              <li>Your conversation history with the AI Companion</li>
              <li>Aggregated usage patterns</li>
            </ul>
            <p className="mt-3">
              We <strong>do not</strong> send your email, full name, or other personal identifiers to AI providers. OpenAI's data handling is governed by their Privacy Policy: <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">openai.com/privacy</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-3">We use your personal information for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Service Delivery:</strong> Provide and maintain Session Buddy features, including session tracking, mood tagging, buzz calculations, and badge achievements</li>
              <li><strong>Premium Features:</strong> Enable AI Companion insights with customizable tones, advanced analytics, and social sharing for Premium subscribers</li>
              <li><strong>Payment Processing:</strong> Manage subscriptions, billing, and payment verification via Stripe</li>
              <li><strong>Account Management:</strong> Authenticate users, maintain security, and provide customer support</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns, mood trends, and badge engagement to improve features and user experience</li>
              <li><strong>Social Sharing:</strong> Generate shareable stats cards with AI-generated vibe taglines (Premium feature)</li>
              <li><strong>Communications:</strong> Send important service updates, security alerts, and subscription notifications</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws and respond to valid legal requests</li>
            </ul>
            <p className="mt-4">
              <strong>Lawful Basis:</strong> We process your personal information based on consent (when you create an account), contractual necessity (to provide the Service), and legitimate interests (to improve and secure our Service).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Technical Infrastructure & Data Storage</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.1 Hosting & Storage</h3>
            <p className="mb-3">
              Session Buddy is built on the <strong>Base44</strong> platform, which uses:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Supabase (Postgres):</strong> Primary database for user accounts and session data</li>
              <li><strong>Deno Deploy:</strong> Serverless functions for backend logic and API integrations</li>
              <li><strong>AWS/Cloudflare CDN:</strong> Content delivery and static asset hosting</li>
            </ul>
            <p className="mt-3">
              Data may be stored in servers located in the United States or other jurisdictions. We ensure all data transfers comply with Australian Privacy Principles through:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Encryption in transit (TLS 1.3)</li>
              <li>Encryption at rest (AES-256)</li>
              <li>Access controls and authentication via Base44's security infrastructure</li>
              <li>Regular security audits and monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.2 Secrets & Credentials</h3>
            <p>
              API keys, webhook secrets, and other sensitive credentials are stored in Base44's encrypted Secrets Vault and are never exposed to end users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing & Disclosure</h2>
            <p className="mb-3">
              We <strong>do not sell</strong> your personal information. We may share your data only in the following circumstances:
            </p>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">5.1 Service Providers</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Base44:</strong> Platform infrastructure, hosting, and authentication services</li>
              <li><strong>Stripe:</strong> Payment processing and subscription management</li>
              <li><strong>OpenAI:</strong> AI-powered insights (Premium feature only; anonymized data)</li>
              <li><strong>Supabase:</strong> Database and storage services</li>
              <li><strong>Deno Deploy:</strong> Serverless function execution</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">5.2 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or government authority, or to:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Comply with legal obligations</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or illegal activity</li>
              <li>Enforce our Terms of Use</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">5.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or asset sale, your personal information may be transferred to the new owner. We will notify you via email or prominent notice on our Service before your information is transferred.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies & Local Storage</h2>
            <p className="mb-3">
              Session Buddy uses cookies and browser local storage to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Maintain your logged-in session (authentication token)</li>
              <li>Remember your preferences (tolerance, weight, units)</li>
              <li>Cache session data for offline PWA functionality</li>
              <li>Track paywall status and subscription state</li>
            </ul>
            <p className="mt-3">
              <strong>Essential cookies</strong> are required for the Service to function. You can clear cookies and local storage via your browser settings, but this will log you out and reset your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="mb-3">
              We retain your personal information for as long as necessary to provide the Service and comply with legal obligations:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Account Data:</strong> Until you delete your account or request deletion</li>
              <li><strong>Session History:</strong> Until you delete individual sessions or clear all history</li>
              <li><strong>Payment Records:</strong> Retained by Stripe for 7 years (legal requirement for financial records)</li>
              <li><strong>AI Conversation History:</strong> Deleted when you delete your account; not retained by OpenAI beyond 30 days per their Zero Data Retention policy</li>
            </ul>
            <p className="mt-3">
              After deletion, de-identified data may be retained for analytical purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights Under Australian Privacy Law</h2>
            <p className="mb-3">
              Under the Privacy Act 1988 (Cth) and APPs, you have the following rights:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update inaccurate or incomplete information via Settings</li>
              <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Export:</strong> Download your session history in CSV format via Settings → Export My Data</li>
              <li><strong>Withdrawal of Consent:</strong> Opt out of non-essential communications or AI features</li>
              <li><strong>Complaint:</strong> Lodge a complaint with us or the Office of the Australian Information Commissioner (OAIC)</li>
            </ul>
            <p className="mt-4">
              To exercise your rights, contact us at <a href="mailto:sessionbuddy@verdelabs.com.au" className="text-[#25A55F] hover:underline">sessionbuddy@verdelabs.com.au</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Security Measures</h2>
            <p className="mb-3">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Encryption:</strong> TLS 1.3 for data in transit; AES-256 for data at rest</li>
              <li><strong>Authentication:</strong> Secure password hashing (bcrypt) and session management</li>
              <li><strong>Access Controls:</strong> Role-based permissions and admin-only data access</li>
              <li><strong>Secrets Management:</strong> API keys stored in Base44's encrypted Secrets Vault</li>
              <li><strong>Monitoring:</strong> Automated alerts for suspicious activity and security events</li>
            </ul>
            <p className="mt-3 text-yellow-400">
              <strong>Important:</strong> No method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p>
              Session Buddy is intended for adults aged 18 years or older. We do not knowingly collect personal information from minors. If we become aware that a user is under 18, we will immediately delete their account and all associated data.
            </p>
            <p className="mt-3">
              If you believe a minor has provided personal information to us, please contact <a href="mailto:sessionbuddy@verdelabs.com.au" className="text-[#25A55F] hover:underline">sessionbuddy@verdelabs.com.au</a> immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Educational Purpose & Medical Disclaimer</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
              <p className="font-semibold text-yellow-500 mb-2">⚠️ Important Disclaimer</p>
              <p className="text-sm">
                Session Buddy is an <strong>educational and tracking tool only</strong>. We do not provide medical advice, dosing recommendations, or health guidance. Buzz calculations and sober time estimates are approximations based on general data and should not be relied upon for safety-critical decisions.
              </p>
            </div>
            <p className="mb-3">
              <strong>We do not:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Recommend specific dosages, strains, or consumption methods</li>
              <li>Diagnose, treat, or cure any medical conditions</li>
              <li>Replace professional medical advice or consultation</li>
              <li>Make health claims about cannabis use</li>
            </ul>
            <p className="mt-4 font-semibold text-white">
              Always consult a qualified healthcare professional before making decisions about cannabis use, especially if you have pre-existing medical conditions or take prescription medications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Legal Age & Compliance</h2>
            <p className="mb-3">
              Cannabis laws vary by location. You are responsible for ensuring your cannabis use complies with all applicable local, state, and federal laws. Session Buddy does not promote, facilitate, or condone illegal activity.
            </p>
            <p>
              <strong>By using Session Buddy, you represent and warrant that:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>You are 18 years of age or older (or meet the legal age requirement in your jurisdiction)</li>
              <li>Cannabis consumption is legal in your location</li>
              <li>You will use the Service responsibly and in accordance with applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to This Privacy Policy</h2>
            <p className="mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or Service features. We will notify you of significant changes via:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email notification to your registered email address</li>
              <li>In-app notification when you next log in</li>
              <li>Updated "Last updated" date at the top of this page</li>
            </ul>
            <p className="mt-3">
              Your continued use of Session Buddy after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us & Complaints</h2>
            <p className="mb-3">
              If you have questions, concerns, or complaints about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-[#141416] border border-gray-800 rounded-xl p-6 space-y-2">
              <p><strong>Privacy Inquiries:</strong> <a href="mailto:sessionbuddy@verdelabs.com.au" className="text-[#25A55F] hover:underline">sessionbuddy@verdelabs.com.au</a></p>
              <p><strong>Entity:</strong> Verde Labs Australia (ABN 66 798 124 069)</p>
              <p><strong>Address:</strong> New South Wales, Australia</p>
            </div>
            <p className="mt-4">
              We will investigate and respond to complaints within 30 days. If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC):
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li><strong>Website:</strong> <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">oaic.gov.au</a></li>
              <li><strong>Phone:</strong> 1300 363 992</li>
              <li><strong>Email:</strong> enquiries@oaic.gov.au</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of New South Wales, Australia. Any disputes arising from this Privacy Policy will be subject to the exclusive jurisdiction of the courts of New South Wales.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            Last updated: {lastUpdated} (Sydney time)
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to={createPageUrl('TermsOfUse')} className="text-[#25A55F] hover:underline text-sm">
              Terms of Use
            </Link>
            <Link to={createPageUrl('Landing')} className="text-gray-400 hover:text-white text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
