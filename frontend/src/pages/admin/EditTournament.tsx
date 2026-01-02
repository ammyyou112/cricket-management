import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService } from '@/services/tournament.service';

export default function EditTournament() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 8,
    status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
  });

  useEffect(() => {
    const loadTournament = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const tournament = await tournamentService.getById(id);
        
        // Convert ISO dates to date input format (YYYY-MM-DD)
        const startDate = new Date(tournament.startDate).toISOString().split('T')[0];
        const endDate = new Date(tournament.endDate).toISOString().split('T')[0];
        
        const tournamentName = tournament.name || tournament.tournamentName || '';
        
        setFormData({
          name: tournamentName,
          description: tournament.description || '',
          startDate,
          endDate,
          location: tournament.location || '',
          maxTeams: (tournament as any).maxTeams || 8,
          status: tournament.status,
        });
      } catch (err: any) {
        console.error('Failed to load tournament:', err);
        setError('Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Name and dates are required');
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
      setSaving(true);
      setError(null);

      // Convert dates to ISO format
      const startDateTime = new Date(formData.startDate + 'T00:00:00').toISOString();
      const endDateTime = new Date(formData.endDate + 'T23:59:59').toISOString();

      await tournamentService.update(id, {
        name: formData.name,
        description: formData.description || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        status: formData.status,
      });

      alert('Tournament updated successfully!');
      navigate('/admin/manage-tournaments');

    } catch (err: any) {
      console.error('Failed to update tournament:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update tournament');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Tournament</h1>
        <p className="text-gray-600">Update tournament details</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Tournament Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date *</label>
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

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Max Teams</label>
            <input
              type="number"
              value={formData.maxTeams}
              onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
              min="2"
              max="32"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

