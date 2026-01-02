import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import type { Match, Team } from '@/types/api.types';

export default function TeamMatches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Loading captain teams and matches...');
        
        // Get captain's teams
        const teamsData = await teamService.getMyTeams();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        const captainTeams = allTeams.filter(t => t.captainId === user?.id || (t as any).captain_id === user?.id);
        
        console.log('✅ Captain teams loaded:', captainTeams.length);
        setMyTeams(captainTeams);
        
        if (captainTeams.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get all matches
        const matchesData = await matchService.getAll();
        const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
        
        // Filter matches where captain's team is playing
        const teamIds = captainTeams.map(t => t.id);
        const teamMatches = allMatches.filter(m => 
          teamIds.includes(m.teamAId) || teamIds.includes(m.teamBId)
        );
        
        console.log('✅ Captain matches loaded:', teamMatches.length);
        setMatches(teamMatches);
        
        // Load ALL teams for name lookup
        const allTeamsData = await teamService.getAll();
        const allTeamsList = Array.isArray(allTeamsData) ? allTeamsData : (allTeamsData.data || []);
        
        // Create team lookup map
        const teamMap: Record<string, Team> = {};
        allTeamsList.forEach(team => {
          teamMap[team.id] = team;
        });
        setTeams(teamMap);
        
      } catch (err: any) {
        console.error('❌ Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filteredMatches = filter === 'ALL' 
    ? matches 
    : matches.filter(m => {
        if (filter === 'UPCOMING') return m.status === 'SCHEDULED';
        if (filter === 'LIVE') return m.status === 'LIVE';
        if (filter === 'COMPLETED') return m.status === 'COMPLETED';
        return true;
      });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🏏</div>
          <h2 className="text-2xl font-bold mb-2">No Team Yet</h2>
          <p className="text-gray-600 mb-6">Create a team to see matches</p>
          <button
            onClick={() => navigate('/captain/team/create')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Matches</h1>
        <p className="text-gray-600">Matches for your teams ({matches.length} total)</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏏</div>
          <p className="text-gray-500">No matches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMatches.map((match) => {
            const teamA = teams[match.teamAId];
            const teamB = teams[match.teamBId];
            
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
                          <img src={teamA.logoUrl} alt={teamA.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">🏏</div>
                        )}
                        <span className="font-bold text-lg">{teamA?.name || 'Team A'}</span>
                      </div>
                      
                      <span className="text-gray-400 font-bold text-xl">VS</span>
                      
                      {/* Team B */}
                      <div className="flex items-center gap-2 flex-1">
                        {teamB?.logoUrl ? (
                          <img src={teamB.logoUrl} alt={teamB.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">🏏</div>
                        )}
                        <span className="font-bold text-lg">{teamB?.name || 'Team B'}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      📍 {match.venue} • 📅 {new Date(match.matchDate).toLocaleString()}
                    </p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded text-sm font-medium ml-4 ${
                    match.status === 'LIVE' ? 'bg-red-100 text-red-800 animate-pulse' :
                    match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {match.status}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-4">
                  {match.status === 'LIVE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/captain/match/${match.id}/update-result`);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Update Score
                    </button>
                  )}

                  {match.status === 'COMPLETED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/captain/match/${match.id}/update-result`);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Update Result
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
