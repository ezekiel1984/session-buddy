import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { adjustedDose, roundDose, targetSensitivityFromBuzz, forecastTI } from '@/components/utils/toleranceMath';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function DoseAdjuster({ currentMetrics, aucDays, usageProfile, metabolismAdj }) {
  const [method, setMethod] = useState('vape_dry');
  const [currentDose, setCurrentDose] = useState('');
  const [targetMode, setTargetMode] = useState('buzz'); // 'buzz' or 'ti'
  const [targetBuzz, setTargetBuzz] = useState(6);
  const [targetTI, setTargetTI] = useState(15);
  const [recommendations, setRecommendations] = useState(null);
  
  useEffect(() => {
    if (!currentDose || isNaN(parseFloat(currentDose))) {
      setRecommendations(null);
      return;
    }
    
    const dose_mg = parseFloat(currentDose);
    const S_now = currentMetrics.S;
    
    let S_target;
    if (targetMode === 'buzz') {
      S_target = targetSensitivityFromBuzz(targetBuzz);
    } else {
      // Convert TI to sensitivity
      S_target = 1 - (targetTI / 100);
    }
    
    // Calculate adjusted dose for today
    const doseToday = roundDose(method, adjustedDose(dose_mg, S_now, S_target));
    
    // Calculate for +3 days and +7 days
    const forecast3 = forecastTI(currentMetrics.TI, currentMetrics.tau, 3);
    const forecast7 = forecastTI(currentMetrics.TI, currentMetrics.tau, 7);
    
    const TI_3d = forecast3[3]?.TI || 0;
    const TI_7d = forecast7[7]?.TI || 0;
    
    const S_3d = 1 - (TI_3d / 100);
    const S_7d = 1 - (TI_7d / 100);
    
    const dose3d = roundDose(method, adjustedDose(dose_mg, S_3d, S_target));
    const dose7d = roundDose(method, adjustedDose(dose_mg, S_7d, S_target));
    
    setRecommendations({
      today: doseToday,
      day3: dose3d,
      day7: dose7d,
      targetSensitivity: Math.round(S_target * 100)
    });
  }, [method, currentDose, targetMode, targetBuzz, targetTI, currentMetrics, aucDays, usageProfile, metabolismAdj]);
  
  const handleCopyDose = (dose) => {
    navigator.clipboard.writeText(`${dose}mg`);
    toast.success('Dose copied to clipboard!');
  };
  
  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-white">Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="bg-[#141416] border-gray-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vape_dry">Vape (Dry Herb)</SelectItem>
              <SelectItem value="vape_cart">Vape (Cart)</SelectItem>
              <SelectItem value="smoke">Smoke</SelectItem>
              <SelectItem value="dab">Dab</SelectItem>
              <SelectItem value="edible">Edible</SelectItem>
              <SelectItem value="oil_sublingual">Oil (Sublingual)</SelectItem>
              <SelectItem value="oil_ingested">Oil (Ingested)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-white">Current Dose (mg)</Label>
          <Input
            type="number"
            step="1"
            placeholder="e.g. 50"
            value={currentDose}
            onChange={(e) => setCurrentDose(e.target.value)}
            className="bg-[#141416] border-gray-800 text-white"
          />
        </div>
      </div>
      
      {/* Target Selection */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={targetMode === 'buzz' ? 'default' : 'outline'}
            onClick={() => setTargetMode('buzz')}
            className={targetMode === 'buzz' ? 'bg-[#25A55F] hover:bg-[#1e8a4c]' : 'bg-[#141416] border-gray-800'}
          >
            Target Buzz
          </Button>
          <Button
            type="button"
            variant={targetMode === 'ti' ? 'default' : 'outline'}
            onClick={() => setTargetMode('ti')}
            className={targetMode === 'ti' ? 'bg-[#25A55F] hover:bg-[#1e8a4c]' : 'bg-[#141416] border-gray-800'}
          >
            Target TI
          </Button>
        </div>
        
        {targetMode === 'buzz' ? (
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-white">Target Buzz Level</Label>
              <span className="text-[#25A55F] font-semibold">{targetBuzz}/10</span>
            </div>
            <Slider
              value={[targetBuzz]}
              onValueChange={(val) => setTargetBuzz(val[0])}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-[#25A55F] [&_[role=slider]]:border-[#25A55F]"
            />
          </div>
        ) : (
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-white">Target Tolerance Index</Label>
              <span className="text-[#25A55F] font-semibold">{targetTI}</span>
            </div>
            <Slider
              value={[targetTI]}
              onValueChange={(val) => setTargetTI(val[0])}
              min={0}
              max={40}
              step={5}
              className="[&_[role=slider]]:bg-[#25A55F] [&_[role=slider]]:border-[#25A55F]"
            />
          </div>
        )}
      </div>
      
      {/* Recommendations */}
      {recommendations && (
        <div className="bg-[#141416] border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400 mb-1">
              To hit {targetMode === 'buzz' ? `Buzz ${targetBuzz}` : `TI ${targetTI}`}
              {' '}({recommendations.targetSensitivity}% sensitivity)
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <DoseCard
              label="Today"
              dose={recommendations.today}
              onCopy={() => handleCopyDose(recommendations.today)}
            />
            <DoseCard
              label="+3 days"
              dose={recommendations.day3}
              onCopy={() => handleCopyDose(recommendations.day3)}
            />
            <DoseCard
              label="+7 days"
              dose={recommendations.day7}
              onCopy={() => handleCopyDose(recommendations.day7)}
            />
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            These are estimates based on your tolerance pattern. Start low and adjust as needed.
          </p>
        </div>
      )}
    </div>
  );
}

function DoseCard({ label, dose, onCopy }) {
  return (
    <button
      onClick={onCopy}
      className="bg-[#0A0A0B] border border-gray-800 rounded-lg p-3 hover:border-[#25A55F] transition-all group"
    >
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-[#25A55F] mb-2">{dose}mg</div>
      <Copy className="w-3 h-3 text-gray-600 group-hover:text-[#25A55F] mx-auto" />
    </button>
  );
}