import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { teamService } from '@/services/team.service';
import { matchService } from '@/services/match.service';
import type { Team, Match } from '@/types/api.types';

export default function TeamStatistics() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load captain's teams
        const teamsData = await teamService.getMyTeams();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        const captainTeams = allTeams.filter(t => t.captainId === user?.id || (t as any).captain_id === user?.id);
        
        console.log('✅ Captain teams loaded for stats:', captainTeams.length);
        setTeams(captainTeams);
        
        if (captainTeams.length > 0) {
          setSelectedTeam(captainTeams[0]);
          
          // Load matches for this team
          const matchesData = await matchService.getAll();
          const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
          const teamMatches = allMatches.filter(m => 
            m.teamAId === captainTeams[0].id || m.teamBId === captainTeams[0].id
          );
          
          console.log('✅ Team matches loaded:', teamMatches.length);
          setMatches(teamMatches);
        }
        
      } catch (err: any) {
        console.error('❌ Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!selectedTeam) return;

    const loadTeamMatches = async () => {
      try {
        const matchesData = await matchService.getAll();
        const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
        const teamMatches = allMatches.filter(m => 
          m.teamAId === selectedTeam.id || m.teamBId === selectedTeam.id
        );
        setMatches(teamMatches);
      } catch (err: any) {
        console.error('❌ Failed to load matches:', err);
      }
    };

    loadTeamMatches();
  }, [selectedTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">No Team Found</h2>
          <p className="text-gray-600 mb-6">Create a team to view statistics</p>
          <button
            onClick={() => window.location.href = '/captain/team/create'}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Team
          </button>
        </div>
      </div>
    );
  }

  const completedMatches = matches.filter(m => m.status === 'COMPLETED');
  const wins = completedMatches.filter(m => m.winnerId === selectedTeam.id).length;
  const losses = completedMatches.filter(m => 
    m.winnerId && 
    m.winnerId !== selectedTeam.id && 
    m.winnerId !== 'TIE' &&
    m.winnerId !== null
  ).length;
  const ties = completedMatches.filter(m => 
    m.winnerId === 'TIE' || m.winnerId === null || !m.winnerId
  ).length;
  const winRate = completedMatches.length > 0 ? ((wins / completedMatches.length) * 100).toFixed(1) : '0';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Statistics</h1>
        <p className="text-gray-600">Performance metrics for your teams</p>
      </div>

      {/* Team Selector */}
      {teams.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Select Team</label>
          <select
            value={selectedTeam.id}
            onChange={(e) => {
              const team = teams.find(t => t.id === e.target.value);
              setSelectedTeam(team || null);
            }}
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Team Info Card */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          {selectedTeam.logoUrl ? (
            <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-20 h-20 rounded-full" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
              🏏
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
            {selectedTeam.city && (
              <p className="text-gray-600">📍 {selectedTeam.city}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl font-bold text-blue-600">{matches.length}</div>
          <div className="text-gray-600 mt-2">Total Matches</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl font-bold text-green-600">{wins}</div>
          <div className="text-gray-600 mt-2">Wins</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl font-bold text-red-600">{losses}</div>
          <div className="text-gray-600 mt-2">Losses</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-4xl font-bold text-yellow-600">{winRate}%</div>
          <div className="text-gray-600 mt-2">Win Rate</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Match Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Scheduled</span>
              <span className="font-semibold">{matches.filter(m => m.status === 'SCHEDULED').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Live</span>
              <span className="font-semibold">{matches.filter(m => m.status === 'LIVE').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold">{completedMatches.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ties</span>
              <span className="font-semibold">{ties}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Recent Matches</h3>
          {completedMatches.length > 0 ? (
            <div className="space-y-2">
              {completedMatches.slice(0, 5).map((match) => (
                <div key={match.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">
                    {new Date(match.matchDate).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.winnerId === selectedTeam.id 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {match.winnerId === selectedTeam.id ? 'Won' : 'Lost'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No completed matches yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
