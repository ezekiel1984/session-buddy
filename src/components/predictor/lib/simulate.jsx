// Pure simulation logic for THC prediction
// Uses Bateman pharmacokinetic model (first-order absorption + first-order elimination)
// Produces natural rise-to-peak then exponential decay curves per dose

// Method-specific pharmacokinetic parameters
// multiplier: bioavailability factor (ng/mL per mg THC)
// ka: absorption rate constant (per minute) — higher = faster onset
const METHOD_PARAMS = {
  vape_dry:       { multiplier: 2.5, ka: 0.50 },  // Fast inhalation, peak ~8 min
  vape_cart:      { multiplier: 2.5, ka: 0.50 },
  smoke:          { multiplier: 2.5, ka: 0.50 },
  dab:            { multiplier: 3.0, ka: 0.80 },  // Very fast, concentrated, peak ~5 min
  edible:         { multiplier: 1.0, ka: 0.020 }, // Slow oral absorption, peak ~90 min
  oil_sublingual: { multiplier: 1.5, ka: 0.10 },  // Moderate sublingual, peak ~30 min
  oil_ingested:   { multiplier: 1.0, ka: 0.025 }, // Slow oral, peak ~80 min
  unknown:        { multiplier: 1.5, ka: 0.10 },
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

// Expand doses with repeats into individual dose instances
// UI convention: count = number of REPEATS (not total doses)
// Total instances = 1 (original) + count (repeats) = count + 1
function expandDoses(doses) {
  const expanded = [];

  doses.forEach(dose => {
    const baseTime = new Date(dose.timeISO);

    if (dose.repeat && dose.repeat.count >= 1 && dose.repeat.everyMinutes > 0) {
      const totalInstances = dose.repeat.count + 1; // original + repeats
      for (let i = 0; i < totalInstances; i++) {
        const offsetMs = i * dose.repeat.everyMinutes * 60 * 1000;
        const instanceTime = new Date(baseTime.getTime() + offsetMs).toISOString();
        expanded.push({
          method: dose.method,
          doseMg: dose.doseMg,
          expandedTimeISO: instanceTime,
          isRepeat: i > 0
        });
      }
    } else {
      expanded.push({
        method: dose.method,
        doseMg: dose.doseMg,
        expandedTimeISO: dose.timeISO,
        isRepeat: false
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

// Calculate peak THC concentration for a single dose
function calculatePeak(dose, userFactors, uncertainty = 0) {
  const params = METHOD_PARAMS[dose.method] || METHOD_PARAMS.unknown;
  const multiplier = params.multiplier * (1 + uncertainty);
  const weightAdj = getWeightAdjustment(userFactors.weightKg);
  return dose.doseMg * multiplier * weightAdj;
}

// Calculate THC from a single dose at evaluation time using Bateman equation
// C(t) = peak * (e^{-ke*t} - e^{-ka*t}) / (e^{-ke*tmax} - e^{-ka*tmax})
// Produces a natural rise from 0 to peak, then exponential decay
function calculateCurrentTHC(peak, doseTime, evalTime, halfLifeMinutes, ka) {
  const elapsed = (evalTime.getTime() - doseTime.getTime()) / (1000 * 60); // minutes
  if (elapsed < 0) return 0;

  const ke = Math.log(2) / halfLifeMinutes; // elimination rate constant

  // If ka ≈ ke, fall back to simple decay to avoid division by zero
  if (Math.abs(ka - ke) < 1e-6) {
    return Math.max(0, peak * Math.exp(-ke * elapsed));
  }

  // Time of peak concentration for the Bateman function
  const tMax = Math.log(ka / ke) / (ka - ke);
  const cMax = Math.exp(-ke * tMax) - Math.exp(-ka * tMax);

  if (cMax <= 0 || !isFinite(cMax)) return 0;

  const raw = Math.exp(-ke * elapsed) - Math.exp(-ka * elapsed);
  return Math.max(0, peak * raw / cMax);
}

// Calculate total THC at a specific time (sum of all dose contributions)
function calculateTotalTHC(expandedDoses, evalTime, userFactors, halfLifeMinutes, uncertainty = 0) {
  let total = 0;

  expandedDoses.forEach(dose => {
    const doseTime = new Date(dose.expandedTimeISO);
    const peak = calculatePeak(dose, userFactors, uncertainty);
    const params = METHOD_PARAMS[dose.method] || METHOD_PARAMS.unknown;
    const current = calculateCurrentTHC(peak, doseTime, evalTime, halfLifeMinutes, params.ka);
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

// Find time when THC drops below threshold (searches from peak onwards)
function findThresholdTime(series, threshold) {
  if (!series || series.length === 0) return null;

  // Find the peak
  let peakIndex = 0;
  let peakVal = -1;
  for (let i = 0; i < series.length; i++) {
    if (series[i].thcMedian > peakVal) {
      peakVal = series[i].thcMedian;
      peakIndex = i;
    }
  }

  // If peak never exceeds threshold, no crossing to find
  if (peakVal <= threshold) return null;

  // Scan forward from peak for when THC drops below threshold
  for (let i = peakIndex; i < series.length; i++) {
    if (series[i].thcMedian <= threshold) {
      return series[i].timeISO;
    }
  }

  return null; // Never drops below within the horizon
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

  // Expand repeated doses into individual instances
  const expandedDoses = expandDoses(doses);

  // Get half-life with optional metabolism adjustment
  const baseHalfLife = HALF_LIFE[userFactors.tolerance] || HALF_LIFE.occasional;
  const metabolismFactor = 1 + (userFactors.metabolismAdjust || 0) / 100;
  const halfLife = baseHalfLife * metabolismFactor;

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

  // Generate timeline with rise-and-fall curves per dose
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

  // Calculate maximum buzz across the simulated timeline (peak of the session)
  const maxBuzz = series.reduce((max, s) => (s.buzzScore > max ? s.buzzScore : max), 0);

  // Find threshold crossing times (from peak onwards)
  const timeTo1ngMl = findThresholdTime(series, thresholds.blood || 1);
  const timeTo5ngMl = findThresholdTime(series, thresholds.saliva || 5);
  const soberTime = findThresholdTime(series, 0.1);

  const keyMetrics = {
    peakTHC: Math.round(maxTHC * 10) / 10,
    peakTime: maxTHCTime,
    estimatedBuzz: Math.round(maxBuzz * 10) / 10,
    timeTo1ngMl,
    timeTo5ngMl,
    soberTime
  };

  const detectionWindows = getDetectionWindows(userFactors.tolerance, expandedDoses.length);

  return {
    series,
    keyMetrics,
    detectionWindows,
    expandedDoses,
    paramsEcho: params
  };
}