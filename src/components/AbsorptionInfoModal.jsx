
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { ABSORPTION_FACTORS } from './utils/absorptionConstants';

export default function AbsorptionInfoModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#25A55F]" />
            How We Estimate THC Intake
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Understanding bioavailability and absorption
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h3 className="font-semibold text-white mb-2">What is Bioavailability?</h3>
            <p>
              Not all THC consumed enters your bloodstream. <strong>Bioavailability</strong> is the percentage that actually gets absorbed and becomes active in your body. The "Estimated THC Intake" shows how much THC will actually be absorbed based on your consumption method.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Method-Specific Absorption</h3>
            <div className="space-y-2 bg-[#0A0A0B] rounded-xl p-4">
              <div className="flex justify-between">
                <span>🔥 Smoking (Joint/Cone/Bong)</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.smoke * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>💨 Vape (Dry Herb)</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.vape_dry * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>🔋 Vape (Oil Cart)</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.vape_cart * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>💎 Dab/Concentrate</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.dab * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>💧 Oil (Sublingual)</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.oil_sublingual * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>🧴 Oil (Ingested)</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.oil_ingested * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>🍪 Edibles</span>
                <span className="text-[#25A55F]">{ABSORPTION_FACTORS.edible * 100}%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Why the Differences?</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Inhalation</strong> (vaping/smoking) enters bloodstream directly through lungs</li>
              <li><strong>Sublingual</strong> (under tongue) absorbs through mucous membranes, bypassing liver</li>
              <li><strong>Ingestion</strong> (edibles/capsules) must pass through digestive system and liver, reducing bioavailability</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Metabolism & Time</h3>
            <p>
              Once absorbed, THC is metabolized over time. We use exponential decay models based on method-specific half-lives to estimate when you'll be sober.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
            <p className="text-yellow-200 text-xs">
              <strong>⚠️ Important:</strong> These are estimates based on average data. Individual responses vary based on tolerance, body weight, metabolism, and other factors. Never rely on these calculations for safety-critical decisions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
