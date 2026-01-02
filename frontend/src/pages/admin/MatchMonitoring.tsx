import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import type { Match, Team } from '@/types/api.types';

export default function MatchMonitoring() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');

  const loadMatches = async () => {
    try {
      setLoading(true);
      
      // Load matches
      const matchesData = await matchService.getAll();
      const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || matchesData.matches || []);
      console.log('✅ Matches loaded:', allMatches.length);
      setMatches(allMatches);
      
      // Load teams for name lookup
      const teamsData = await teamService.getAll();
      const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
      
      // Create team lookup map
      const teamMap: Record<string, Team> = {};
      allTeams.forEach(team => {
        teamMap[team.id] = team;
      });
      console.log('✅ Teams loaded for lookup:', allTeams.length);
      setTeams(teamMap);
      
    } catch (err: any) {
      console.error('❌ Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const filteredMatches = filter === 'ALL' 
    ? matches 
    : matches.filter(m => m.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Match Monitoring</h1>
          <p className="text-gray-600">Monitor all cricket matches</p>
        </div>
        <button
          onClick={() => navigate('/admin/schedule-match')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Schedule Match
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'LIVE', 'SCHEDULED', 'COMPLETED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status} {status === 'ALL' ? `(${matches.length})` : `(${matches.filter(m => m.status === status).length})`}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏏</div>
          <h3 className="text-2xl font-semibold mb-2">No Matches Found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'ALL' ? 'Schedule your first match' : `No ${filter.toLowerCase()} matches`}
          </p>
          {filter === 'ALL' && (
            <button
              onClick={() => navigate('/admin/schedule-match')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Schedule Match
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMatches.map((match) => {
            const teamA = teams[match.teamAId] || match.teamA;
            const teamB = teams[match.teamBId] || match.teamB;
            const teamAName = teamA?.name || teamA?.teamName || 'Team A';
            const teamBName = teamB?.name || teamB?.teamName || 'Team B';
            
            return (
              <div
                key={match.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/matches/${match.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      {/* Team A */}
                      <div className="flex items-center gap-2 flex-1">
                        {teamA?.logoUrl ? (
                          <img src={teamA.logoUrl} alt={teamAName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">🏏</div>
                        )}
                        <span className="font-bold text-lg">{teamAName}</span>
                      </div>
                      
                      <span className="text-gray-400 font-bold text-xl">VS</span>
                      
                      {/* Team B */}
                      <div className="flex items-center gap-2 flex-1">
                        {teamB?.logoUrl ? (
                          <img src={teamB.logoUrl} alt={teamBName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">🏏</div>
                        )}
                        <span className="font-bold text-lg">{teamBName}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      📍 {match.venue} • 📅 {new Date(match.matchDate).toLocaleString()} • 🏆 {match.matchType || 'LEAGUE'}
                    </p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded text-sm font-medium ml-4 ${
                    match.status === 'LIVE' ? 'bg-red-100 text-red-800 animate-pulse' :
                    match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    match.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {match.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/matches/${match.id}`);
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/matches/${match.id}/edit`);
                    }}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
