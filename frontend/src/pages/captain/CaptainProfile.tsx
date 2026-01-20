import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats } from '../../hooks/usePlayer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import AIInsights from '../../components/player/AIInsights';

interface StatsSummary {
  totalMatches: number;
  totalRuns: number;
  totalWickets: number;
  totalCatches: number;
  totalFours: number;
  totalSixes: number;
  totalRunsConceded: number;
  totalOversBowled: number;
}

const CaptainProfile = () => {
  const { user } = useAuth();
  const { data: playerStats, isLoading: statsLoading } = usePlayerStats(user?.id);
  const [stats, setStats] = useState<StatsSummary>({
    totalMatches: 0,
    totalRuns: 0,
    totalWickets: 0,
    totalCatches: 0,
    totalFours: 0,
    totalSixes: 0,
    totalRunsConceded: 0,
    totalOversBowled: 0,
  });

  useEffect(() => {
    if (playerStats && Array.isArray(playerStats)) {
      const summary: StatsSummary = {
        totalMatches: playerStats.length,
        totalRuns: playerStats.reduce((sum, s) => sum + (s.runs_scored || 0), 0),
        totalWickets: playerStats.reduce((sum, s) => sum + (s.wickets_taken || 0), 0),
        totalCatches: playerStats.reduce((sum, s) => sum + (s.catches || 0), 0),
        totalFours: playerStats.reduce((sum, s) => sum + (s.fours || 0), 0),
        totalSixes: playerStats.reduce((sum, s) => sum + (s.sixes || 0), 0),
        totalRunsConceded: playerStats.reduce((sum, s) => sum + (s.runs_conceded || 0), 0),
        totalOversBowled: playerStats.reduce((sum, s) => sum + (parseFloat(String(s.overs_bowled || 0))), 0),
      };
      setStats(summary);
    }
  }, [playerStats]);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Playing Performance</h1>
        <p className="text-gray-600">View your personal cricket statistics and AI-powered insights</p>
      </div>

      {/* Career Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Career Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">{stats.totalMatches}</div>
              <div className="text-sm text-gray-600 mt-1">Matches</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-700">{stats.totalRuns}</div>
              <div className="text-sm text-gray-600 mt-1">Runs</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{stats.totalWickets}</div>
              <div className="text-sm text-gray-600 mt-1">Wickets</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-700">{stats.totalCatches}</div>
              <div className="text-sm text-gray-600 mt-1">Catches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Batting Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Runs</span>
                <span className="font-bold">{stats.totalRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fours</span>
                <span className="font-bold">{stats.totalFours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sixes</span>
                <span className="font-bold">{stats.totalSixes}</span>
              </div>
              {stats.totalMatches > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Average</span>
                  <span className="font-bold">{(stats.totalRuns / stats.totalMatches).toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Bowling Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Wickets</span>
                <span className="font-bold">{stats.totalWickets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Runs Conceded</span>
                <span className="font-bold">{stats.totalRunsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overs Bowled</span>
                <span className="font-bold">{stats.totalOversBowled.toFixed(1)}</span>
              </div>
              {stats.totalOversBowled > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Economy</span>
                  <span className="font-bold">{(stats.totalRunsConceded / stats.totalOversBowled).toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Insights */}
      {user?.id && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">AI Performance Insights</h2>
          <AIInsights playerId={user.id} />
        </div>
      )}
    </div>
  );
};

export default CaptainProfile;

