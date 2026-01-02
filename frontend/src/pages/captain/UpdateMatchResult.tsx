import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import { useAuth } from '@/hooks/useAuth';
import type { Match, Team } from '@/types/api.types';

export default function UpdateMatchResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState({
    teamAScore: '',
    teamBScore: '',
    teamAWickets: '',
    teamBWickets: '',
    teamAOvers: '',
    teamBOvers: '',
    winnerId: '',
    status: 'COMPLETED' as 'COMPLETED' | 'CANCELLED',
  });

  useEffect(() => {
    const loadMatch = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const matchData = await matchService.getById(id);
        setMatch(matchData);

        const [teamAData, teamBData] = await Promise.all([
          teamService.getById(matchData.teamAId),
          teamService.getById(matchData.teamBId),
        ]);

        setTeamA(teamAData);
        setTeamB(teamBData);

        // Check if captain is authorized
        if (user?.role === 'CAPTAIN') {
          const teamAName = teamAData.name || teamAData.teamName || '';
          const teamBName = teamBData.name || teamBData.teamName || '';
          if (teamAData.captainId !== user.id && teamBData.captainId !== user.id) {
            setError('You are not the captain of either team');
          }
        }

      } catch (err: any) {
        console.error('Failed to load match:', err);
        setError('Failed to load match details');
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !match) return;

    // Validation
    if (!result.teamAScore || !result.teamBScore) {
      setError('Please enter scores for both teams');
      return;
    }

    if (!result.winnerId) {
      setError('Please select the winner');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log('🔵 Updating match result:', result);

      // Update match with result
      await matchService.update(id, {
        status: result.status,
        winnerTeamId: result.winnerId === 'TIE' ? undefined : result.winnerId,
      });

      console.log('✅ Match result updated');
      alert('Match result updated successfully!');
      navigate(`/matches/${id}`);

    } catch (err: any) {
      console.error('❌ Failed to update result:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update match result');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const teamAName = teamA?.name || teamA?.teamName || 'Team A';
  const teamBName = teamB?.name || teamB?.teamName || 'Team B';

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Update Match Result</h1>
        <p className="text-gray-600">Enter the final scores and result</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        {/* Match Info */}
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {teamA?.logoUrl && <img src={teamA.logoUrl} alt={teamAName} className="w-10 h-10 rounded-full" />}
              <span className="font-bold text-lg">{teamAName}</span>
            </div>
            <span className="text-gray-400 font-bold">VS</span>
            <div className="flex items-center gap-2">
              {teamB?.logoUrl && <img src={teamB.logoUrl} alt={teamBName} className="w-10 h-10 rounded-full" />}
              <span className="font-bold text-lg">{teamBName}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Team A Score */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{teamAName} Score</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Runs *</label>
                <input
                  type="number"
                  value={result.teamAScore}
                  onChange={(e) => setResult({ ...result, teamAScore: e.target.value })}
                  placeholder="150"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Wickets</label>
                <input
                  type="number"
                  value={result.teamAWickets}
                  onChange={(e) => setResult({ ...result, teamAWickets: e.target.value })}
                  placeholder="7"
                  min="0"
                  max="10"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Overs</label>
                <input
                  type="number"
                  step="0.1"
                  value={result.teamAOvers}
                  onChange={(e) => setResult({ ...result, teamAOvers: e.target.value })}
                  placeholder="20.0"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Team B Score */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{teamBName} Score</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Runs *</label>
                <input
                  type="number"
                  value={result.teamBScore}
                  onChange={(e) => setResult({ ...result, teamBScore: e.target.value })}
                  placeholder="145"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Wickets</label>
                <input
                  type="number"
                  value={result.teamBWickets}
                  onChange={(e) => setResult({ ...result, teamBWickets: e.target.value })}
                  placeholder="10"
                  min="0"
                  max="10"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Overs</label>
                <input
                  type="number"
                  step="0.1"
                  value={result.teamBOvers}
                  onChange={(e) => setResult({ ...result, teamBOvers: e.target.value })}
                  placeholder="20.0"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Winner Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Match Winner *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="winner"
                  value={teamA?.id || ''}
                  checked={result.winnerId === teamA?.id}
                  onChange={(e) => setResult({ ...result, winnerId: e.target.value })}
                  className="w-4 h-4"
                  required
                />
                <span className="font-medium">{teamAName} Won</span>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="winner"
                  value={teamB?.id || ''}
                  checked={result.winnerId === teamB?.id}
                  onChange={(e) => setResult({ ...result, winnerId: e.target.value })}
                  className="w-4 h-4"
                  required
                />
                <span className="font-medium">{teamBName} Won</span>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="winner"
                  value="TIE"
                  checked={result.winnerId === 'TIE'}
                  onChange={(e) => setResult({ ...result, winnerId: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="font-medium">Match Tied</span>
              </label>
            </div>
          </div>

          {/* Match Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Match Status</label>
            <select
              value={result.status}
              onChange={(e) => setResult({ ...result, status: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving Result...' : 'Save Match Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

