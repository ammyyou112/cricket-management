export interface MatchPerformance {
  runs_scored?: number;
  wickets_taken?: number;
  catches?: number;
  match_date?: string;
  created_at?: string;
}

export interface FormAnalysis {
  rating: 'in-form' | 'average' | 'out-of-form' | 'unknown';
  label: string;
  color: string;
  score: number;
}

export interface TrendAnalysis {
  trend: 'improving' | 'declining' | 'stable';
  change: number; // percentage change
}

/**
 * Analyze player form based on recent matches
 * Scoring: runs/20 + wickets*5 + catches*2
 * Good performance: score >= 3
 */
export const analyzeForm = (recentMatches: MatchPerformance[]): FormAnalysis => {
  if (recentMatches.length === 0) {
    return { rating: 'unknown', label: 'No Data', color: 'gray', score: 0 };
  }

  // Calculate performance score for each match
  const scores = recentMatches.map(match => {
    const runs = match.runs_scored || 0;
    const wickets = match.wickets_taken || 0;
    const catches = match.catches || 0;
    // Scoring formula: runs/20 + wickets*5 + catches*2
    return (runs / 20) + (wickets * 5) + (catches * 2);
  });

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const goodPerformances = scores.filter(s => s >= 3).length;
  const totalMatches = recentMatches.length;

  // Determine form rating
  if (goodPerformances >= Math.ceil(totalMatches * 0.6)) {
    // 60% or more good performances = In Form
    return { 
      rating: 'in-form', 
      label: 'In Form', 
      color: 'green',
      score: avgScore
    };
  } else if (goodPerformances >= Math.ceil(totalMatches * 0.3)) {
    // 30-59% good performances = Average
    return { 
      rating: 'average', 
      label: 'Average', 
      color: 'orange',
      score: avgScore
    };
  } else {
    // Less than 30% good performances = Out of Form
    return { 
      rating: 'out-of-form', 
      label: 'Out of Form', 
      color: 'red',
      score: avgScore
    };
  }
};

/**
 * Detect performance trend by comparing first half vs second half
 * Returns: 'improving', 'declining', or 'stable'
 */
export const detectTrend = (stats: MatchPerformance[]): TrendAnalysis => {
  if (stats.length < 3) {
    return { trend: 'stable', change: 0 };
  }

  const firstHalf = stats.slice(0, Math.floor(stats.length / 2));
  const secondHalf = stats.slice(Math.floor(stats.length / 2));

  // Calculate average performance score for each half
  const calculateAvgScore = (matches: MatchPerformance[]) => {
    if (matches.length === 0) return 0;
    const scores = matches.map(m => {
      const runs = m.runs_scored || 0;
      const wickets = m.wickets_taken || 0;
      const catches = m.catches || 0;
      return (runs / 20) + (wickets * 5) + (catches * 2);
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const avgFirst = calculateAvgScore(firstHalf);
  const avgSecond = calculateAvgScore(secondHalf);

  if (avgFirst === 0) {
    return { trend: 'stable', change: 0 };
  }

  const change = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (change > 20) {
    return { trend: 'improving', change };
  } else if (change < -20) {
    return { trend: 'declining', change };
  } else {
    return { trend: 'stable', change };
  }
};

/**
 * Calculate streak of consecutive good/bad performances
 * Returns: { type: 'good' | 'bad', count: number }
 */
export const calculateStreak = (matches: MatchPerformance[]): { type: 'good' | 'bad' | 'none'; count: number } => {
  if (matches.length === 0) {
    return { type: 'none', count: 0 };
  }

  // Calculate score for each match
  const scores = matches.map(match => {
    const runs = match.runs_scored || 0;
    const wickets = match.wickets_taken || 0;
    const catches = match.catches || 0;
    return (runs / 20) + (wickets * 5) + (catches * 2);
  });

  // Check from most recent match backwards
  const mostRecentScore = scores[scores.length - 1];
  const isGood = mostRecentScore >= 3;

  let streakCount = 1;
  for (let i = scores.length - 2; i >= 0; i--) {
    const currentIsGood = scores[i] >= 3;
    if (currentIsGood === isGood) {
      streakCount++;
    } else {
      break;
    }
  }

  if (isGood) {
    return { type: 'good', count: streakCount };
  } else {
    return { type: 'bad', count: streakCount };
  }
};

/**
 * Get performance indicator for a single match
 */
export const getMatchPerformanceIndicator = (match: MatchPerformance): {
  isGood: boolean;
  score: number;
  label: string;
} => {
  const runs = match.runs_scored || 0;
  const wickets = match.wickets_taken || 0;
  const catches = match.catches || 0;
  const score = (runs / 20) + (wickets * 5) + (catches * 2);
  
  const isGood = score >= 3;
  let label = 'Poor';
  
  if (score >= 5) {
    label = 'Excellent';
  } else if (score >= 3) {
    label = 'Good';
  } else if (score >= 1.5) {
    label = 'Average';
  }

  return { isGood, score, label };
};

