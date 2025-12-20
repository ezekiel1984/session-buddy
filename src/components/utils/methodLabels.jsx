// Method display labels and utilities for Session Buddy

export const METHOD_LABELS = {
  vape_dry: {
    emoji: '💨',
    label: 'Vape (Dry Herb)',
    shortLabel: 'Vape Dry'
  },
  vape_cart: {
    emoji: '🔋',
    label: 'Vape (Oil Cart)',
    shortLabel: 'Vape Cart'
  },
  smoke: {
    emoji: '🔥',
    label: 'Smoke',
    shortLabel: 'Smoke'
  },
  dab: {
    emoji: '💎',
    label: 'Dab / Concentrate',
    shortLabel: 'Dab'
  },
  oil_sublingual: {
    emoji: '💧',
    label: 'Oil / Tincture (Sublingual)',
    shortLabel: 'Oil (Sub)'
  },
  oil_ingested: {
    emoji: '🧴',
    label: 'Oil / Capsule (Ingested)',
    shortLabel: 'Oil (Ing)'
  },
  edible: {
    emoji: '🍪',
    label: 'Edible',
    shortLabel: 'Edible'
  },
  // Legacy compatibility
  vape: {
    emoji: '💨',
    label: 'Vape',
    shortLabel: 'Vape'
  },
  joint: {
    emoji: '🔥',
    label: 'Joint',
    shortLabel: 'Joint'
  },
  cone: {
    emoji: '🔥',
    label: 'Cone',
    shortLabel: 'Cone'
  },
  blunt: {
    emoji: '🔥',
    label: 'Blunt',
    shortLabel: 'Blunt'
  },
  oil: {
    emoji: '💧',
    label: 'Oil',
    shortLabel: 'Oil'
  },
  capsule: {
    emoji: '🧴',
    label: 'Capsule',
    shortLabel: 'Capsule'
  }
};

export const getMethodLabel = (method, useShort = false) => {
  const methodData = METHOD_LABELS[method];
  if (!methodData) {
    return method; // Fallback to raw method name
  }
  return useShort ? methodData.shortLabel : methodData.label;
};

export const getMethodEmoji = (method) => {
  const methodData = METHOD_LABELS[method];
  return methodData?.emoji || '💨';
};

export const getMethodDisplay = (method, includeEmoji = true) => {
  const emoji = getMethodEmoji(method);
  const label = getMethodLabel(method);
  return includeEmoji ? `${emoji} ${label}` : label;
};