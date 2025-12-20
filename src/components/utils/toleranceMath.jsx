// Tolerance calculation utilities for Session Buddy
// Based on cannabinoid receptor desensitization research

// FIXED: Made tolerance calculation less aggressive
// Previous scaling was too steep, now uses more gradual thresholds

/**
 * Calculate tolerance index from AUC (Area Under Curve) data
 * AUC represents total THC exposure over time
 * Returns tolerance on 0-100 scale
 */
export const calculateToleranceIndex = (aucDays) => {
  if (!aucDays || aucDays.length === 0) return 0;

  // Calculate 7-day and 21-day averages
  const last7Days = aucDays.slice(-7);
  const last21Days = aucDays.slice(-21);
  
  const avg7d = last7Days.reduce((sum, d) => sum + d.auc, 0) / last7Days.length;
  const avg21d = last21Days.reduce((sum, d) => sum + d.auc, 0) / last21Days.length;

  // FIXED: More gradual scaling - previous thresholds were too sensitive
  // Old thresholds pushed users to 99-100 too easily
  // New thresholds:
  // - Light use (<100mg/day avg): 0-40
  // - Moderate use (100-250mg/day): 40-70
  // - Heavy use (>250mg/day): 70-100
  
  let toleranceScore = 0;
  
  // Weight recent usage more heavily (70% last 7 days, 30% last 21 days)
  const weightedAvg = (avg7d * 0.7) + (avg21d * 0.3);
  
  // FIXED: More realistic thresholds based on actual cannabis consumption patterns
  if (weightedAvg < 50) {
    // Very light use: 0-20
    toleranceScore = (weightedAvg / 50) * 20;
  } else if (weightedAvg < 100) {
    // Light use: 20-40
    toleranceScore = 20 + ((weightedAvg - 50) / 50) * 20;
  } else if (weightedAvg < 175) {
    // Moderate use: 40-60
    toleranceScore = 40 + ((weightedAvg - 100) / 75) * 20;
  } else if (weightedAvg < 250) {
    // Heavy use: 60-80
    toleranceScore = 60 + ((weightedAvg - 175) / 75) * 20;
  } else if (weightedAvg < 350) {
    // Very heavy use: 80-95
    toleranceScore = 80 + ((weightedAvg - 250) / 100) * 15;
  } else {
    // Extreme use: 95-100 (capped)
    toleranceScore = Math.min(100, 95 + ((weightedAvg - 350) / 150) * 5);
  }

  return Math.round(Math.max(0, Math.min(100, toleranceScore)));
};

/**
 * Get tolerance category label and color
 */
export const getToleranceCategory = (index) => {
  if (index < 30) return { label: 'Low', color: 'text-green-400' };
  if (index < 60) return { label: 'Moderate', color: 'text-yellow-400' };
  if (index < 85) return { label: 'High', color: 'text-orange-400' };
  return { label: 'Very High', color: 'text-red-400' };
};

/**
 * Alias for getToleranceCategory (used by ToleranceGauge component)
 */
export const getTICategory = getToleranceCategory;

/**
 * FIXED: Calculate sensitivity percentage (inverse of tolerance)
 * Now shows more realistic range instead of always being near minimum
 */
export const calculateSensitivity = (toleranceIndex) => {
  // Sensitivity = 100% - (tolerance influence)
  // FIXED: Less aggressive curve - old formula compressed too much
  // Old: sensitivity = 100 - toleranceIndex (linear, too harsh)
  // New: logarithmic curve that's more forgiving
  
  if (toleranceIndex < 30) {
    // Low tolerance: 80-100% sensitivity
    return Math.round(100 - (toleranceIndex / 30) * 20);
  } else if (toleranceIndex < 60) {
    // Moderate tolerance: 60-80% sensitivity
    return Math.round(80 - ((toleranceIndex - 30) / 30) * 20);
  } else if (toleranceIndex < 85) {
    // High tolerance: 40-60% sensitivity
    return Math.round(60 - ((toleranceIndex - 60) / 25) * 20);
  } else {
    // Very high tolerance: 20-40% sensitivity
    return Math.round(40 - ((toleranceIndex - 85) / 15) * 20);
  }
};

/**
 * Calculate current tolerance metrics for today
 * Returns { TI, S, tau } where:
 * - TI = Tolerance Index (0-100)
 * - S = Sensitivity (0-1 decimal)
 * - tau = Time constant for recovery (days)
 */
export const toleranceToday = ({ aucDays, usageProfile = 'frequent', metabolismAdj = 0 }) => {
  const TI = calculateToleranceIndex(aucDays);
  const sensitivityPercent = calculateSensitivity(TI);
  const S = sensitivityPercent / 100; // Convert to 0-1 scale
  
  // Calculate tau (recovery time constant) based on usage profile
  // Frequent users take longer to recover
  let baseTau = 14; // Base recovery half-life in days
  
  if (usageProfile === 'first') {
    baseTau = 7; // First-timers recover faster
  } else if (usageProfile === 'occasional') {
    baseTau = 10;
  } else if (usageProfile === 'frequent') {
    baseTau = 14;
  }
  
  // Adjust tau based on metabolism (faster metabolism = faster recovery)
  const metabolismFactor = 1 - (metabolismAdj / 100); // -20% to +20% becomes 1.2 to 0.8
  const tau = baseTau * metabolismFactor;
  
  return { TI, S, tau };
};

/**
 * Forecast tolerance index over time with no new consumption
 * Returns array of { day, TI } objects
 */
export const forecastTI = (currentTI, tau, days) => {
  const forecast = [];
  
  for (let day = 0; day <= days; day++) {
    // Exponential decay: TI(t) = TI₀ × e^(-t/τ)
    const TI = currentTI * Math.exp(-day / tau);
    forecast.push({
      day,
      TI: Math.max(0, TI) // Ensure non-negative
    });
  }
  
  return forecast;
};

/**
 * Calculate milestone days for tolerance recovery
 * Returns { toModerate, toBaseline, toFullReset }
 */
export const calculateMilestones = (currentTI, tau) => {
  if (currentTI < 5) {
    return { toModerate: 0, toBaseline: 0, toFullReset: 0 };
  }
  
  // Calculate days to reach each threshold using exponential decay formula
  // TI(t) = TI₀ × e^(-t/τ)
  // Solve for t: t = -τ × ln(TI_target / TI₀)
  
  const toModerate = currentTI > 25 ? Math.ceil(-tau * Math.log(25 / currentTI)) : 0;
  const toBaseline = currentTI > 10 ? Math.ceil(-tau * Math.log(10 / currentTI)) : 0;
  const toFullReset = currentTI > 5 ? Math.ceil(-tau * Math.log(5 / currentTI)) : 0;
  
  return {
    toModerate: Math.max(0, toModerate),
    toBaseline: Math.max(0, toBaseline),
    toFullReset: Math.max(0, toFullReset)
  };
};

/**
 * Estimate days to reduce tolerance by 50%
 */
export const estimateRecoveryDays = (toleranceIndex, aucDays) => {
  if (toleranceIndex < 30) return 3; // Low tolerance recovers quickly
  
  const last7Days = aucDays.slice(-7);
  const avgDailyExposure = last7Days.reduce((sum, d) => sum + d.auc, 0) / last7Days.length;
  
  // FIXED: More realistic recovery timelines
  // CB1 receptor upregulation research suggests 2-4 weeks for significant recovery
  
  if (avgDailyExposure < 100) {
    return Math.round(toleranceIndex / 10); // Light users: ~7-10 days
  } else if (avgDailyExposure < 250) {
    return Math.round(toleranceIndex / 5); // Moderate users: ~14-20 days  
  } else {
    return Math.round(toleranceIndex / 3.5); // Heavy users: ~21-28 days
  }
};

/**
 * Calculate target sensitivity from desired buzz score
 * Used by DoseAdjuster to determine what sensitivity is needed for target buzz
 */
export const targetSensitivityFromBuzz = (buzzScore) => {
  // This is a simplified inverse of the buzz calculation
  // Higher buzz needs higher sensitivity (lower tolerance)
  // Scale: buzz 1-10 maps to sensitivity 0.3-1.0
  const minS = 0.3; // Minimum sensitivity at buzz 10
  const maxS = 1.0; // Maximum sensitivity at buzz 1
  
  // Linear interpolation
  return maxS - ((buzzScore - 1) / 9) * (maxS - minS);
};

/**
 * Calculate adjusted dose needed to achieve target sensitivity
 */
export const adjustedDose = (baseDose, currentSensitivity, targetSensitivity) => {
  // If target sensitivity is higher (lower tolerance), need less dose
  // If target sensitivity is lower (higher tolerance), need more dose
  return baseDose * (currentSensitivity / targetSensitivity);
};

/**
 * Round dose to appropriate precision based on method
 */
export const roundDose = (method, dose) => {
  if (method === 'edible' || method === 'oil_ingested' || method === 'oil_sublingual') {
    // For edibles/oils, round to nearest 5mg
    return Math.round(dose / 5) * 5;
  } else if (method === 'dab') {
    // For dabs, round to nearest mg
    return Math.round(dose);
  } else {
    // For other methods, round to nearest 5mg
    return Math.round(dose / 5) * 5;
  }
};

/**
 * Calculate recommended dose adjustment factor
 */
export const getDoseAdjustmentFactor = (currentTolerance, targetTolerance) => {
  const toleranceDiff = currentTolerance - targetTolerance;
  
  // Suggest reducing dose proportionally to tolerance difference
  if (toleranceDiff > 20) {
    return 0.7; // Reduce by 30%
  } else if (toleranceDiff > 10) {
    return 0.85; // Reduce by 15%
  } else if (toleranceDiff > 0) {
    return 0.95; // Reduce by 5%
  } else {
    return 1.0; // No change needed
  }
};

/**
 * Generate tolerance recovery projection
 */
export const projectToleranceRecovery = (currentIndex, days) => {
  const projection = [];
  
  // Model exponential decay with half-life of ~14 days for moderate users
  // FIXED: More realistic decay rate
  const decayRate = 0.05; // Was too aggressive before
  
  for (let day = 0; day <= days; day++) {
    const recoveredIndex = currentIndex * Math.exp(-decayRate * day);
    projection.push({
      day,
      toleranceIndex: Math.round(Math.max(0, recoveredIndex))
    });
  }
  
  return projection;
};

/**
 * Get user-friendly interpretation of tolerance state
 */
export const getToleranceInterpretation = (index) => {
  if (index < 30) {
    return {
      title: "Low Tolerance",
      description: "You're sensitive to THC. Small doses will have noticeable effects.",
      recommendation: "Start low and go slow. Track your sweet spot."
    };
  } else if (index < 60) {
    return {
      title: "Moderate Tolerance",
      description: "Your body has adapted somewhat to regular THC exposure.",
      recommendation: "Consider your frequency and dosing patterns. You may benefit from occasional breaks."
    };
  } else if (index < 85) {
    return {
      title: "High Tolerance",
      description: "Significant receptor adaptation has occurred. You need larger doses for the same effect.",
      recommendation: "Consider a tolerance break or reducing frequency to restore sensitivity."
    };
  } else {
    return {
      title: "Very High Tolerance",
      description: "Your endocannabinoid system has adapted substantially to frequent exposure.",
      recommendation: "A tolerance break (1-4 weeks) can significantly restore your sensitivity and reduce costs."
    };
  }
};