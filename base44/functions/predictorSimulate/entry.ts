import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Bioavailability multipliers (ng/mL per mg THC)
const METHOD_MULTIPLIERS = {
  vape_dry: 2.5,
  smoke: 2.5,
  dab: 3.5,           // Added: Dabs have higher bioavailability
  edible: 1.0,
  oil_sublingual: 1.5,
  unknown: 1.5
};

// Half-life by tolerance (minutes)
const HALF_LIFE = {
  first_time: 110,
  occasional: 90,
  frequent: 70
};

// Tolerance scale for buzz calculation
const TOLERANCE_SCALE = {
  first_time: 0.7,
  occasional: 0.9,
  frequent: 0.5
};

function expandDoses(doses) {
  const expanded = [];
  
  doses.forEach(dose => {
    // FIXED: Changed count > 1 to count >= 1, and loop to include all repeats
    // If count=1, this creates 2 doses total (original + 1 repeat)
    // If count=2, this creates 3 doses total (original + 2 repeats)
    if (dose.repeat && dose.repeat.count >= 1) {
      const baseTime = new Date(dose.timeISO);
      // Loop from 0 to count (inclusive) to create original + count repeats
      for (let i = 0; i <= dose.repeat.count; i++) {
        const offsetMs = i * dose.repeat.everyMinutes * 60 * 1000;
        expanded.push({
          ...dose,
          expandedTimeISO: new Date(baseTime.getTime() + offsetMs).toISOString()
        });
      }
    } else {
      expanded.push({
        ...dose,
        expandedTimeISO: dose.timeISO
      });
    }
  });
  
  return expanded;
}

function getWeightAdjustment(weightKg) {
  if (!weightKg) return 1.0;
  if (weightKg < 60) return 1.1;
  if (weightKg > 90) return 0.9;
  return 1.0;
}

function calculatePeak(dose, userFactors, uncertainty = 0) {
  const baseMultiplier = METHOD_MULTIPLIERS[dose.method] || METHOD_MULTIPLIERS.unknown;
  const multiplier = baseMultiplier * (1 + uncertainty);
  const weightAdj = getWeightAdjustment(userFactors.weightKg);
  
  return dose.doseMg * multiplier * weightAdj;
}

// Timing constants for realistic curves
const PEAK_DELAY = {
  vape_dry: 10,
  vape_cart: 10,
  smoke: 10,
  dab: 5,
  edible: 90,
  oil_ingested: 90,
  oil_sublingual: 45,
  unknown: 30
};

const ONSET_LAG = {
  edible: 30,
  oil_ingested: 30,
  oil_sublingual: 10,
  default: 0
};

function calculateCurrentTHC(peak, doseTime, evalTime, halfLife, method) {
  const elapsedMinutes = (evalTime.getTime() - doseTime.getTime()) / (1000 * 60);
  
  if (elapsedMinutes < 0) return 0;

  const peakTime = PEAK_DELAY[method] || PEAK_DELAY.unknown;
  const lag = ONSET_LAG[method] || ONSET_LAG.default;

  // Pre-onset
  if (elapsedMinutes < lag) return 0;

  // Rising phase
  if (elapsedMinutes < peakTime) {
    const duration = peakTime - lag;
    if (duration <= 0) return peak; // Should not happen if config is sane
    
    const progress = (elapsedMinutes - lag) / duration; // 0.0 to 1.0

    if (['edible', 'oil_ingested'].includes(method)) {
      // S-curve (Smoothstep) for edibles: slow start, steep middle, slow finish
      const curve = progress * progress * (3 - 2 * progress);
      return peak * curve;
    } else {
      // Inverted quadratic for inhaled: fast start, slows as it nears peak
      // f(x) = 1 - (1-x)^2
      const curve = 1 - Math.pow(1 - progress, 2);
      return peak * curve;
    }
  }

  // Decay phase
  const decayTime = elapsedMinutes - peakTime;
  return peak * Math.pow(0.5, decayTime / halfLife);
}

function calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, uncertainty = 0) {
  let total = 0;
  
  expandedDoses.forEach(dose => {
    const doseTime = new Date(dose.expandedTimeISO);
    const peak = calculatePeak(dose, userFactors, uncertainty);
    // Pass dose.method to curve calculator
    const current = calculateCurrentTHC(peak, doseTime, evalTime, halfLife, dose.method);
    total += current;
  });
  
  return Math.max(0, total);
}

function calculateBuzz(thc, maxPeak, tolerance) {
  if (maxPeak === 0) return 0;
  
  const buzzRaw = (thc / maxPeak) * 10;
  const scale = TOLERANCE_SCALE[tolerance] || 0.9;
  
  return Math.max(0, Math.min(10, buzzRaw * scale));
}

function findThresholdTime(expandedDoses, startTime, threshold, userFactors, halfLife, horizonHours) {
  const stepMs = 5 * 60 * 1000;
  const endTime = new Date(startTime.getTime() + horizonHours * 60 * 60 * 1000);
  
  let lastTimeAbove = null;
  let everExceeded = false;

  for (let time = startTime.getTime(); time <= endTime.getTime(); time += stepMs) {
    const evalTime = new Date(time);
    const thc = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, 0);
    
    if (thc > threshold) {
      lastTimeAbove = evalTime;
      everExceeded = true;
    }
  }
  
  if (everExceeded && lastTimeAbove) {
    // Return the time slice immediately following the last time it was above threshold
    return new Date(lastTimeAbove.getTime() + stepMs).toISOString();
  }
  
  return null;
}

function getDetectionWindows(tolerance, totalDoses) {
  const saliva = totalDoses > 3 
    ? "Likely detectable 24-72 hours"
    : "Likely detectable 12-36 hours";
  
  let urine;
  if (tolerance === 'first_time' || totalDoses <= 2) {
    urine = "Typical range: 1-3 days";
  } else if (tolerance === 'occasional' || totalDoses <= 10) {
    urine = "Typical range: 7-21 days";
  } else {
    urine = "Typical range: 30+ days";
  }
  
  return { saliva, urine };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isPremium) {
      return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      doses,
      userFactors,
      stepMinutes = 2,
      horizonHours = 48,
      uncertaintyPct = 15,
      thresholds = { blood: 1, saliva: 5 }
    } = body;

    if (!doses || !Array.isArray(doses) || doses.length === 0) {
      return Response.json({ error: 'Invalid doses array' }, { status: 400 });
    }

    if (!userFactors || !userFactors.tolerance) {
      return Response.json({ error: 'User factors required' }, { status: 400 });
    }

    const expandedDoses = expandDoses(doses);
    
    console.log('[predictorSimulate] Original doses:', doses.length);
    console.log('[predictorSimulate] Expanded doses:', expandedDoses.length);
    console.log('[predictorSimulate] Expanded times:', expandedDoses.map(d => d.expandedTimeISO));
    
    const baseHalfLife = HALF_LIFE[userFactors.tolerance] || HALF_LIFE.occasional;
    const metabolismFactor = 1 + (userFactors.metabolismAdjust || 0) / 100;
    const halfLife = baseHalfLife * metabolismFactor;
    
    const uncertaintyFactor = uncertaintyPct / 100;
    
    const allTimes = expandedDoses.map(d => new Date(d.expandedTimeISO).getTime());
    const startTime = new Date(Math.min(...allTimes));
    const endTime = new Date(startTime.getTime() + horizonHours * 60 * 60 * 1000);
    
    const series = [];
    const stepMs = stepMinutes * 60 * 1000;
    
    let maxTHC = 0;
    let maxTHCTime = startTime.toISOString();
    let maxPeakSingleDose = 0;
    
    expandedDoses.forEach(dose => {
      const peak = calculatePeak(dose, userFactors, 0);
      if (peak > maxPeakSingleDose) maxPeakSingleDose = peak;
    });
    
    for (let time = startTime.getTime(); time <= endTime.getTime(); time += stepMs) {
      const evalTime = new Date(time);
      
      const thcMedian = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, 0);
      const thcMin = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, -uncertaintyFactor);
      const thcMax = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, uncertaintyFactor);
      
      const buzzScore = calculateBuzz(thcMedian, maxPeakSingleDose, userFactors.tolerance);
      
      series.push({
        timeISO: evalTime.toISOString(),
        thcMedian: Math.round(thcMedian * 100) / 100,
        thcMin: Math.round(thcMin * 100) / 100,
        thcMax: Math.round(thcMax * 100) / 100,
        buzzScore: Math.round(buzzScore * 10) / 10
      });
      
      if (thcMedian > maxTHC) {
        maxTHC = thcMedian;
        maxTHCTime = evalTime.toISOString();
      }
    }
    
    // Calculate buzz at peak time (not current time)
    const peakBuzz = calculateBuzz(maxTHC, maxPeakSingleDose, userFactors.tolerance);
    
    const timeTo1ngMl = findThresholdTime(expandedDoses, startTime, thresholds.blood || 1, userFactors, halfLife, horizonHours);
    const timeTo5ngMl = findThresholdTime(expandedDoses, startTime, thresholds.saliva || 5, userFactors, halfLife, horizonHours);
    const soberTime = findThresholdTime(expandedDoses, startTime, 0.1, userFactors, halfLife, horizonHours);
    
    const keyMetrics = {
      peakTHC: Math.round(maxTHC * 10) / 10,
      peakTime: maxTHCTime,
      estimatedBuzz: Math.round(peakBuzz * 10) / 10,
      timeTo1ngMl,
      timeTo5ngMl,
      soberTime
    };
    
    const detectionWindows = getDetectionWindows(userFactors.tolerance, expandedDoses.length);
    
    return Response.json({
      series,
      keyMetrics,
      detectionWindows,
      paramsEcho: body
    });

  } catch (error) {
    console.error('Predictor simulation error:', error);
    return Response.json({ 
      error: error.message || 'Simulation failed' 
    }, { status: 500 });
  }
});