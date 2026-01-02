import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import { tournamentService } from '@/services/tournament.service';
import type { Team, Tournament } from '@/types/api.types';

export default function ScheduleMatch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teamAId: '',
    teamBId: '',
    tournamentId: '',
    venue: '',
    matchDate: '',
    matchType: 'LEAGUE' as 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY',
    status: 'SCHEDULED' as 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, tournamentsData] = await Promise.all([
          teamService.getAll(),
          tournamentService.getAll(),
        ]);
        setTeams(Array.isArray(teamsData) ? teamsData : (teamsData.data || []));
        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : (tournamentsData.data || []));
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

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

    // CRITICAL FIX: Venue validation (backend requires min 3 chars)
    if (!formData.venue || formData.venue.trim().length < 3) {
      setError('Venue must be at least 3 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // CRITICAL FIX: Convert datetime-local to ISO format
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      // Convert to ISO: "YYYY-MM-DDTHH:mm:ss.sssZ"
      const matchDateTime = new Date(formData.matchDate).toISOString();

      console.log('🔵 Scheduling match:', {
        teamAId: formData.teamAId,
        teamBId: formData.teamBId,
        tournamentId: formData.tournamentId || undefined,
        venue: formData.venue.trim(),
        matchDate: matchDateTime,
        matchType: formData.matchType,
      });

      const matchData: any = {
        teamAId: formData.teamAId,
        teamBId: formData.teamBId,
        venue: formData.venue.trim(),
        matchDate: matchDateTime,
        matchType: formData.matchType,
      };
      
      // Only include tournamentId if provided
      if (formData.tournamentId) {
        matchData.tournamentId = formData.tournamentId;
      }

      const newMatch = await matchService.create(matchData);

      console.log('✅ Match scheduled:', newMatch);
      alert('Match scheduled successfully!');
      navigate('/admin/match-monitoring');

    } catch (err: any) {
      console.error('❌ Failed to schedule match:', err);
      setError(err.response?.data?.message || err.message || 'Failed to schedule match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedule Match</h1>
        <p className="text-gray-600">Create a new cricket match</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Team A */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Team A <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.teamAId}
              onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Team A</option>
              {teams.map(team => {
                const teamName = team.name || team.teamName || 'Unnamed Team';
                return (
                  <option key={team.id} value={team.id}>
                    {teamName} {team.city ? `(${team.city})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Team B */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Team B <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.teamBId}
              onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Team B</option>
              {teams.filter(t => t.id !== formData.teamAId).map(team => {
                const teamName = team.name || team.teamName || 'Unnamed Team';
                return (
                  <option key={team.id} value={team.id}>
                    {teamName} {team.city ? `(${team.city})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tournament */}
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

          {/* Venue - CRITICAL FIX: Add minLength validation */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
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
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Match Type</label>
            <select
              value={formData.matchType}
              onChange={(e) => setFormData({ ...formData, matchType: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LEAGUE">League</option>
              <option value="KNOCKOUT">Knockout</option>
              <option value="FRIENDLY">Friendly</option>
            </select>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Scheduling...' : 'Schedule Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
