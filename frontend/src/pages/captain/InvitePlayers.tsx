import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { teamService } from '@/services/team.service';
import { calculateDistance, formatDistance } from '@/utils/location';
import { MapPin } from 'lucide-react';
import type { Team, User } from '@/types/api.types';

export default function InvitePlayers() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const [captainLocation, setCaptainLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load captain's teams
        const teamsData = await teamService.getMyTeams();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        const captainTeams = allTeams.filter(t => t.captainId === user?.id || (t as any).captain_id === user?.id);
        
        console.log('✅ Captain teams loaded:', captainTeams.length);
        setMyTeams(captainTeams);
        
        if (captainTeams.length > 0) {
          setSelectedTeam(captainTeams[0].id);
        }
        
        // Load all users and filter for PLAYER role only
        const usersData = await userService.getAll();
        const allUsers = Array.isArray(usersData) ? usersData : (usersData.data || []);
        
        // Filter: Only PLAYER role users
        const playerUsers = allUsers.filter((u: any) => (u.role || '').toUpperCase() === 'PLAYER');
        
        console.log('✅ Players loaded:', playerUsers.length);
        setPlayers(playerUsers);

        // ✅ LOAD CAPTAIN'S LOCATION FROM DATABASE
        if (user?.id) {
          try {
            const captainData = await userService.getById(user.id);
            // Convert Decimal to number if needed
            const lat = captainData.locationLatitude 
              ? (typeof captainData.locationLatitude === 'number' 
                  ? captainData.locationLatitude 
                  : Number(captainData.locationLatitude))
              : null;
            const lng = captainData.locationLongitude 
              ? (typeof captainData.locationLongitude === 'number' 
                  ? captainData.locationLongitude 
                  : Number(captainData.locationLongitude))
              : null;
            
            if (lat && lng) {
              setCaptainLocation({
                latitude: lat,
                longitude: lng,
              });
            }
          } catch (err) {
            console.error('Failed to load captain location:', err);
          }
        }
        
      } catch (err: any) {
        console.error('❌ Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleInvite = async (playerId: string, playerName: string) => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }

    if (!confirm(`Invite ${playerName} to your team?`)) return;

    try {
      setInviting(playerId);
      
      // Get player email
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      await teamService.inviteMember(selectedTeam, player.email);
      
      alert(`Invitation sent to ${playerName}!`);
      
    } catch (err: any) {
      console.error('❌ Failed to invite player:', err);
      alert(err.response?.data?.message || err.message || 'Failed to invite player');
    } finally {
      setInviting(null);
    }
  };

  // Filter and sort players by distance
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const fullName = player.fullName || player.full_name || '';
      const email = player.email || '';
      return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // ✅ SORT BY DISTANCE IF CAPTAIN HAS LOCATION (REAL DATA FROM DATABASE)
    if (captainLocation) {
      const withDistance = filtered.map(player => {
        // Convert Decimal to number if needed
        const playerLat = player.locationLatitude 
          ? (typeof player.locationLatitude === 'number' 
              ? player.locationLatitude 
              : Number(player.locationLatitude))
          : null;
        const playerLng = player.locationLongitude 
          ? (typeof player.locationLongitude === 'number' 
              ? player.locationLongitude 
              : Number(player.locationLongitude))
          : null;
        
        if (playerLat && playerLng) {
          const distance = calculateDistance(
            captainLocation.latitude,
            captainLocation.longitude,
            playerLat,
            playerLng
          );
          return { ...player, distance };
        }
        return { ...player, distance: Infinity }; // Players without location go to bottom
      });

      // Sort: players with location first (by distance), then players without location
      return withDistance.sort((a, b) => {
        if (a.distance === Infinity && b.distance === Infinity) return 0;
        if (a.distance === Infinity) return 1; // a goes to bottom
        if (b.distance === Infinity) return -1; // b goes to bottom
        return a.distance - b.distance;
      });
    }

    return filtered;
  }, [players, searchTerm, captainLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🏏</div>
          <h2 className="text-2xl font-bold mb-2">No Team Yet</h2>
          <p className="text-gray-600 mb-6">Create a team first to invite players</p>
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invite Players</h1>
        <p className="text-gray-600">Invite players to join your team</p>
      </div>

      {/* Team Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Select Team</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {myTeams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search players by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Location Info */}
      {captainLocation && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Players sorted by distance from your location</span>
          </div>
        </div>
      )}

      {/* Players List */}
      {filteredAndSortedPlayers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No players found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  {captainLocation && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedPlayers.map((player) => {
                  const fullName = player.fullName || player.full_name || 'Unknown';
                  const playerType = player.playerType || player.player_type || 'Player';
                  const hasDistance = 'distance' in player && player.distance !== Infinity;
                  
                  return (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{player.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {playerType}
                        </span>
                      </td>
                      {captainLocation && (
                        <td className="px-6 py-4 text-sm">
                          {hasDistance ? (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <MapPin className="h-3 w-3" />
                              {formatDistance(player.distance)}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No location</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleInvite(player.id, fullName)}
                          disabled={inviting === player.id}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition"
                        >
                          {inviting === player.id ? 'Inviting...' : 'Invite'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
