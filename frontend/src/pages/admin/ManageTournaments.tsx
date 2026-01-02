import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentService } from '@/services/tournament.service';
import type { Tournament } from '@/types/api.types';

export default function ManageTournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getAll();
      const tournamentsData = Array.isArray(data) ? data : (data.data || []);
      console.log('✅ Admin tournaments loaded:', tournamentsData.length);
      setTournaments(tournamentsData);
    } catch (err: any) {
      console.error('❌ Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tournament "${name}"?`)) return;

    try {
      await tournamentService.delete(id);
      alert('Tournament deleted successfully');
      setTournaments(tournaments.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete tournament');
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Tournaments</h1>
          <p className="text-gray-600">Create and manage cricket tournaments</p>
        </div>
        <button
          onClick={() => navigate('/admin/tournaments/create')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Create Tournament
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-semibold mb-2">No Tournaments Yet</h3>
          <p className="text-gray-600 mb-6">Create your first tournament</p>
          <button
            onClick={() => navigate('/admin/tournaments/create')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Tournament
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournament</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teams</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tournaments.map((tournament) => {
                const tournamentName = tournament.name || tournament.tournamentName || 'Unnamed Tournament';
                return (
                  <tr key={tournament.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{tournamentName}</div>
                      {tournament.description && (
                        <div className="text-sm text-gray-600">{tournament.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tournament.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                        tournament.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{tournament._count?.matches || 0} matches</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/tournaments/${tournament.id}`)} className="text-blue-600 hover:underline mr-3">View</button>
                      <button onClick={() => navigate(`/admin/tournaments/${tournament.id}/edit`)} className="text-green-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDelete(tournament.id, tournamentName)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
