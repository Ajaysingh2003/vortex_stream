export const getMaxGb = (plan: string): number => {
  switch (plan.toLowerCase()) {
    case 'free':
      return 0.5;
    case 'starter':
      return 10;
    case 'pro':
      return 100; 
    case 'business':
      return 1000; 
    default:
      return 0.5; 
  }
};



export const getStorageUsagePercent = (usedBytes: number, maxGb: number): number => {
  // 1. Unlimited plan (-1) always shows 0% or low usage
  if (maxGb <= -1) {
    return 0;
  }

  // 2. Prevent division by zero if maxGb is invalid/0
  if (maxGb <= 0) {
    return 100;
  }

  // 3. Convert maxGb to Bytes (1 GB = 1024 * 1024 * 1024 Bytes)
  const maxBytes = maxGb * 1024 * 1024 * 1024;

  // 4. Calculate percentage
  const percentage = (usedBytes / maxBytes) * 100;

  // 5. Cap at 100% and round to 1 decimal place (or 0 for integer)
  const clampedPercentage = Math.min(percentage, 100);

  return Math.round(clampedPercentage * 10) / 10; // e.g. 75.4%
};