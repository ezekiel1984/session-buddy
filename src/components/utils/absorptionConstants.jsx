// Extraction/delivery factors for "Delivered estimate" toggle
// Represents the percentage of total THC that actually gets delivered to user
export const EXTRACTION_FACTORS = {
  vape_dry: 0.65,      // Dry herb vape: 65% extraction efficiency
  vape_cart: 0.55,     // Oil cart: 55% delivery
  smoke: 0.35,         // Smoking: 35% delivery (combustion loss)
  dab: 0.75,           // Dabs: 75% delivery
  oil_sublingual: 0.80, // Sublingual: 80% delivery
  oil_ingested: 0.80,   // Ingested oil: 80% delivery
  edible: 1.00          // Edibles: 100% (label mg is the dose)
};

// Bioavailability constants (kept for backward compatibility)
export const ABSORPTION_FACTORS = {
  vape_dry: 0.20,
  vape_cart: 0.30,
  smoke: 0.25,
  dab: 0.40,
  oil_sublingual: 0.35,
  oil_ingested: 0.15,
  edible: 0.15
};

// Default THC percentages by product type
export const DEFAULT_THC_PERCENTAGES = {
  flower: 20,           // 5-35% range
  concentrate: 75,      // 50-99% range
  vape_oil: 80          // 60-95% range
};

// Default strengths for oils/tinctures
export const DEFAULT_OIL_STRENGTH = 10; // mg/mL, range 1-30

// Conversion constants
export const CONVERSION_FACTORS = {
  grams_to_mg: 1000,
  
  // Capsule sizes for dry herb vape
  capsule_small: 0.10,
  capsule_standard: 0.12,
  capsule_heavy: 0.15,
  
  // Cone sizes for smoking
  cone_small: 0.10,
  cone_standard: 0.15,
  cone_fat: 0.20,
  
  // Joint sizes for smoking
  joint_half: 0.25,
  joint_standard: 0.50,
  joint_fat: 0.75,
  
  // Puff vapor mass (mg of vapor, not THC)
  puff_small: 3,
  puff_medium: 5,
  puff_large: 7,
  
  // Cart oil density (g/mL)
  cart_density: 0.9,
  
  // Drop size for tinctures
  drop_size_ml: 0.05
};

// Per-method tolerance multiplier bounds
export const TOLERANCE_BOUNDS = {
  min: 0.6,
  max: 1.6,
  default: 1.0
};

// Validation ranges
export const VALIDATION_RANGES = {
  thc_flower: { min: 5, max: 35 },
  thc_concentrate: { min: 50, max: 99 },
  thc_cart: { min: 60, max: 95 },
  oil_strength: { min: 1, max: 30 },
  grams: { min: 0.01, max: 1.00 },
  ml: { min: 0.01, max: 1.00 },
  dab_grams: { min: 0.01, max: 0.25 },
  cart_ml: { min: 0.01, max: 0.20 },
  edible_mg: { min: 1, max: 200 },
  caps_count: { min: 0.5, max: 3 },
  cones_count: { min: 1, max: 5 },
  joints_count: { min: 0.5, max: 3 },
  puffs_count: { min: 1, max: 50 },
  drops_count: { min: 1, max: 40 }
};

// Helper to safely parse numbers, defaulting to 0 if invalid or missing
const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Calculate THC from raw inputs with optional delivered estimate
export const calculateTHC = ({ method, rawInput, useDelivered = false }) => {
  let totalTHCmg = 0;
  
  switch (method) {
    case 'vape_dry': {
      // Input: { capsCount, capsuleSize, thcPercent } OR { grams, thcPercent }
      const capsCount = safeParseFloat(rawInput.capsCount);
      const capsuleSize = safeParseFloat(rawInput.capsuleSize);
      const grams = safeParseFloat(rawInput.grams);
      const thcPercent = safeParseFloat(rawInput.thcPercent, DEFAULT_THC_PERCENTAGES.flower);
      
      const finalGrams = grams || (capsCount * capsuleSize);
      totalTHCmg = finalGrams * CONVERSION_FACTORS.grams_to_mg * (thcPercent / 100);
      break;
    }
    
    case 'smoke': {
      // Input: { count, size, unit: 'cones'|'joints'|'grams', thcPercent } OR { grams, thcPercent }
      const count = safeParseFloat(rawInput.count);
      const size = safeParseFloat(rawInput.size);
      const grams = safeParseFloat(rawInput.grams);
      const thcPercent = safeParseFloat(rawInput.thcPercent, DEFAULT_THC_PERCENTAGES.flower);
      
      let finalGrams = grams;
      if (!grams && rawInput.unit === 'cones') {
        finalGrams = count * size;
      } else if (!grams && rawInput.unit === 'joints') {
        finalGrams = count * size;
      }
      totalTHCmg = finalGrams * CONVERSION_FACTORS.grams_to_mg * (thcPercent / 100);
      break;
    }
    
    case 'dab': {
      // Input: { grams, thcPercent }
      const grams = safeParseFloat(rawInput.grams);
      const thcPercent = safeParseFloat(rawInput.thcPercent, DEFAULT_THC_PERCENTAGES.concentrate);
      totalTHCmg = grams * CONVERSION_FACTORS.grams_to_mg * (thcPercent / 100);
      break;
    }
    
    case 'vape_cart': {
      // Input: { puffs, puffMass, density, thcPercent } OR { ml, density, thcPercent }
      const puffs = safeParseFloat(rawInput.puffs);
      const puffMass = safeParseFloat(rawInput.puffMass);
      const ml = safeParseFloat(rawInput.ml);
      const density = safeParseFloat(rawInput.density, CONVERSION_FACTORS.cart_density);
      const thcPercent = safeParseFloat(rawInput.thcPercent, DEFAULT_THC_PERCENTAGES.vape_oil);
      
      let finalMl = ml;
      if (!ml && puffs) {
        const vaporGrams = (puffs * puffMass) / 1000;
        finalMl = vaporGrams / density;
      }
      totalTHCmg = finalMl * density * 1000 * (thcPercent / 100);
      break;
    }
    
    case 'edible': {
      // Input: { labelMg }
      const labelMg = safeParseFloat(rawInput.labelMg);
      totalTHCmg = labelMg;
      break;
    }
    
    case 'oil_sublingual':
    case 'oil_ingested': {
      // Input: { ml, mgPerMl } OR { drops, dropSize, mgPerMl }
      const ml = safeParseFloat(rawInput.ml);
      const drops = safeParseFloat(rawInput.drops);
      const dropSize = safeParseFloat(rawInput.dropSize, CONVERSION_FACTORS.drop_size_ml);
      const mgPerMl = safeParseFloat(rawInput.mgPerMl, DEFAULT_OIL_STRENGTH);
      
      const finalMl = ml || (drops * dropSize);
      totalTHCmg = finalMl * mgPerMl;
      break;
    }
  }
  
  // Ensure totalTHCmg is valid and non-negative
  if (isNaN(totalTHCmg) || totalTHCmg < 0) {
    totalTHCmg = 0;
  }
  
  // Calculate delivered if requested
  let deliveredMg = null;
  if (useDelivered) {
    const extractionFactor = EXTRACTION_FACTORS[method] || 1.0;
    deliveredMg = Math.round(totalTHCmg * extractionFactor * 10) / 10;
  }
  
  // Calculate uncertainty (±10% for delivered, ±15% for total)
  const uncertainty = useDelivered && deliveredMg 
    ? Math.round(deliveredMg * 0.10)
    : Math.round(totalTHCmg * 0.15);
  
  return {
    totalTHCMg: Math.round(totalTHCmg * 10) / 10,
    deliveredMg: deliveredMg,
    uncertainty: uncertainty,
    extractionFactor: EXTRACTION_FACTORS[method]
  };
};

// Get method-specific tooltip text
export const getMethodTooltip = (method) => {
  const tooltips = {
    vape_dry: "We estimate mg from capsule weight × THC%. Heavy cap ≈ 0.15 g. Adjust potency in Advanced.",
    smoke: "Cones/joints are converted to grams × THC%. Smoking is less efficient; use 'Delivered' for a realistic buzz estimate.",
    dab: "Concentrate mg = grams × THC%. Default potency 75%.",
    vape_cart: "Based on approximate vaporised amount and oil potency. You can switch to mL and set density in Advanced.",
    edible: "We use the packet's labelled mg.",
    oil_sublingual: "Dose = mL × mg/mL (or drops × drop size).",
    oil_ingested: "Dose = mL × mg/mL (or drops × drop size)."
  };
  return tooltips[method] || "We estimate mg from amount × potency. Adjust strain potency/strength in Advanced for accuracy.";
};