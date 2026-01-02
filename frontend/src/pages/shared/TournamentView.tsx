import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService } from '@/services/tournament.service';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import type { Tournament, Match, Team } from '@/types/api.types';

export default function TournamentView() {
  const { id, tournamentId } = useParams<{ id?: string; tournamentId?: string }>();
  const navigate = useNavigate();
  const tournamentParam = id || tournamentId;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMap, setTeamMap] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'standings'>('matches');

  useEffect(() => {
    const loadTournamentData = async () => {
      if (!tournamentParam) return;

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading tournament data for:', tournamentParam);
        
        // Load tournament details
        const tournamentData = await tournamentService.getById(tournamentParam);
        console.log('✅ Tournament loaded:', tournamentData);
        setTournament(tournamentData);
        
        // Load all matches
        const matchesData = await matchService.getAll({ tournamentId: tournamentParam });
        const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || matchesData.matches || []);
        
        console.log('✅ Tournament matches loaded:', allMatches.length);
        setMatches(allMatches);
        
        // Load all teams to get names
        const teamsData = await teamService.getAll();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        
        // Get unique team IDs from matches
        const teamIds = new Set<string>();
        allMatches.forEach(match => {
          if (match.teamAId) teamIds.add(match.teamAId);
          if (match.teamBId) teamIds.add(match.teamBId);
        });
        
        // Filter teams that are in this tournament
        const tournamentTeams = allTeams.filter(team => teamIds.has(team.id));
        console.log('✅ Tournament teams loaded:', tournamentTeams.length);
        setTeams(tournamentTeams);
        
        // Create team lookup map for quick access
        const teamLookup: Record<string, Team> = {};
        allTeams.forEach(team => {
          teamLookup[team.id] = team;
        });
        setTeamMap(teamLookup);
        
      } catch (err: any) {
        console.error('❌ Failed to load tournament data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournamentData();
  }, [tournamentParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This tournament does not exist'}</p>
          <button
            onClick={() => navigate('/admin/manage-tournaments')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const tournamentName = tournament.name || (tournament as any).tournamentName || 'Unnamed Tournament';

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Tournament Header */}
      <div className="bg-white p-8 rounded-lg shadow mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{tournamentName}</h1>
            {tournament.description && (
              <p className="text-gray-600 mb-4">{tournament.description}</p>
            )}
          </div>
          <span className={`px-4 py-2 rounded text-sm font-medium ${
            tournament.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
            tournament.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
            tournament.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">📅 Start:</span>{' '}
            {new Date(tournament.startDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">📅 End:</span>{' '}
            {new Date(tournament.endDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">📍 Location:</span>{' '}
            {tournament.location || 'TBD'}
          </div>
          <div>
            <span className="font-semibold">🏆 Format:</span> League
          </div>
        </div>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{teams.length}</div>
            <div className="text-sm text-gray-600 mt-2">Teams</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{matches.length}</div>
            <div className="text-sm text-gray-600 mt-2">Matches</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {matches.filter(m => m.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">Completed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-4 border-b-2 transition ${
                activeTab === 'matches'
                  ? 'border-green-600 font-semibold text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-4 border-b-2 transition ${
                activeTab === 'teams'
                  ? 'border-green-600 font-semibold text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Teams
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-4 border-b-2 transition ${
                activeTab === 'standings'
                  ? 'border-green-600 font-semibold text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Standings
            </button>
          </div>
        </div>

        {/* Matches Tab Content */}
        {activeTab === 'matches' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Tournament Matches</h2>
            
            {matches.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🏏</div>
                <p className="text-gray-500">No matches scheduled yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => {
                  const teamA = teamMap[match.teamAId] || match.teamA;
                  const teamB = teamMap[match.teamBId] || match.teamB;
                  const teamAName = teamA?.name || teamA?.teamName || 'Team A';
                  const teamBName = teamB?.name || teamB?.teamName || 'Team B';
                  
                  return (
                    <div
                      key={match.id}
                      className="p-6 border rounded-lg hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/matches/${match.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            {/* Team A */}
                            <div className="flex items-center gap-2 flex-1">
                              {teamA?.logoUrl ? (
                                <img src={teamA.logoUrl} alt={teamAName} className="w-10 h-10 rounded-full" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">🏏</div>
                              )}
                              <span className="font-semibold">{teamAName}</span>
                            </div>
                            
                            <span className="text-gray-400 font-bold">VS</span>
                            
                            {/* Team B */}
                            <div className="flex items-center gap-2 flex-1">
                              {teamB?.logoUrl ? (
                                <img src={teamB.logoUrl} alt={teamBName} className="w-10 h-10 rounded-full" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">🏏</div>
                              )}
                              <span className="font-semibold">{teamBName}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-600">
                            📍 {match.venue} • 📅 {new Date(match.matchDate).toLocaleString()}
                          </div>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Teams Tab Content */}
        {activeTab === 'teams' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Participating Teams</h2>
            
            {teams.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No teams yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => {
                  const teamName = team.name || team.teamName || 'Unnamed Team';
                  return (
                    <div
                      key={team.id}
                      className="p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/teams/${team.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={teamName} className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">🏏</div>
                        )}
                        <div>
                          <div className="font-semibold">{teamName}</div>
                          {team.city && <div className="text-sm text-gray-600">{team.city}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Standings Tab Content */}
        {activeTab === 'standings' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Points Table</h2>
            
            {(() => {
              // Calculate standings
              if (!matches || matches.length === 0 || teams.length === 0) {
                return (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No matches completed yet</p>
                  </div>
                );
              }

              const standings: Record<string, any> = {};

              // Initialize all teams
              teams.forEach(team => {
                const teamName = team.name || team.teamName || 'Unnamed Team';
                standings[team.id] = {
                  teamId: team.id,
                  teamName,
                  played: 0,
                  won: 0,
                  lost: 0,
                  tied: 0,
                  points: 0,
                  nrr: 0, // Net Run Rate (simplified)
                };
              });

              // Process completed matches
              matches.forEach(match => {
                if (match.status !== 'COMPLETED' || !match.winnerTeamId) return;

                const teamAId = match.teamAId;
                const teamBId = match.teamBId;

                if (standings[teamAId]) standings[teamAId].played++;
                if (standings[teamBId]) standings[teamBId].played++;

                // Handle tie (if winnerTeamId is null or special value)
                if (!match.winnerTeamId || match.winnerTeamId === 'TIE') {
                  if (standings[teamAId]) {
                    standings[teamAId].tied++;
                    standings[teamAId].points += 1;
                  }
                  if (standings[teamBId]) {
                    standings[teamBId].tied++;
                    standings[teamBId].points += 1;
                  }
                } else if (match.winnerTeamId === teamAId) {
                  if (standings[teamAId]) {
                    standings[teamAId].won++;
                    standings[teamAId].points += 2;
                  }
                  if (standings[teamBId]) {
                    standings[teamBId].lost++;
                  }
                } else if (match.winnerTeamId === teamBId) {
                  if (standings[teamBId]) {
                    standings[teamBId].won++;
                    standings[teamBId].points += 2;
                  }
                  if (standings[teamAId]) {
                    standings[teamAId].lost++;
                  }
                }
              });

              // Convert to array and sort by points
              const standingsArray = Object.values(standings).sort((a: any, b: any) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.won !== a.won) return b.won - a.won;
                return b.nrr - a.nrr;
              });

              if (standingsArray.length === 0) {
                return (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No matches completed yet</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Pos</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Team</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">P</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">W</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">L</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">T</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {standingsArray.map((team: any, index: number) => (
                        <tr key={team.teamId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-center font-bold">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {teamMap[team.teamId]?.logoUrl && (
                                <img src={teamMap[team.teamId].logoUrl} alt="" className="w-8 h-8 rounded-full" />
                              )}
                              <span className="font-medium">{team.teamName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{team.played}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-semibold">{team.won}</td>
                          <td className="px-4 py-3 text-center text-red-600">{team.lost}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{team.tied}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>P = Played, W = Won, L = Lost, T = Tied, Pts = Points (Win = 2pts, Tie = 1pt, Loss = 0pts)</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
