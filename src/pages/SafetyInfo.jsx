import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Clock, Heart, Scale, BookOpen } from 'lucide-react';

export default function SafetyInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#25A55F]/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#25A55F]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Safety & Harm Reduction</h1>
            <p className="text-gray-400 text-sm">Educational guidance for mindful consumption</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-200 leading-relaxed">
              <strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute medical advice. Cannabis affects everyone differently. Always consult with a healthcare professional for personalized guidance, especially if you have pre-existing health conditions.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-6">
          <SafetySection
            icon={Clock}
            title="Start Low, Go Slow"
            color="text-green-400"
            bgColor="bg-green-900/20"
            borderColor="border-green-700/30"
          >
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
              <li><strong>Begin with small doses</strong> (5-10mg for edibles, 0.05-0.10g for inhalation)</li>
              <li><strong>Wait at least 30-60 minutes before re-dosing</strong> for inhalation methods</li>
              <li><strong>Wait 90-120 minutes for edibles/oils</strong> - they take longer to kick in</li>
              <li>Effects can peak hours after consumption, especially with oral methods</li>
              <li>It's always easier to take more later than to deal with too much</li>
            </ul>
          </SafetySection>

          <SafetySection
            icon={AlertTriangle}
            title="Critical Safety Rules"
            color="text-yellow-400"
            bgColor="bg-yellow-900/20"
            borderColor="border-yellow-700/30"
          >
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
              <li><strong>Never drive or operate heavy machinery</strong> while under the influence or within 4-6 hours of consumption</li>
              <li><strong>Do not mix with alcohol or other drugs</strong> - combined effects are unpredictable and dangerous</li>
              <li><strong>Avoid risky activities</strong> that require coordination, judgment, or quick reactions</li>
              <li><strong>Stay in a safe, comfortable environment</strong> when trying new products or higher doses</li>
              <li><strong>Have a trusted, sober friend nearby</strong> if trying cannabis for the first time</li>
            </ul>
          </SafetySection>

          <SafetySection
            icon={Heart}
            title="Know Your Limits"
            color="text-purple-400"
            bgColor="bg-purple-900/20"
            borderColor="border-purple-700/30"
          >
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
              <li><strong>Understand your tolerance level</strong> - it changes over time with regular use</li>
              <li><strong>Different methods have different effects</strong> - edibles last longer but take more time to work</li>
              <li><strong>Set and setting matter</strong> - your environment and mindset influence your experience</li>
              <li><strong>Stay hydrated</strong> - keep water nearby and drink regularly</li>
              <li><strong>Have snacks ready</strong> - cannabis can increase appetite and lower blood sugar</li>
            </ul>
          </SafetySection>

          <SafetySection
            icon={Scale}
            title="Legal Considerations (Australia)"
            color="text-blue-400"
            bgColor="bg-blue-900/20"
            borderColor="border-blue-700/30"
          >
            <div className="text-gray-300 text-sm space-y-2">
              <p><strong>Cannabis laws vary by state and territory in Australia.</strong> Users must ensure they comply with local regulations:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Medical cannabis requires a prescription and TGA approval</li>
                <li>Possession limits and cultivation rules differ by jurisdiction</li>
                <li>Driving under the influence is illegal nationwide</li>
                <li>Public consumption may be prohibited even where possession is legal</li>
              </ul>
              <p className="mt-3">
                <strong>You are responsible for knowing and following the laws in your area.</strong> Session Buddy does not encourage illegal use.
              </p>
            </div>
          </SafetySection>

          <SafetySection
            icon={AlertTriangle}
            title="If You Feel Uncomfortable"
            color="text-red-400"
            bgColor="bg-red-900/20"
            borderColor="border-red-700/30"
          >
            <div className="text-gray-300 text-sm space-y-2">
              <p>If you've consumed too much and feel anxious, paranoid, or uncomfortable:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Remember: the feeling will pass</strong> - you cannot overdose fatally on THC</li>
                <li><strong>Find a calm, safe space</strong> - sit or lie down comfortably</li>
                <li><strong>Practice deep breathing</strong> - slow, controlled breaths help reduce anxiety</li>
                <li><strong>Stay hydrated</strong> - sip water slowly</li>
                <li><strong>Try black pepper or CBD</strong> - both may help reduce THC's effects</li>
                <li><strong>Call someone you trust</strong> - talking can help ground you</li>
                <li><strong>If symptoms are severe or worrying, seek medical help</strong> - doctors need to know what you've taken to help you</li>
              </ul>
            </div>
          </SafetySection>

          {/* Resources */}
          <div className="bg-[#141416] border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#25A55F]" />
              Additional Resources
            </h3>
            <div className="space-y-3 text-sm">
              <a
                href="https://www.health.gov.au/topics/drugs/cannabis"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#25A55F] hover:text-[#1e8a4c] underline"
              >
                Australian Department of Health - Cannabis Information
              </a>
              <a
                href="https://www.tga.gov.au/medicinal-cannabis"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#25A55F] hover:text-[#1e8a4c] underline"
              >
                TGA - Medicinal Cannabis Hub
              </a>
              <a
                href="https://ncpic.org.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#25A55F] hover:text-[#1e8a4c] underline"
              >
                National Cannabis Prevention and Information Centre (NCPIC)
              </a>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Emergency Contact
            </h3>
            <p className="text-sm text-gray-300 mb-2">
              If you or someone else experiences severe adverse reactions (difficulty breathing, chest pain, seizures, loss of consciousness):
            </p>
            <p className="text-2xl font-bold text-red-400">Call 000 (Emergency Services)</p>
            <p className="text-xs text-gray-400 mt-2">
              For non-emergency health advice, call Healthdirect Australia: <strong className="text-white">1800 022 222</strong>
            </p>
          </div>
        </div>
      </div>

      
    </div>
  );
}

function SafetySection({ icon: Icon, title, color, bgColor, borderColor, children }) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
      </div>
      {children}
    </div>
  );
}