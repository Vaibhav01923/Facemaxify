/**
 * Calculate percentile based on overall score
 * A score of 77 = top 2% (98th percentile)
 * 
 * Percentile mapping based on normal distribution:
 * - 90+ = Top 0.1% (99.9th percentile)
 * - 85-89 = Top 0.5% (99.5th percentile)
 * - 80-84 = Top 1% (99th percentile)
 * - 77-79 = Top 2% (98th percentile)
 * - 74-76 = Top 5% (95th percentile)
 * - 70-73 = Top 10% (90th percentile)
 * - 65-69 = Top 20% (80th percentile)
 * - 60-64 = Top 30% (70th percentile)
 * - 55-59 = Top 40% (60th percentile)
 * - 50-54 = Top 50% (50th percentile)
 * - 45-49 = Top 60% (40th percentile)
 * - 40-44 = Top 70% (30th percentile)
 * - 35-39 = Top 80% (20th percentile)
 * - 30-34 = Top 90% (10th percentile)
 * - <30 = Bottom 10% (<10th percentile)
 */
export const calculatePercentile = (score: number): number => {
  if (score >= 90) return 99.9;
  if (score >= 85) return 99.5;
  if (score >= 80) return 99.0;
  if (score >= 77) return 98.0;
  if (score >= 74) return 95.0;
  if (score >= 70) return 90.0;
  if (score >= 65) return 80.0;
  if (score >= 60) return 70.0;
  if (score >= 55) return 60.0;
  if (score >= 50) return 50.0;
  if (score >= 45) return 40.0;
  if (score >= 40) return 30.0;
  if (score >= 35) return 20.0;
  if (score >= 30) return 10.0;
  
  // For scores below 30, calculate linearly
  return Math.max(0, (score / 30) * 10);
};

/**
 * Get percentile description text
 */
export const getPercentileText = (percentile: number): string => {
  if (percentile >= 99.9) return "Top 0.1%";
  if (percentile >= 99.5) return "Top 0.5%";
  if (percentile >= 99.0) return "Top 1%";
  if (percentile >= 98.0) return "Top 2%";
  if (percentile >= 95.0) return "Top 5%";
  if (percentile >= 90.0) return "Top 10%";
  if (percentile >= 80.0) return "Top 20%";
  if (percentile >= 70.0) return "Top 30%";
  if (percentile >= 60.0) return "Top 40%";
  if (percentile >= 50.0) return "Top 50%";
  if (percentile >= 40.0) return "Top 60%";
  if (percentile >= 30.0) return "Top 70%";
  if (percentile >= 20.0) return "Top 80%";
  if (percentile >= 10.0) return "Top 90%";
  return "Bottom 10%";
};
