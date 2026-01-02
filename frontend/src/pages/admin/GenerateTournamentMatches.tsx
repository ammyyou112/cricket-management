import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService } from '@/services/tournament.service';
import { teamService } from '@/services/team.service';
import { matchService } from '@/services/match.service';
import type { Tournament, Team } from '@/types/api.types';

export default function GenerateTournamentMatches() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'LEAGUE' | 'KNOCKOUT' | 'HYBRID'>('LEAGUE');
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        // Load tournament
        const tournamentData = await tournamentService.getById(id);
        setTournament(tournamentData);

        // Load selected teams from localStorage (temporary solution)
        const storedTeams = localStorage.getItem(`tournament_${id}_teams`);
        const storedFormat = localStorage.getItem(`tournament_${id}_format`) as 'LEAGUE' | 'KNOCKOUT' | 'HYBRID' | null;
        const storedLocation = localStorage.getItem(`tournament_${id}_location`);
        
        if (storedFormat) setFormat(storedFormat);
        if (storedLocation) setLocation(storedLocation);
        
        if (storedTeams) {
          const teamIds = JSON.parse(storedTeams);
          
          // Load team details
          const allTeamsData = await teamService.getAll();
          const allTeams = Array.isArray(allTeamsData) ? allTeamsData : (allTeamsData.data || []);
          const selectedTeams = allTeams.filter(t => teamIds.includes(t.id));
          
          setTeams(selectedTeams);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load tournament data');
      }
    };

    loadData();
  }, [id]);

  const generateLeagueMatches = () => {
    if (teams.length < 2) return [];

    const matches: any[] = [];
    
    // Round robin: each team plays every other team once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const teamAName = teams[i].name || teams[i].teamName || 'Team A';
        const teamBName = teams[j].name || teams[j].teamName || 'Team B';
        matches.push({
          teamAId: teams[i].id,
          teamBId: teams[j].id,
          teamAName,
          teamBName,
        });
      }
    }

    return matches;
  };

  const generateKnockoutMatches = () => {
    if (teams.length < 2) return [];

    const matches: any[] = [];
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5); // Shuffle for fairness
    
    // First round pairings
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        const teamAName = shuffledTeams[i].name || shuffledTeams[i].teamName || 'Team A';
        const teamBName = shuffledTeams[i + 1].name || shuffledTeams[i + 1].teamName || 'Team B';
        matches.push({
          teamAId: shuffledTeams[i].id,
          teamBId: shuffledTeams[i + 1].id,
          teamAName,
          teamBName,
          round: 'Round 1',
        });
      }
    }

    return matches;
  };

  const generateHybridMatches = () => {
    // For now, just generate league matches
    // In a full implementation, this would generate league + playoff matches
    return generateLeagueMatches();
  };

  const handleGenerateMatches = async () => {
    if (!id || !tournament) return;

    try {
      setGenerating(true);
      setError(null);

      // Generate matches based on format
      let matches: any[] = [];
      if (format === 'LEAGUE') {
        matches = generateLeagueMatches();
      } else if (format === 'KNOCKOUT') {
        matches = generateKnockoutMatches();
      } else {
        matches = generateHybridMatches();
      }
      
      console.log('🔵 Generating', matches.length, 'matches for tournament');
      
      setGeneratedMatches(matches);

      // Create matches in backend
      const baseDate = new Date(tournament.startDate);
      const createdMatches = [];
      const matchVenue = location || tournament.location || 'TBD';

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        
        // Space matches 2 days apart (or adjust based on tournament duration)
        const matchDate = new Date(baseDate);
        const daysToAdd = Math.floor(i * (2)); // 2 days between matches
        matchDate.setDate(matchDate.getDate() + daysToAdd);

        // Don't schedule matches after tournament end date
        if (matchDate > new Date(tournament.endDate)) {
          console.warn(`Match ${i + 1} would be after tournament end date, skipping`);
          continue;
        }

        try {
          const createdMatch = await matchService.create({
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            tournamentId: id,
            venue: matchVenue,
            matchDate: matchDate.toISOString(),
            matchType: 'LEAGUE',
            status: 'SCHEDULED',
          });
          
          createdMatches.push(createdMatch);
          console.log(`✅ Match ${i + 1}/${matches.length} created: ${match.teamAName} vs ${match.teamBName}`);
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          console.error(`❌ Failed to create match ${i + 1}:`, err);
          // Continue with other matches even if one fails
        }
      }

      console.log('✅ All matches generated:', createdMatches.length);
      
      // Clear localStorage after successful generation
      localStorage.removeItem(`tournament_${id}_teams`);
      localStorage.removeItem(`tournament_${id}_format`);
      localStorage.removeItem(`tournament_${id}_location`);
      
      alert(`Successfully generated ${createdMatches.length} matches!`);
      navigate(`/tournaments/${id}`);

    } catch (err: any) {
      console.error('❌ Failed to generate matches:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate matches');
    } finally {
      setGenerating(false);
    }
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">No Teams Selected</h2>
          <p className="text-gray-600 mb-6">Please go back and select teams for this tournament</p>
          <button
            onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Generate preview matches
  let previewMatches: any[] = [];
  if (format === 'LEAGUE') {
    previewMatches = generateLeagueMatches();
  } else if (format === 'KNOCKOUT') {
    previewMatches = generateKnockoutMatches();
  } else {
    previewMatches = generateHybridMatches();
  }

  const tournamentName = tournament.name || (tournament as any).tournamentName || 'Unnamed Tournament';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Generate Tournament Matches</h1>
        <p className="text-gray-600">{tournamentName}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tournament Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Tournament Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-semibold">Teams:</span> {teams.length}</div>
          <div><span className="font-semibold">Format:</span> {format}</div>
          <div><span className="font-semibold">Expected Matches:</span> {previewMatches.length}</div>
          <div><span className="font-semibold">Duration:</span> {Math.ceil(previewMatches.length * 2)} days (approx)</div>
        </div>
      </div>

      {/* Participating Teams */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Participating Teams ({teams.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {teams.map((team) => {
            const teamName = team.name || team.teamName || 'Unnamed Team';
            return (
              <div key={team.id} className="flex items-center gap-2 p-3 border rounded">
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={teamName} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">🏏</div>
                )}
                <div className="text-sm">
                  <div className="font-medium">{teamName}</div>
                  {team.city && <div className="text-gray-500 text-xs">{team.city}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Preview */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Match Preview ({previewMatches.length} matches)</h2>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {previewMatches.map((match, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Match {index + 1}</span>
              <span className="font-medium">{match.teamAName} vs {match.teamBName}</span>
              {match.round && <span className="text-xs text-gray-500">{match.round}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate(`/admin/manage-tournaments`)}
          className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
          disabled={generating}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerateMatches}
          disabled={generating || teams.length < 2}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {generating ? `Generating Matches... (${generatedMatches.length}/${previewMatches.length})` : `Generate ${previewMatches.length} Matches`}
        </button>
      </div>
    </div>
  );
}

