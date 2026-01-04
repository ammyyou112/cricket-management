/**
 * AI Insights Component
 * Displays AI-powered performance analytics for players
 */

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2, Trophy, Target, RefreshCw, Share2 } from 'lucide-react';
import { aiService, AnalysisResponse } from '@/services/ai.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AIInsightsProps {
  playerId: string;
}

export default function AIInsights({ playerId }: AIInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, [playerId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🔍 Requesting fresh AI analysis...', new Date().toISOString());
      const result: AnalysisResponse = await aiService.getPlayerAnalysis(playerId);
      
      console.log('📊 Fresh analysis received:', {
        timestamp: new Date().toISOString(),
        trend: result.data?.trend,
        summaryPreview: result.data?.summary?.substring(0, 50)
      });
      
      if (result.success && result.data) {
        setData(result.data);
      } else if (result.matchesPlayed !== undefined) {
        // Not enough matches
        setData({ matchesPlayed: result.matchesPlayed });
      } else {
        setError(result.error || 'Failed to load analysis');
      }
    } catch (err: any) {
      console.error('Failed to load AI insights:', err);
      if (err.message?.includes('Not enough matches') || err.matchesPlayed !== undefined) {
        setData({ matchesPlayed: err.matchesPlayed || 0 });
      } else {
        setError(err.message || 'Failed to load analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  // EARLY RETURN 1: Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-gray-600 font-medium">Analyzing your performance...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // EARLY RETURN 2: Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={loadAnalysis}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Retry Analysis
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // EARLY RETURN 3: Not enough matches
  if (!data || !data.trend || (data.matchesPlayed !== undefined && data.matchesPlayed < 3)) {
    const matchesPlayed = data?.matchesPlayed || 0;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Start Your Cricket Journey!
              </h3>
              <p className="text-blue-700 mb-4">
                Play at least 3 matches to unlock AI-powered performance insights
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{matchesPlayed}/3 matches</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min((matchesPlayed / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-blue-600 font-semibold">
                {matchesPlayed === 0 && '🎯 Play your first match to start!'}
                {matchesPlayed > 0 && matchesPlayed < 3 && `${3 - matchesPlayed} more match(es) to unlock! 🎯`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MAIN RETURN: Success state with enhanced UI
  const getTrendIcon = () => {
    if (data.trend === 'IMPROVING') return <TrendingUp className="w-6 h-6 text-green-600" />;
    if (data.trend === 'DECLINING') return <TrendingDown className="w-6 h-6 text-red-600" />;
    return <Minus className="w-6 h-6 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (data.trend === 'IMPROVING') return 'bg-green-50 border-green-200 text-green-800';
    if (data.trend === 'DECLINING') return 'bg-red-50 border-red-200 text-red-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Performance Insights
          </CardTitle>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Powered by Gemini AI
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Analysis of your last {data.matchesAnalyzed || 'recent'} matches
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trend with better visuals */}
        <div className={`p-5 rounded-lg border-2 ${getTrendColor()}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-white flex-shrink-0">
              {getTrendIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">
                {data.trend === 'IMPROVING' && '📈 Performance Improving'}
                {data.trend === 'DECLINING' && '📉 Needs Attention'}
                {data.trend === 'STABLE' && '➡️ Consistent Performance'}
              </h3>
              <p className="text-sm leading-relaxed">{data.summary}</p>
            </div>
          </div>
        </div>

        {/* Improvement Tips - Enhanced */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-blue-600">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-lg text-blue-900">
              Personalized Recommendations
            </h3>
          </div>
          
          <div className="space-y-3">
            {data.suggestions?.map((tip: string, index: number) => (
              <div key={index} className="flex gap-3 p-4 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={loadAnalysis}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
