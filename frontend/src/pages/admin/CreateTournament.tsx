import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentService } from '@/services/tournament.service';
import { teamService } from '@/services/team.service';
import type { Team } from '@/types/api.types';

export default function CreateTournament() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 8,
    format: 'LEAGUE' as 'LEAGUE' | 'KNOCKOUT' | 'HYBRID',
    status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
  });

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await teamService.getAll();
        const teamsData = Array.isArray(data) ? data : (data.data || []);
        setTeams(teamsData);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };
    loadTeams();
  }, []);

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      if (selectedTeams.length >= formData.maxTeams) {
        alert(`Maximum ${formData.maxTeams} teams allowed`);
        return;
      }
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Name and dates are required');
      return;
    }

    if (selectedTeams.length < 2) {
      setError('Please select at least 2 teams');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('Invalid date format');
      return;
    }

    if (endDate <= startDate) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDateTime = new Date(formData.startDate + 'T00:00:00').toISOString();
      const endDateTime = new Date(formData.endDate + 'T23:59:59').toISOString();

      console.log('🔵 Creating tournament:', {
        name: formData.name,
        description: formData.description,
        startDate: startDateTime,
        endDate: endDateTime,
        location: formData.location,
        maxTeams: formData.maxTeams,
        status: formData.status,
        selectedTeams: selectedTeams.length,
        format: formData.format,
      });

      // Create tournament
      const newTournament = await tournamentService.create({
        name: formData.name,
        description: formData.description || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
      });

      console.log('✅ Tournament created:', newTournament);
      
      // Store selected teams and format in localStorage temporarily (until backend supports it)
      localStorage.setItem(`tournament_${newTournament.id}_teams`, JSON.stringify(selectedTeams));
      localStorage.setItem(`tournament_${newTournament.id}_format`, formData.format);
      localStorage.setItem(`tournament_${newTournament.id}_location`, formData.location || '');
      
      alert(`Tournament created successfully with ${selectedTeams.length} teams!`);
      navigate(`/admin/tournaments/${newTournament.id}/generate-matches`);

    } catch (err: any) {
      console.error('❌ Failed to create tournament:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  // Calculate expected matches based on format
  const calculateExpectedMatches = () => {
    if (selectedTeams.length < 2) return 0;
    
    if (formData.format === 'LEAGUE') {
      // Round robin: n * (n-1) / 2
      return (selectedTeams.length * (selectedTeams.length - 1)) / 2;
    } else if (formData.format === 'KNOCKOUT') {
      // Single elimination: n - 1
      return selectedTeams.length - 1;
    } else if (formData.format === 'HYBRID') {
      // League stage + Playoffs
      const leagueMatches = (selectedTeams.length * (selectedTeams.length - 1)) / 2;
      const playoffMatches = Math.ceil(selectedTeams.length / 2) - 1; // Top half qualify
      return leagueMatches + playoffMatches;
    }
    return 0;
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Tournament</h1>
        <p className="text-gray-600">Set up a new cricket tournament</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Tournament Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Tournament Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Cricket League 2026"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tournament details..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tournament Format */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Tournament Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LEAGUE">League (Round Robin) - All teams play each other</option>
              <option value="KNOCKOUT">Knockout - Single elimination</option>
              <option value="HYBRID">League + Knockout - Top teams qualify for playoffs</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.format === 'LEAGUE' && 'Each team plays against every other team once'}
              {formData.format === 'KNOCKOUT' && 'Teams are eliminated after losing'}
              {formData.format === 'HYBRID' && 'League stage followed by knockout playoffs'}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Start Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                End Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Mumbai, Delhi"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Teams */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Max Teams</label>
            <select
              value={formData.maxTeams}
              onChange={(e) => {
                const newMax = Number(e.target.value);
                setFormData({ ...formData, maxTeams: newMax });
                // If selected teams exceed new max, trim them
                if (selectedTeams.length > newMax) {
                  setSelectedTeams(selectedTeams.slice(0, newMax));
                }
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4">4 teams (Knockout format)</option>
              <option value="6">6 teams</option>
              <option value="8">8 teams (Recommended for league)</option>
              <option value="10">10 teams</option>
              <option value="12">12 teams</option>
              <option value="16">16 teams (Knockout format)</option>
            </select>
          </div>

          {/* Team Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Select Teams <span className="text-red-600">*</span> ({selectedTeams.length}/{formData.maxTeams} selected)
            </label>
            
            {selectedTeams.length < 2 && (
              <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ Please select at least 2 teams to create a tournament
              </div>
            )}
            
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
              {teams.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No teams available. Create teams first.</p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => {
                    const teamName = team.name || team.teamName || 'Unnamed Team';
                    return (
                      <label
                        key={team.id}
                        className={`flex items-center gap-3 p-3 rounded cursor-pointer transition ${
                          selectedTeams.includes(team.id)
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => handleTeamToggle(team.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={teamName} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">🏏</div>
                          )}
                          <div>
                            <div className="font-medium">{teamName}</div>
                            {team.city && <div className="text-sm text-gray-600">{team.city}</div>}
                          </div>
                        </div>
                        {selectedTeams.includes(team.id) && (
                          <span className="text-blue-600 font-bold">✓</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Expected Matches Info */}
          {selectedTeams.length >= 2 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">Tournament Info:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Selected Teams: {selectedTeams.length}</li>
                <li>• Expected Matches: {calculateExpectedMatches()} ({formData.format === 'LEAGUE' ? `each team plays ${selectedTeams.length - 1} matches` : formData.format === 'KNOCKOUT' ? 'single elimination' : 'league + playoffs'})</li>
                <li>• Format: {formData.format}</li>
              </ul>
            </div>
          )}

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
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
              disabled={loading || selectedTeams.length < 2}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create & Generate Matches'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
