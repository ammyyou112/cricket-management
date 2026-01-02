import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import type { Match, Team } from '@/types/api.types';

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading match data for:', id);
        
        // Load match details
        const matchData = await matchService.getById(id);
        console.log('✅ Match loaded:', matchData);
        setMatch(matchData);
        
        // Try to get teams from match data first (if backend includes them)
        if (matchData.teamA && matchData.teamB) {
          setTeamA(matchData.teamA);
          setTeamB(matchData.teamB);
        } else {
          // Load team details separately
          const [teamAData, teamBData] = await Promise.all([
            teamService.getById(matchData.teamAId).catch(() => null),
            teamService.getById(matchData.teamBId).catch(() => null),
          ]);
          
          console.log('✅ Teams loaded:', { teamA: teamAData, teamB: teamBData });
          if (teamAData) setTeamA(teamAData);
          if (teamBData) setTeamB(teamBData);
        }
        
      } catch (err: any) {
        console.error('❌ Failed to load match:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Match Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This match does not exist'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const teamAName = teamA?.name || teamA?.teamName || 'Team A';
  const teamBName = teamB?.name || teamB?.teamName || 'Team B';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Match Header */}
      <div className="bg-white p-8 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                match.status === 'LIVE' ? 'bg-red-100 text-red-800 animate-pulse' :
                match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                match.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {match.status}
              </span>
              <span className="text-sm text-gray-600">{match.matchType || 'LEAGUE'}</span>
            </div>
            <h1 className="text-3xl font-bold">Match Details</h1>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-6">
          {/* Team A */}
          <div className="flex-1 text-center">
            {teamA?.logoUrl ? (
              <img src={teamA.logoUrl} alt={teamAName} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl mx-auto mb-3">🏏</div>
            )}
            <h2 className="text-2xl font-bold">{teamAName}</h2>
            {teamA?.city && <p className="text-gray-600">{teamA.city}</p>}
          </div>

          <div className="text-4xl font-bold text-gray-400 px-8">VS</div>

          {/* Team B */}
          <div className="flex-1 text-center">
            {teamB?.logoUrl ? (
              <img src={teamB.logoUrl} alt={teamBName} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center text-4xl mx-auto mb-3">🏏</div>
            )}
            <h2 className="text-2xl font-bold">{teamBName}</h2>
            {teamB?.city && <p className="text-gray-600">{teamB.city}</p>}
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
          <div>
            <span className="font-semibold">📍 Venue:</span> {match.venue}
          </div>
          <div>
            <span className="font-semibold">📅 Date:</span> {new Date(match.matchDate).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Match Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Match Statistics</h2>
        <div className="text-center py-8 text-gray-500">
          {match.status === 'COMPLETED' ? 'Match completed' : match.status === 'LIVE' ? 'Match in progress...' : 'Match not started yet'}
        </div>
      </div>
    </div>
  );
}

