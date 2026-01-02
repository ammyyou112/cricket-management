import { TrendingUp, TrendingDown, Minus, Flame, Wind, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { analyzeForm, detectTrend, getMatchPerformanceIndicator } from '@/lib/formAnalysis';
import { PlayerStats } from '@/types/database.types';

interface MatchData {
  match_date?: string;
  venue?: string;
  tournament_id?: string;
}

interface PlayerStatsWithMatch extends PlayerStats {
  matches?: MatchData;
}

interface RecentFormProps {
  recentMatches: PlayerStatsWithMatch[];
  limit?: number;
}

export const RecentForm = ({ recentMatches, limit = 5 }: RecentFormProps) => {
  // Sort by date (most recent first) and take limit
  const sortedMatches = [...recentMatches]
    .sort((a, b) => {
      const dateA = a.matches?.match_date || a.created_at || '';
      const dateB = b.matches?.match_date || b.created_at || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, limit);

  if (sortedMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No match data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const form = analyzeForm(sortedMatches);
  const trend = detectTrend(sortedMatches);

  // Prepare chart data (reverse for chronological order in chart)
  const chartData = [...sortedMatches].reverse().map((match, index) => ({
    match: index + 1,
    runs: match.runs_scored || 0,
    wickets: match.wickets_taken || 0,
    catches: match.catches || 0,
  }));

  const getFormIcon = () => {
    switch (form.rating) {
      case 'in-form':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'out-of-form':
        return <Wind className="h-4 w-4 text-blue-400" />;
      default:
        return <Zap className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendIcon = () => {
    switch (trend.trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFormBadgeVariant = () => {
    switch (form.rating) {
      case 'in-form':
        return 'default' as const;
      case 'out-of-form':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Form (Last {limit} Matches)</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getFormBadgeVariant()}>
              {getFormIcon()}
              <span className="ml-1">{form.label}</span>
            </Badge>
            {getTrendIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Runs Trend Chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Runs per Match</p>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="match" 
                tick={{ fontSize: 10 }}
                stroke="#888888"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                stroke="#888888"
              />
              <RechartsTooltip />
              <Line 
                type="monotone" 
                dataKey="runs" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wickets Trend Chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Wickets per Match</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="match" 
                tick={{ fontSize: 10 }}
                stroke="#888888"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                stroke="#888888"
                allowDecimals={false}
              />
              <RechartsTooltip />
              <Bar 
                dataKey="wickets" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Match-by-match breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Last {limit} Performances:</p>
          <div className="grid grid-cols-5 gap-2">
            {sortedMatches.map((match, index) => {
              const performance = getMatchPerformanceIndicator(match);
              const isGood = performance.isGood;
              
              return (
                <div
                  key={match.id || index}
                  className={`p-2 rounded text-center text-xs transition-colors ${
                    isGood 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="font-bold">
                    {match.runs_scored || 0}r
                  </div>
                  <div className="text-[10px] mt-0.5">
                    {match.wickets_taken || 0}w
                  </div>
                  {match.catches > 0 && (
                    <div className="text-[10px] mt-0.5">
                      {match.catches}c
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend description */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">
            {trend.trend === 'improving' && (
              <>📈 Your performance is improving! Keep it up! ({Math.abs(trend.change).toFixed(0)}% better)</>
            )}
            {trend.trend === 'declining' && (
              <>📉 Your form has dipped slightly. Time to practice! ({Math.abs(trend.change).toFixed(0)}% lower)</>
            )}
            {trend.trend === 'stable' && (
              <>➡️ Your performance is consistent. Maintain this level!</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

