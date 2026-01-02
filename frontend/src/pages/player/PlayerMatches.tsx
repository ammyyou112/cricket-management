import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import type { Match, Team } from '@/types/api.types';

export default function PlayerMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const teamsData = await teamService.getMyTeams();
        const teams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        setMyTeams(teams);
        
        const matchesData = await matchService.getAll();
        const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
        
        const teamIds = teams.map(t => t.id);
        const playerMatches = allMatches.filter(m => 
          teamIds.includes(m.teamAId) || teamIds.includes(m.teamBId)
        );
        
        console.log('✅ Player matches loaded:', playerMatches.length);
        setMatches(playerMatches);
        
      } catch (err: any) {
        console.error('❌ Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Matches</h1>
        <p className="text-gray-600">Your upcoming and past matches</p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏏</div>
          <p className="text-gray-500">No matches scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => {
            const teamAName = match.teamA?.name || match.teamA?.teamName || 'Team A';
            const teamBName = match.teamB?.name || match.teamB?.teamName || 'Team B';
            return (
              <div key={match.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/matches/${match.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{teamAName} vs {teamBName}</h3>
                    <p className="text-sm text-gray-600">{match.venue} • {new Date(match.matchDate).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    match.status === 'LIVE' ? 'bg-red-100 text-red-800' :
                    match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {match.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

