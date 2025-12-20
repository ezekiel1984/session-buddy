// Recalibrated THC metabolism model with realistic pharmacokinetics

// Half-life constants (in minutes) - adjusted for realistic clearance
const HALF_LIFE = {
  vape_dry: 120,        // 2 hours
  vape_cart: 120,       // 2 hours
  smoke: 120,           // 2 hours
  dab: 120,             // 2 hours
  oil_sublingual: 180,  // 3 hours
  oil_ingested: 300,    // 5 hours (slower clearance for oral)
  edible: 300           // 5 hours
};

// Peak delay (minutes until max blood concentration)
const PEAK_DELAY = {
  vape_dry: 10,
  vape_cart: 10,
  smoke: 10,
  dab: 5,
  oil_sublingual: 45,
  oil_ingested: 90,
  edible: 90
};

// Onset lag (minutes before any effect)
const ONSET_LAG = {
  edible: 30,
  oil_ingested: 30,
  oil_sublingual: 10,
  default: 0
};

// Tolerance modifiers
const TOLERANCE_THRESHOLDS = {
  low: 0.85,
  medium: 1.0,
  high: 1.20
};

// Thresholds for "sober" (mg)
const PHYSIOLOGICAL_SOBER_THRESHOLD = 0.5; // Minimal THC in blood
export const PERCEPTUAL_SOBER_THRESHOLD = 2.0; // When user FEELS sober

const METHOD_COMPATIBILITY_MAP = {
  'vape': 'vape_dry',
  'joint': 'smoke',
  'cone': 'smoke',
  'blunt': 'smoke',
  'oil': 'oil_sublingual',
  'capsule': 'oil_ingested'
};

const normalizeMethod = (method) => {
  return METHOD_COMPATIBILITY_MAP[method] || method;
};

// Calculate active THC using realistic pharmacokinetic curves
export const calculateActiveTHC = ({ method, dosageMg, startedAt }) => {
  const normalizedMethod = normalizeMethod(method);
  const halfLife = HALF_LIFE[normalizedMethod] || HALF_LIFE.vape_dry;
  const now = new Date();
  const start = new Date(startedAt);
  const timeElapsedMinutes = (now - start) / (1000 * 60);
  
  if (timeElapsedMinutes < 0) return 0;

  const peakDelay = PEAK_DELAY[normalizedMethod] || 15;
  const lag = ONSET_LAG[normalizedMethod] || (ONSET_LAG.default || 0);

  // Pre-onset
  if (timeElapsedMinutes < lag) return 0;

  // Rising phase
  if (timeElapsedMinutes < peakDelay) {
    const duration = peakDelay - lag;
    if (duration <= 0) return dosageMg;
    
    const progress = (timeElapsedMinutes - lag) / duration; // 0 to 1

    if (['edible', 'oil_ingested'].includes(normalizedMethod)) {
      // Smooth S-curve for slow onset methods
      const curve = progress * progress * (3 - 2 * progress);
      return dosageMg * curve;
    } else {
      // Fast rise (inverted quadratic) for inhaled methods
      // f(x) = 1 - (1-x)^2
      const curve = 1 - Math.pow(1 - progress, 2);
      
      // Floor at 10% so user sees *something* immediately after logging inhaled dose
      return dosageMg * Math.max(0.1, curve);
    }
  }
  
  // Decay phase
  const effectiveTime = timeElapsedMinutes - peakDelay;
  const activeTHC = dosageMg * Math.pow(0.5, effectiveTime / halfLife);
  
  return Math.max(0, activeTHC);
};

// Calculate cumulative active THC from multiple sessions
export const calculateCumulativeActiveTHC = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  
  let totalActiveTHC = 0;
  
  sessions.forEach(session => {
    const dosage = parseFloat(session.dosageMg) || 0;
    if (dosage === 0) return;
    
    const activeTHC = calculateActiveTHC({
      method: session.method || 'vape_dry',
      dosageMg: dosage,
      startedAt: session.startedAt
    });
    
    totalActiveTHC += activeTHC;
  });
  
  return totalActiveTHC;
};

// RECALIBRATED: Map active THC to buzz score with realistic scaling
export const calculateBuzzScore = ({ activeTHC, tolerance = 'medium' }) => {
  // Apply tolerance threshold multiplier
  const toleranceMultiplier = TOLERANCE_THRESHOLDS[tolerance] || 1.0;
  const adjustedTHC = activeTHC / toleranceMultiplier;
  
  let baseScore;
  
  // Recalibrated scale based on realistic pharmacokinetics:
  // 10-20mg → Buzz 3-5 (moderate)
  // 30-40mg → Buzz 7-9 (high)
  // >40mg → Buzz approaching 10 (very high)
  
  if (adjustedTHC < PHYSIOLOGICAL_SOBER_THRESHOLD) {
    baseScore = 0;
  } else if (adjustedTHC < 5) {
    // 0.5-5mg → 0.5-1.5 (light)
    baseScore = 0.5 + ((adjustedTHC - PHYSIOLOGICAL_SOBER_THRESHOLD) / (5 - PHYSIOLOGICAL_SOBER_THRESHOLD)) * 1.0;
  } else if (adjustedTHC < 10) {
    // 5-10mg → 1.5-2.5 (mild)
    baseScore = 1.5 + ((adjustedTHC - 5) / 5) * 1.0;
  } else if (adjustedTHC < 20) {
    // 10-20mg → 2.5-4.0 (noticeable)
    baseScore = 2.5 + ((adjustedTHC - 10) / 10) * 1.5;
  } else if (adjustedTHC < 40) {
    // 20-40mg → 4.0-6.0 (moderate)
    baseScore = 4.0 + ((adjustedTHC - 20) / 20) * 2.0;
  } else if (adjustedTHC < 70) {
    // 40-70mg → 6.0-8.0 (strong)
    baseScore = 6.0 + ((adjustedTHC - 40) / 30) * 2.0;
  } else if (adjustedTHC < 120) {
    // 70-120mg → 8.0-9.0 (very strong)
    baseScore = 8.0 + ((adjustedTHC - 70) / 50) * 1.0;
  } else if (adjustedTHC < 200) {
    // 120-200mg → 9.0-9.5 (extremely high)
    baseScore = 9.0 + ((adjustedTHC - 120) / 80) * 0.5;
  } else {
    // >200mg → 9.5-10.0 (off the charts, almost impossible)
    baseScore = 9.5 + Math.min(0.5, (adjustedTHC - 200) / 200 * 0.5);
  }
  
  // Return score capped between 0 and 10.0, rounded to 1 decimal
  return Math.max(0, Math.min(10, Math.round(baseScore * 10) / 10));
};

// Calculate cumulative buzz from multiple active sessions
export const calculateCumulativeBuzz = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  
  const totalActiveTHC = calculateCumulativeActiveTHC(sessions);
  const tolerance = sessions[0]?.tolerance || 'medium';
  
  return calculateBuzzScore({ activeTHC: totalActiveTHC, tolerance });
};

// Get buzz category label
export const getBuzzCategory = (buzzScore) => {
  if (buzzScore < 0.5) return { label: 'Sober', color: 'text-gray-400', bg: 'bg-gray-500/20' };
  if (buzzScore < 2.0) return { label: 'Barely Noticeable', color: 'text-gray-300', bg: 'bg-gray-500/10' };
  if (buzzScore < 3.5) return { label: 'Light Buzz', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  if (buzzScore < 5.5) return { label: 'Moderate Buzz', color: 'text-green-400', bg: 'bg-green-500/20' };
  if (buzzScore < 7.5) return { label: 'Strong Buzz', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  if (buzzScore < 9.0) return { label: 'Very High', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  return { label: 'Extremely High', color: 'text-red-400', bg: 'bg-red-500/20' };
};

// Calculate time until sober (active THC drops below threshold)
export const calculateTimeUntilSober = (sessions, thresholdMg = PERCEPTUAL_SOBER_THRESHOLD) => {
  if (!sessions || sessions.length === 0) return null;
  
  const now = new Date();
  let latestSoberTime = null;
  
  sessions.forEach(session => {
    // Calculate the current active THC from this session
    const currentActiveTHC = calculateActiveTHC({
      method: session.method || 'vape_dry',
      dosageMg: parseFloat(session.dosageMg) || 0,
      startedAt: session.startedAt
    });

    // If this session's THC is already below threshold, skip it
    if (currentActiveTHC <= thresholdMg) return;

    const normalizedMethod = normalizeMethod(session.method || 'vape_dry');
    const halfLife = HALF_LIFE[normalizedMethod] || HALF_LIFE.vape_dry;
    
    // Calculate remaining time for current active THC to decay below threshold
    // currentActiveTHC × (0.5)^(t / halfLife) = thresholdMg
    // Solve for t: t = halfLife × log₂(currentActiveTHC / thresholdMg)
    const remainingTimeMinutes = halfLife * (Math.log(currentActiveTHC / thresholdMg) / Math.log(2));
    const soberTime = new Date(now.getTime() + remainingTimeMinutes * 60 * 1000);
    
    if (!latestSoberTime || soberTime > latestSoberTime) {
      latestSoberTime = soberTime;
    }
  });
  
  return latestSoberTime || now;
};

// Calculate when peak buzz occurs for visualization
export const calculatePeakTime = (sessions) => {
  if (!sessions || sessions.length === 0) return null;
  
  const now = new Date();
  
  // Find the most recent session
  const mostRecentSession = sessions.reduce((latest, session) => {
    const sessionTime = new Date(session.startedAt);
    const latestTime = new Date(latest.startedAt);
    return sessionTime > latestTime ? session : latest;
  });
  
  const mostRecentTime = new Date(mostRecentSession.startedAt);
  
  // If the most recent session was logged less than 1 minute ago, use its peak time
  const timeSinceMostRecent = (now - mostRecentTime) / (1000 * 60);
  
  if (timeSinceMostRecent < 1) {
    // Very recent session - use its individual peak time
    const normalizedMethod = normalizeMethod(mostRecentSession.method || 'vape_dry');
    const peakDelay = PEAK_DELAY[normalizedMethod] || PEAK_DELAY.vape_dry;
    return new Date(mostRecentTime.getTime() + peakDelay * 60 * 1000);
  }
  
  // For older sessions, calculate cumulative peak
  const startTime = new Date(Math.min(...sessions.map(s => new Date(s.startedAt).getTime())));
  const endTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Look ahead 3 hours
  
  let maxTHC = 0;
  let peakTime = now;
  
  for (let time = startTime.getTime(); time <= endTime.getTime(); time += 5 * 60 * 1000) {
    const currentTime = new Date(time);
    let totalActiveTHC = 0;
    
    sessions.forEach(session => {
      const sessionStart = new Date(session.startedAt);
      if (currentTime < sessionStart) return;
      
      const dosage = parseFloat(session.dosageMg) || 0;
      const normalizedMethod = normalizeMethod(session.method || 'vape_dry');
      const halfLife = HALF_LIFE[normalizedMethod] || HALF_LIFE.vape_dry;
      const peakDelay = PEAK_DELAY[normalizedMethod] || PEAK_DELAY.vape_dry;
      
      const timeElapsedMinutes = (currentTime - sessionStart) / (1000 * 60);
      
      let activeTHC;
      if (timeElapsedMinutes < peakDelay) {
        const fractionToPeak = timeElapsedMinutes / peakDelay;
        let effectiveFraction = fractionToPeak;
        if (normalizedMethod === 'vape_dry' || normalizedMethod === 'vape_cart' || 
            normalizedMethod === 'smoke' || normalizedMethod === 'dab') {
          effectiveFraction = Math.max(fractionToPeak, 0.2);
        }
        activeTHC = dosage * effectiveFraction;
      } else {
        const effectiveTime = timeElapsedMinutes - peakDelay;
        activeTHC = dosage * Math.pow(0.5, effectiveTime / halfLife);
      }
      
      totalActiveTHC += Math.max(0, activeTHC);
    });
    
    if (totalActiveTHC > maxTHC) {
      maxTHC = totalActiveTHC;
      peakTime = currentTime;
    }
  }
  
  return peakTime;
};

// Generate buzz timeline data for visualization (last 6 hours)
export const generateBuzzTimeline = (sessions) => {
  if (!sessions || sessions.length === 0) return [];
  
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const dataPoints = [];
  
  for (let time = new Date(sixHoursAgo); time <= now; time = new Date(time.getTime() + 5 * 60 * 1000)) {
    let totalActiveTHC = 0;
    
    sessions.forEach(session => {
      const sessionStart = new Date(session.startedAt);
      
      if (time < sessionStart) return;
      
      const dosage = parseFloat(session.dosageMg) || 0;
      const normalizedMethod = normalizeMethod(session.method || 'vape_dry');
      const halfLife = HALF_LIFE[normalizedMethod] || HALF_LIFE.vape_dry;
      const peakDelay = PEAK_DELAY[normalizedMethod] || PEAK_DELAY.vape_dry;
      
      const timeElapsedMinutes = (time - sessionStart) / (1000 * 60);
      
      let activeTHC;
      if (timeElapsedMinutes < peakDelay) {
        const fractionToPeak = timeElapsedMinutes / peakDelay;
        let effectiveFraction = fractionToPeak;
        if (normalizedMethod === 'vape_dry' || normalizedMethod === 'vape_cart' || 
            normalizedMethod === 'smoke' || normalizedMethod === 'dab') {
          effectiveFraction = Math.max(fractionToPeak, 0.2);
        }
        activeTHC = dosage * effectiveFraction;
      } else {
        const effectiveTime = timeElapsedMinutes - peakDelay;
        activeTHC = dosage * Math.pow(0.5, effectiveTime / halfLife);
      }
      
      totalActiveTHC += Math.max(0, activeTHC);
    });
    
    const tolerance = sessions[0]?.tolerance || 'medium';
    const buzzScore = calculateBuzzScore({ activeTHC: totalActiveTHC, tolerance });
    
    dataPoints.push({
      time: time.toISOString(),
      buzzScore,
      activeTHC: totalActiveTHC
    });
  }
  
  return dataPoints;
};

// Legacy compatibility - calculate sober time for a single session
export const calculateSoberTime = ({ method, startedAt, dosageMg }) => {
  const normalizedMethod = normalizeMethod(method);
  const halfLife = HALF_LIFE[normalizedMethod] || HALF_LIFE.vape_dry;
  const peakDelay = PEAK_DELAY[normalizedMethod] || PEAK_DELAY.vape_dry;
  const start = new Date(startedAt);
  
  const timeToThreshold = peakDelay + halfLife * (Math.log(dosageMg / PHYSIOLOGICAL_SOBER_THRESHOLD) / Math.log(2));
  const soberAt = new Date(start.getTime() + timeToThreshold * 60 * 1000);
  
  return soberAt.toISOString();
};

// Combined function to get initial buzz info when logging
export const getBuzzAndSoberInfo = ({ method, dosageMg, startedAt, tolerance = 'medium' }) => {
  const dose = parseFloat(dosageMg) || 0;
  
  // Calculate initial buzz score (at peak)
  const initialBuzzScore = calculateBuzzScore({ 
    activeTHC: dose, 
    tolerance 
  });

  const soberAt = calculateSoberTime({
    method,
    startedAt,
    dosageMg: dose
  });

  return {
    initialBuzzScore,
    soberAt
  };
};

// Get default dosage for a method (legacy compatibility)
export const getDefaultDosage = (method) => {
  return 50; // Fallback value
};