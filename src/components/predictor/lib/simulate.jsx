// Pure simulation logic for THC prediction
// No dependencies on existing app logic - completely self-contained

// Bioavailability multipliers (ng/mL per mg THC)
const METHOD_MULTIPLIERS = {
  vape_dry: 2.5,
  smoke: 2.5,
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

// Expand doses with repeats
function expandDoses(doses) {
  const expanded = [];
  
  doses.forEach(dose => {
    if (dose.repeat && dose.repeat.count > 1) {
      const baseTime = new Date(dose.timeISO);
      for (let i = 0; i < dose.repeat.count; i++) {
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

// Weight adjustment
function getWeightAdjustment(weightKg) {
  if (!weightKg) return 1.0;
  if (weightKg < 60) return 1.1;
  if (weightKg > 90) return 0.9;
  return 1.0;
}

// Calculate peak THC for a single dose
function calculatePeak(dose, userFactors, uncertainty = 0) {
  const baseMultiplier = METHOD_MULTIPLIERS[dose.method] || METHOD_MULTIPLIERS.unknown;
  const multiplier = baseMultiplier * (1 + uncertainty);
  const weightAdj = getWeightAdjustment(userFactors.weightKg);
  
  return dose.doseMg * multiplier * weightAdj;
}

// Calculate current THC from a dose at evaluation time
function calculateCurrentTHC(peak, doseTime, evalTime, halfLife) {
  const elapsedMinutes = (evalTime.getTime() - doseTime.getTime()) / (1000 * 60);
  
  if (elapsedMinutes < 0) return 0;
  
  // Exponential decay: current = peak × 0.5^(elapsed / halfLife)
  return peak * Math.pow(0.5, elapsedMinutes / halfLife);
}

// Calculate total THC at a specific time
function calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, uncertainty = 0) {
  let total = 0;
  
  expandedDoses.forEach(dose => {
    const doseTime = new Date(dose.expandedTimeISO);
    const peak = calculatePeak(dose, userFactors, uncertainty);
    const current = calculateCurrentTHC(peak, doseTime, evalTime, halfLife);
    total += current;
  });
  
  return Math.max(0, total);
}

// Calculate buzz score
function calculateBuzz(thc, maxPeak, tolerance) {
  if (maxPeak === 0) return 0;
  
  const buzzRaw = (thc / maxPeak) * 10;
  const scale = TOLERANCE_SCALE[tolerance] || 0.9;
  
  return Math.max(0, Math.min(10, buzzRaw * scale));
}

// Find time when THC drops below threshold
function findThresholdTime(expandedDoses, startTime, threshold, userFactors, halfLife, horizonHours) {
  const stepMs = 5 * 60 * 1000; // 5 minute steps
  const endTime = new Date(startTime.getTime() + horizonHours * 60 * 60 * 1000);
  
  for (let time = startTime.getTime(); time <= endTime.getTime(); time += stepMs) {
    const evalTime = new Date(time);
    const thc = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, 0);
    
    if (thc <= threshold) {
      return evalTime.toISOString();
    }
  }
  
  return null;
}

// Get detection window estimates
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

// Main simulation function
export function runSimulation(params) {
  const {
    doses,
    userFactors,
    stepMinutes = 2,
    horizonHours = 48,
    uncertaintyPct = 15,
    thresholds = { blood: 1, saliva: 5 }
  } = params;
  
  // Expand repeated doses
  const expandedDoses = expandDoses(doses);
  
  // Get half-life with optional metabolism adjustment
  const baseHalfLife = HALF_LIFE[userFactors.tolerance] || HALF_LIFE.occasional;
  const metabolismFactor = 1 + (userFactors.metabolismAdjust || 0) / 100;
  const halfLife = baseHalfLife * metabolismFactor;
  
  // Calculate uncertainty range
  const uncertaintyFactor = uncertaintyPct / 100;
  
  // Find start and end times
  const allTimes = expandedDoses.map(d => new Date(d.expandedTimeISO).getTime());
  const startTime = new Date(Math.min(...allTimes));
  const endTime = new Date(startTime.getTime() + horizonHours * 60 * 60 * 1000);
  
  // Generate time series
  const series = [];
  const stepMs = stepMinutes * 60 * 1000;
  
  let maxTHC = 0;
  let maxTHCTime = startTime.toISOString();
  let maxPeakSingleDose = 0;
  
  // Calculate max peak for buzz scaling
  expandedDoses.forEach(dose => {
    const peak = calculatePeak(dose, userFactors, 0);
    if (peak > maxPeakSingleDose) maxPeakSingleDose = peak;
  });
  
  // Generate timeline
  for (let time = startTime.getTime(); time <= endTime.getTime(); time += stepMs) {
    const evalTime = new Date(time);
    
    const thcMedian = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, 0);
    const thcMin = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, -uncertaintyFactor);
    const thcMax = calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLife, uncertaintyFactor);
    
    const buzzScore = calculateBuzz(thcMedian, maxPeakSingleDose, userFactors.tolerance);
    
    series.push({
      timeISO: evalTime.toISOString(),
      thcMedian,
      thcMin,
      thcMax,
      buzzScore
    });
    
    if (thcMedian > maxTHC) {
      maxTHC = thcMedian;
      maxTHCTime = evalTime.toISOString();
    }
  }
  
  // Calculate key metrics
  const now = new Date();
  const currentTHC = calculateTotalTHC(expandedDoses, now, userFactors, halfLife, 0);
  const currentBuzz = calculateBuzz(currentTHC, maxPeakSingleDose, userFactors.tolerance);
  
  const timeTo1ngMl = findThresholdTime(expandedDoses, startTime, thresholds.blood || 1, userFactors, halfLife, horizonHours);
  const timeTo5ngMl = findThresholdTime(expandedDoses, startTime, thresholds.saliva || 5, userFactors, halfLife, horizonHours);
  const soberTime = findThresholdTime(expandedDoses, startTime, 0.1, userFactors, halfLife, horizonHours);
  
  const keyMetrics = {
    peakTHC: Math.round(maxTHC * 10) / 10,
    peakTime: maxTHCTime,
    currentTHC: Math.round(currentTHC * 10) / 10,
    estimatedBuzz: Math.round(currentBuzz * 10) / 10,
    timeTo1ngMl,
    timeTo5ngMl,
    soberTime
  };
  
  const detectionWindows = getDetectionWindows(userFactors.tolerance, expandedDoses.length);
  
  return {
    series,
    keyMetrics,
    detectionWindows,
    paramsEcho: params
  };
}