import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentService } from '@/services/tournament.service';
import type { Tournament } from '@/types/api.types';

export default function PlayerTournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        const data = await tournamentService.getAll();
        const tournamentsData = Array.isArray(data) ? data : (data.data || []);
        console.log('✅ Tournaments loaded:', tournamentsData.length);
        setTournaments(tournamentsData);
      } catch (err: any) {
        console.error('❌ Failed to load tournaments:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTournaments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tournaments</h1>
        <p className="text-gray-600">View all cricket tournaments</p>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-500">No tournaments yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const tournamentName = tournament.name || tournament.tournamentName || 'Unnamed Tournament';
            return (
              <div key={tournament.id} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition cursor-pointer" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
                <div className="text-5xl text-center mb-4">🏆</div>
                <h3 className="text-xl font-bold text-center mb-2">{tournamentName}</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </p>
                <span className={`block text-center px-3 py-1 rounded text-sm font-medium ${
                  tournament.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
                  tournament.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tournament.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

