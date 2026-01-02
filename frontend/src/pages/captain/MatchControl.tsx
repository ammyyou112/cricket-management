import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { teamService } from '@/services/team.service';
import { matchService } from '@/services/match.service';
import type { Team, Match } from '@/types/api.types';

export default function MatchControl() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'live'>('upcoming');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load captain's teams
        const teamsData = await teamService.getMyTeams();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        const captainTeams = allTeams.filter(t => t.captainId === user?.id || (t as any).captain_id === user?.id);
        
        console.log('✅ Captain teams loaded:', captainTeams.length);
        setTeams(captainTeams);
        
        if (captainTeams.length === 0) {
          setLoading(false);
          return;
        }
        
        // Load matches
        const matchesData = await matchService.getAll();
        const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
        
        // Filter matches for captain's teams
        const teamIds = captainTeams.map(t => t.id);
        const teamMatches = allMatches.filter(m => 
          teamIds.includes(m.teamAId) || teamIds.includes(m.teamBId)
        );
        
        setMatches(teamMatches);
        
      } catch (err: any) {
        console.error('❌ Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

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

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🏏</div>
          <h2 className="text-2xl font-bold mb-2">No Team Found</h2>
          <p className="text-gray-600 mb-6">You are not leading any team yet</p>
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

  const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED');
  const liveMatches = matches.filter(m => m.status === 'LIVE');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Match Control</h1>
        <p className="text-gray-600">Control and manage your team's matches</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'upcoming'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Scheduled ({upcomingMatches.length})
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'live'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Live ({liveMatches.length})
        </button>
      </div>

      {/* Matches List */}
      {filter === 'upcoming' && (
        <div>
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No scheduled matches found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-2">Match #{match.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-600">
                      📍 {match.venue} • 📅 {new Date(match.matchDate).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/captain/match/${match.id}/update-result`)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Prepare Match
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {filter === 'live' && (
        <div>
          {liveMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No live matches currently</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-red-500"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">LIVE MATCH</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      📍 {match.venue} • 📅 {new Date(match.matchDate).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/captain/match/${match.id}/update-result`)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Update Score
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
