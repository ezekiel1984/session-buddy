import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfUse() {
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

        <h1 className="text-4xl font-bold mb-4">Terms of Use</h1>
        <p className="text-gray-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
            <p className="mb-3">
              These Terms of Use ("Terms") constitute a legally binding agreement between you and <strong>Verde Labs Australia</strong> (ABN 66 798 124 069) ("we," "our," or "us"), governing your access to and use of the Session Buddy web application (the "Service").
            </p>
            <p className="mb-3">
              By creating an account, accessing, or using Session Buddy, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of these Terms, you may not use our Service.
            </p>
            <p>
              <strong>Contact:</strong> For support inquiries, email <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] hover:underline">support@verdelabs.com.au</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="mb-3">
              Session Buddy is a Progressive Web Application (PWA) that provides:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Free Features:</strong> Session logging with method/dosage/strain tracking, mood tagging, buzz score calculations, sober time estimates, session history with search/filter, achievement badges, and data export</li>
              <li><strong>Premium Features:</strong> AI Companion with 5 customizable tones (Zen, Rick, LoFi, Clinical, Dude), advanced analytics and insights dashboards, social sharing with AI-generated vibe taglines and beautiful stats cards, and priority support</li>
            </ul>
            <p className="mt-3">
              Session Buddy is designed as an <strong>educational and tracking tool</strong> to help adults monitor cannabis consumption responsibly. We do not sell, distribute, or facilitate the sale of cannabis products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Eligibility & Legal Compliance</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.1 Age Requirement</h3>
            <p className="mb-3">
              You must be <strong>18 years of age or older</strong> (or meet the legal age requirement in your jurisdiction) to use Session Buddy. By using the Service, you represent and warrant that you meet this age requirement.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.2 Legal Use of Cannabis</h3>
            <p className="mb-3">
              Cannabis laws vary by jurisdiction. You are solely responsible for ensuring that your cannabis use complies with all applicable local, state, federal, and international laws. Session Buddy does not:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Promote, encourage, or facilitate illegal cannabis use</li>
              <li>Verify the legality of cannabis in your location</li>
              <li>Provide legal advice regarding cannabis laws</li>
            </ul>
            <p className="mt-3">
              <strong>You use Session Buddy at your own risk and are solely responsible for complying with applicable laws.</strong>
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.3 Account Termination for Illegal Activity</h3>
            <p>
              We reserve the right to immediately terminate accounts that we reasonably believe are being used for illegal purposes or in violation of applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Medical & Health Disclaimer</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-4">
              <p className="font-semibold text-red-400 mb-3">⚠️ IMPORTANT MEDICAL DISCLAIMER</p>
              <p className="text-sm mb-2">
                Session Buddy is <strong>NOT a medical device</strong> and does not provide medical advice, diagnosis, or treatment. The Service is for <strong>educational and entertainment purposes only</strong>.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.1 No Medical Advice</h3>
            <p className="mb-3">
              Session Buddy does not:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Provide medical, health, or wellness advice</li>
              <li>Recommend specific dosages, strains, or consumption methods</li>
              <li>Diagnose, treat, cure, or prevent any disease or medical condition</li>
              <li>Replace professional medical consultation</li>
              <li>Make health claims about cannabis use</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.2 Buzz Calculations Are Estimates Only</h3>
            <p className="mb-3">
              Buzz scores and sober time estimates are <strong>approximate calculations</strong> based on general data and user-provided inputs. These estimates:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Are not scientifically validated or medically accurate</li>
              <li>Should not be relied upon for safety-critical decisions (e.e.g., driving, operating machinery)</li>
              <li>Vary significantly based on individual physiology, metabolism, tolerance, and other factors</li>
              <li>Do not account for drug interactions, medical conditions, or other substances</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.3 Consult Healthcare Professionals</h3>
            <p>
              <strong>Always consult a qualified healthcare professional</strong> before making decisions about cannabis use, especially if you:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Have pre-existing medical conditions</li>
              <li>Take prescription medications</li>
              <li>Are pregnant or breastfeeding</li>
              <li>Have a history of substance abuse or mental health disorders</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.4 Do Not Drive or Operate Machinery</h3>
            <p className="text-red-400 font-semibold">
              Never drive, operate heavy machinery, or engage in safety-critical activities while impaired by cannabis or any other substance. Session Buddy's sober time estimates should NOT be used to determine fitness to drive or operate machinery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. User Account & Responsibilities</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">5.1 Account Creation</h3>
            <p className="mb-3">
              To use Session Buddy, you must create an account by providing:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>A valid email address</li>
              <li>Your full name</li>
              <li>A secure password</li>
              <li>Confirmation that you meet the age requirement</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">5.2 Account Security</h3>
            <p className="mb-3">
              You are responsible for:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Maintaining the confidentiality of your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breaches</li>
            </ul>
            <p className="mt-3">
              You may not share your account credentials with others or allow others to access your account.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">5.3 Accurate Information</h3>
            <p>
              You agree to provide accurate, current, and complete information when using the Service. Providing false or misleading information may result in account termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Acceptable Use Policy</h2>
            <p className="mb-3">
              You agree not to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Use the Service for illegal purposes or in violation of any laws</li>
              <li>Impersonate any person or entity, or falsely represent your affiliation</li>
              <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service</li>
              <li>Upload viruses, malware, or other malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove or modify any copyright, trademark, or proprietary notices</li>
              <li>Use the Service to promote or sell products or services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Subscription & Payment</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.1 Premium Membership</h3>
            <p className="mb-3">
              Session Buddy offers a <strong>Premium subscription</strong> that provides access to advanced features including:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>AI Companion:</strong> Personalized insights and conversations powered by OpenAI, with 5 tone options (Zen, Rick, LoFi, Clinical, Dude)</li>
              <li><strong>Advanced Analytics:</strong> Detailed insights, mood trends, consumption patterns, and multi-period comparisons</li>
              <li><strong>Social Sharing:</strong> Generate beautiful stats cards with AI-generated vibe taglines, customizable time periods, and anonymous sharing options</li>
              <li><strong>Priority Support:</strong> Faster response times for customer inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.2 Pricing</h3>
            <p className="mb-3">Premium subscription is available in two billing cycles:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Monthly:</strong> $4.99 USD/month, billed monthly</li>
              <li><strong>Yearly:</strong> $39.99 USD/year, billed annually (equivalent to $3.33/month)</li>
            </ul>
            <p className="mt-3">
              Pricing is subject to change. We will notify existing subscribers at least 30 days before any price increase takes effect.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.3 Payment Processing</h3>
            <p className="mb-3">
              All payments are processed securely through <strong>Stripe, Inc.</strong> You authorize us to charge your selected payment method on a recurring basis according to your chosen billing cycle. By subscribing, you agree to Stripe's Terms of Service: <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">stripe.com/legal</a>
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.4 Free Trial</h3>
            <p>
              New Premium subscribers receive a <strong>48-hour free trial</strong>. You will not be charged during the trial period. If you do not cancel before the trial ends, you will automatically be charged for your selected subscription plan (monthly or yearly).
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.5 Auto-Renewal</h3>
            <p>
              Subscriptions automatically renew at the end of each billing cycle (monthly or yearly) unless cancelled before the renewal date. You will be charged the then-current subscription price.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.6 Cancellation</h3>
            <p className="mb-3">
              You may cancel your Premium subscription at any time via:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Settings → Manage Subscription → Cancel Subscription</li>
              <li>Stripe Customer Portal (link provided in Settings)</li>
            </ul>
            <p className="mt-3">
              <strong>Cancellation Effect:</strong> Upon cancellation, you will retain Premium access until the end of your current billing cycle. No refunds are provided for partial billing periods, except as required by Australian Consumer Law (see Section 7.7).
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.7 Refunds (Australian Consumer Law)</h3>
            <p className="mb-3">
              Under Australian Consumer Law (Schedule 2 to the Competition and Consumer Act 2010 (Cth)), you are entitled to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Consumer Guarantees:</strong> Services must be provided with due care and skill, fit for purpose, and delivered within a reasonable time</li>
              <li><strong>Major Failure:</strong> If the Service has a major failure (e.g., completely unusable), you are entitled to a refund or cancellation</li>
              <li><strong>Minor Failure:</strong> If the issue is minor, we will attempt to fix it within a reasonable time. If we cannot fix it, you may be entitled to a partial refund</li>
            </ul>
            <p className="mt-3">
              To request a refund under ACL, contact <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] hover:underline">support@verdelabs.com.au</a> with details of the issue. Refund requests must be made within 30 days of the charge.
            </p>
            <p className="mt-3">
              <strong>Refunds are not provided for:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Change of mind after the trial period</li>
              <li>Failure to cancel before auto-renewal</li>
              <li>Services already consumed (e.g., AI Companion conversations generated)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.8 Price Changes</h3>
            <p>
              We reserve the right to modify subscription pricing at any time. Price changes will not affect your current billing cycle. You will be notified at least 30 days before any price increase takes effect. If you do not agree to the new pricing, you may cancel your subscription.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">7.9 Failed Payments</h3>
            <p>
              If your payment method fails or is declined, we will attempt to process the payment up to 3 times. If payment continues to fail, your Premium subscription will be downgraded to the Free plan. You may re-subscribe at any time by updating your payment method.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. AI Companion Disclaimer</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-4">
              <p className="font-semibold text-yellow-500 mb-3">⚠️ AI-GENERATED CONTENT DISCLAIMER</p>
              <p className="text-sm">
                The AI Companion feature uses artificial intelligence (powered by OpenAI's GPT models) to generate conversational responses. AI-generated content:
              </p>
            </div>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>May be inaccurate, incomplete, or misleading</strong></li>
              <li>Should not be relied upon for medical, legal, or safety-critical decisions</li>
              <li>Does not constitute professional advice of any kind</li>
              <li>May contain biases, errors, or inappropriate content despite our efforts to filter harmful outputs</li>
              <li>Is generated based on patterns in training data and may not reflect current information</li>
            </ul>
            <p className="mt-4 font-semibold text-white">
              You use the AI Companion feature at your own risk. We are not responsible for any decisions you make based on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. User Content & Data Ownership</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">9.1 Your Content</h3>
            <p className="mb-3">
              You retain ownership of all session data, mood tags, chat history, badge achievements, and other content you create or upload to Session Buddy ("User Content"). By using the Service, you grant us a limited, non-exclusive, royalty-free license to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Store and process your User Content to provide the Service</li>
              <li>Use anonymized, de-identified data for analytics and service improvement</li>
              <li>Display your User Content to you within the Service</li>
              <li>Generate shareable images based on your stats (when you use the sharing feature)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">9.2 Social Sharing</h3>
            <p className="mb-3">
              When you use the social sharing feature (Premium only), you explicitly authorize us to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Generate shareable stat cards based on your session data</li>
              <li>Create AI-generated vibe taglines using your consumption patterns</li>
              <li>Store generated images for your download and sharing</li>
            </ul>
            <p className="mt-3">
              <strong>Privacy Note:</strong> Shared images do not contain your name, email, or other personally identifiable information unless you explicitly choose to include them. You control what you share and with whom.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">9.3 Data Deletion</h3>
            <p>
              You may delete your User Content at any time via the Settings page. When you delete your account, all User Content will be permanently deleted within 30 days.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">9.4 Data Export</h3>
            <p>
              You may export your session history in CSV format via Settings → Export My Data. This export includes all session logs but excludes AI conversation history.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">10.1 Our Intellectual Property</h3>
            <p className="mb-3">
              Session Buddy and all associated content, features, and functionality (including but not limited to software, text, graphics, logos, icons, images, audio clips, and data compilations) are owned by Verde Labs Australia and are protected by:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Australian copyright law</li>
              <li>Trademark law</li>
              <li>Other intellectual property laws</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">10.2 Limited License</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use Session Buddy for personal, non-commercial purposes, subject to these Terms. You may not:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Copy, modify, or create derivative works of the Service</li>
              <li>Reverse engineer or decompile any part of the Service</li>
              <li>Remove or alter any copyright, trademark, or proprietary notices</li>
              <li>Use the Service for commercial purposes without our written permission</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">10.3 Trademarks</h3>
            <p>
              "Session Buddy," "Verde Labs Australia," and associated logos are trademarks of Verde Labs Australia. You may not use these marks without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Third-Party Services & Disclaimers</h2>
            <p className="mb-3">
              Session Buddy integrates with the following third-party services:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Base44:</strong> Platform infrastructure and authentication (<a href="https://base44.com" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">base44.com</a>)</li>
              <li><strong>Stripe:</strong> Payment processing (<a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">stripe.com</a>)</li>
              <li><strong>OpenAI:</strong> AI Companion features (<a href="https://openai.com" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">openai.com</a>)</li>
              <li><strong>Supabase:</strong> Database and storage (<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">supabase.com</a>)</li>
            </ul>
            <p className="mt-4">
              <strong>Third-Party Terms:</strong> Your use of these third-party services is subject to their respective Terms of Service and Privacy Policies. We are not responsible for the practices, content, or policies of third-party services.
            </p>
            <p className="mt-3">
              <strong>Third-Party Availability:</strong> We do not guarantee the availability, functionality, or security of third-party services. If a third-party service becomes unavailable, certain features of Session Buddy may be temporarily unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Service Modifications & Updates</h2>
            <p className="mb-3">
              We reserve the right to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Modify, suspend, or discontinue any part of the Service at any time</li>
              <li>Update features, functionality, or user interface</li>
              <li>Perform maintenance and technical upgrades</li>
              <li>Change subscription plans, pricing, or Premium features (with notice)</li>
            </ul>
            <p className="mt-3">
              We will provide reasonable notice of significant changes that materially affect your use of the Service. Your continued use after changes are made constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Account Termination</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">13.1 Termination by You</h3>
            <p>
              You may terminate your account at any time via Settings → Delete Account. Upon termination, all User Content will be permanently deleted within 30 days.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">13.2 Termination by Us</h3>
            <p className="mb-3">
              We reserve the right to suspend or terminate your account immediately, without notice, if:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>You violate these Terms or our Privacy Policy</li>
              <li>You engage in illegal activity or fraud</li>
              <li>Your payment method fails repeatedly</li>
              <li>We reasonably believe your account poses a security risk</li>
              <li>We are required to do so by law or court order</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">13.3 Effect of Termination</h3>
            <p>
              Upon termination:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Your access to the Service will be immediately revoked</li>
              <li>All User Content will be deleted within 30 days</li>
              <li>Premium subscriptions will be cancelled (no refund for partial periods)</li>
              <li>Sections 4, 8, 10, 14, 15, and 16 of these Terms will survive termination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Limitation of Liability</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-4">
              <p className="font-semibold text-red-400 mb-3">⚠️ IMPORTANT LIABILITY LIMITATION</p>
              <p className="text-sm">
                To the maximum extent permitted by Australian law, including the Australian Consumer Law, our liability to you is limited as follows:
              </p>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">14.1 Limitation of Damages</h3>
            <p className="mb-3">
              In no event shall Verde Labs Australia, or our affiliates, directors, officers, employees, or agents be liable for:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Indirect, incidental, special, consequential, or punitive damages</strong>, including but not limited to:
                <ul className="list-circle ml-6 mt-2 space-y-1">
                  <li>Loss of profits, revenue, or business opportunities</li>
                  <li>Loss of data or information</li>
                  <li>Personal injury or property damage</li>
                  <li>Emotional distress</li>
                </ul>
              </li>
              <li><strong>Any damages resulting from:</strong>
                <ul className="list-circle ml-6 mt-2 space-y-1">
                  <li>Your use or inability to use the Service</li>
                  <li>Unauthorized access to your account or User Content</li>
                  <li>Third-party conduct or content</li>
                  <li>Errors, omissions, or inaccuracies in Service content</li>
                  <li>AI-generated content or recommendations</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">14.2 Cap on Liability</h3>
            <p>
              Our total liability to you for any claims arising from or related to the Service shall not exceed the <strong>greater of AUD $10.00 or the amount you paid to us in the 12 months preceding the claim</strong>.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">14.3 Australian Consumer Law Guarantees</h3>
            <p className="mb-3">
              Nothing in these Terms excludes, restricts, or modifies any consumer guarantees or rights you may have under the Australian Consumer Law or other applicable laws that cannot be lawfully excluded. Where we are liable for a failure to comply with a consumer guarantee, our liability is limited to (at our option):
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Supplying the services again; or</li>
              <li>Paying the cost of having the services supplied again</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">14.4 No Liability for Third Parties</h3>
            <p>
              We are not liable for the actions, content, or services of third parties (including Stripe, OpenAI, Base44, Supabase).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Indemnification</h2>
            <p className="mb-3">
              You agree to indemnify, defend, and hold harmless Verde Labs Australia and our affiliates, directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising from:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or regulations</li>
              <li>Your User Content</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">16. Governing Law & Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">16.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of New South Wales, Australia, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">16.2 Exclusive Jurisdiction</h3>
            <p>
              You agree that any dispute, claim, or controversy arising from or relating to these Terms or the Service shall be subject to the <strong>exclusive jurisdiction of the courts of New South Wales, Australia</strong>. You irrevocably submit to the jurisdiction of these courts and waive any objection to venue.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">16.3 Dispute Resolution Process</h3>
            <p className="mb-3">
              Before initiating legal proceedings, we encourage you to contact us at <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] hover:underline">support@verdelabs.com.au</a> to attempt to resolve the dispute informally. If we cannot resolve the dispute within 30 days, either party may proceed with legal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">17. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">17.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Verde Labs Australia regarding the Service and supersede all prior agreements and understandings.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">17.2 Severability</h3>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">17.3 Waiver</h3>
            <p>
              Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision or any other provision.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">17.4 Assignment</h3>
            <p>
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms or transfer our rights and obligations at any time without notice.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">17.5 No Partnership</h3>
            <p>
              Nothing in these Terms creates a partnership, joint venture, agency, or employment relationship between you and Verde Labs Australia.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">17.6 Force Majeure</h3>
            <p>
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, pandemics, labor disputes, or internet service failures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">18. Changes to These Terms</h2>
            <p className="mb-3">
              We reserve the right to modify these Terms at any time. We will notify you of significant changes via:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Email notification to your registered email address</li>
              <li>In-app notification when you next log in</li>
              <li>Updated "Last updated" date at the top of this page</li>
            </ul>
            <p className="mt-4">
              Your continued use of Session Buddy after changes are posted constitutes acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Service and delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">19. Contact Information</h2>
            <p className="mb-3">
              If you have questions, concerns, or feedback about these Terms, please contact us:
            </p>
            <div className="bg-[#141416] border border-gray-800 rounded-xl p-6 space-y-2">
              <p><strong>Support & General Inquiries:</strong> <a href="mailto:support@verdelabs.com.au" className="text-[#25A55F] hover:underline">support@verdelabs.com.au</a></p>
              <p><strong>Privacy Inquiries:</strong> <a href="mailto:sessionbuddy@verdelabs.com.au" className="text-[#25A55F] hover:underline">sessionbuddy@verdelabs.com.au</a></p>
              <p><strong>Entity:</strong> Verde Labs Australia (ABN 66 798 124 069)</p>
              <p><strong>Address:</strong> New South Wales, Australia</p>
              <p><strong>Website:</strong> <a href="https://session-buddy.app" target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">session-buddy.app</a></p>
            </div>
          </section>

          <section className="bg-[#141416] border border-gray-800 rounded-xl p-6 mt-8">
            <p className="text-sm text-gray-400 mb-4">
              <strong className="text-white">Acknowledgment:</strong> By creating an account and using Session Buddy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy.
            </p>
            <p className="text-xs text-gray-500">
              These Terms were last updated on {lastUpdated} (Sydney time). We recommend reviewing these Terms periodically for changes.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            Last updated: {lastUpdated} (Sydney time)
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to={createPageUrl('PrivacyPolicy')} className="text-[#25A55F] hover:underline text-sm">
              Privacy Policy
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