import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import { tournamentService } from '@/services/tournament.service';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import type { Team, Tournament, CreateMatchInput } from '@/types/api.types';

export default function ScheduleMatch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teamAId: '',
    teamBId: '',
    tournamentId: '',
    venue: '',
    matchDate: '',
    matchType: 'LEAGUE' as 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY',
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const [myTeamsData, allTeamsData, tournamentsData] = await Promise.all([
        teamService.getMyTeams(),
        teamService.getAll(), // Use getAllTeams instead of getAvailableTeams
        tournamentService.getAll(),
      ]);
      
      const myTeamsArray = Array.isArray(myTeamsData) ? myTeamsData : (myTeamsData?.data || []);
      const allTeamsArray = Array.isArray(allTeamsData) ? allTeamsData : (allTeamsData?.data || []);
      
      setMyTeams(myTeamsArray);
      
      // Filter out captain's teams from all teams to get available opponents
      setAllTeams(allTeamsArray.filter((t: Team) => 
        !myTeamsArray.some((mt: Team) => mt.id === t.id)
      ));
      
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : (tournamentsData?.data || []));
    } catch (err) {
      console.error('Failed to load teams:', err);
      setError('Failed to load teams. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION
    if (!formData.teamAId || !formData.teamBId) {
      setError('Please select both teams');
      return;
    }

    if (formData.teamAId === formData.teamBId) {
      setError('Please select different teams');
      return;
    }

    if (!formData.matchDate) {
      setError('Match date is required');
      return;
    }

    if (!formData.venue || formData.venue.trim().length < 3) {
      setError('Venue must be at least 3 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const matchDateTime = new Date(formData.matchDate).toISOString();

      const matchData: CreateMatchInput = {
        teamAId: formData.teamAId,
        teamBId: formData.teamBId,
        venue: formData.venue.trim(),
        matchDate: matchDateTime,
        matchType: formData.matchType,
        status: 'SCHEDULED',
        ...(formData.tournamentId && { tournamentId: formData.tournamentId }),
      };

      await matchService.create(matchData);

      toast({
        title: 'Success',
        description: 'Match scheduled successfully!',
      });
      
      navigate('/captain/matches');
    } catch (err: any) {
      console.error('❌ Failed to schedule match:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to schedule match';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Schedule Match</h1>
        <p className="text-gray-600">Create a new cricket match for your team</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Your Team (Team A) */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              <Trophy className="inline w-4 h-4 mr-1" />
              Your Team <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.teamAId}
              onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select your team</option>
              {myTeams.map(team => {
                const teamName = team.name || team.teamName || 'Unnamed Team';
                return (
                  <option key={team.id} value={team.id}>
                    {teamName} {team.city ? `(${team.city})` : ''}
                  </option>
                );
              })}
            </select>
            {myTeams.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                You don't have any teams yet. <a href="/captain/team/create" className="text-blue-600 underline">Create a team</a>
              </p>
            )}
          </div>

          {/* Opponent Team (Team B) */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Opponent Team <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.teamBId}
              onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select opponent</option>
              {allTeams
                .filter(t => t.id !== formData.teamAId)
                .map(team => {
                  const teamName = team.name || team.teamName || 'Unnamed Team';
                  return (
                    <option key={team.id} value={team.id}>
                      {teamName} {team.city ? `(${team.city})` : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Tournament (Optional) */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Tournament (Optional)</label>
            <select
              value={formData.tournamentId}
              onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Tournament (Friendly Match)</option>
              {tournaments.map(tournament => {
                const tournamentName = tournament.name || tournament.tournamentName || 'Unnamed Tournament';
                return (
                  <option key={tournament.id} value={tournament.id}>
                    {tournamentName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Venue */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Venue <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g., Wankhede Stadium, Mumbai"
              minLength={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 3 characters required</p>
          </div>

          {/* Match Date & Time */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Match Date & Time <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.matchDate}
              onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Match Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Match Type</label>
            <select
              value={formData.matchType}
              onChange={(e) => setFormData({ ...formData, matchType: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LEAGUE">League Match</option>
              <option value="KNOCKOUT">Knockout Match</option>
              <option value="FRIENDLY">Friendly Match</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/captain/matches')}
              className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Scheduling...' : 'Schedule Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

