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
  const [radiusKm, setRadiusKm] = useState(25);
  const [teamMembers, setTeamMembers] = useState<Set<string>>(new Set()); // Track invited/member player IDs

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load captain's teams
        const teamsData = await teamService.getMyTeams();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        const captainTeams = allTeams.filter(t => t.captainId === user?.id || (t as any).captain_id === user?.id);
        
        setMyTeams(captainTeams);
        
        if (captainTeams.length > 0) {
          setSelectedTeam(captainTeams[0].id);
          // Load team members for the selected team
          loadTeamMembers(captainTeams[0].id);
        }
        
        // Load all users and filter for PLAYER role only
        const usersData = await userService.getAll();
        const allUsers = Array.isArray(usersData) ? usersData : (usersData.data || []);
        
        // Filter: Only PLAYER role users
        const playerUsers = allUsers.filter((u: any) => (u.role || '').toUpperCase() === 'PLAYER');
        
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
            // Failed to load captain location
          }
        }
        
      } catch (err: any) {
        // Failed to load data
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Load team members when team is selected
  const loadTeamMembers = async (teamId: string) => {
    try {
      const members = await teamService.getTeamMembers(teamId);
      // Create a set of player IDs who are already members or invited
      // Handle both camelCase (playerId) and snake_case (player_id) from API
      const memberIds = new Set(
        members
          .map((m: any) => m.playerId || m.player_id || m.user?.id || m.player?.id)
          .filter((id: string | undefined) => id) // Remove undefined values
      );
      setTeamMembers(memberIds);
    } catch (err) {
      // Failed to load team members - don't block the UI
    }
  };

  // Reload team members when selected team changes
  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam);
    } else {
      setTeamMembers(new Set());
    }
  }, [selectedTeam]);

  const handleInvite = async (playerId: string, playerName: string) => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }

    if (!confirm(`Invite ${playerName} to your team?`)) return;

    try {
      setInviting(playerId);
      
      // Send userId (playerId) instead of email - backend expects userId
      await teamService.inviteMember(selectedTeam, playerId);
      
      // Add to teamMembers set to update UI immediately
      setTeamMembers(prev => new Set(prev).add(playerId));
      
      alert(`Invitation sent to ${playerName}!`);
      
    } catch (err: any) {
      // Handle 409 Conflict (already invited/member) with a better message
      if (err.response?.status === 409) {
        const errorMsg = err.response?.data?.message || 'This player is already a member or has been invited to the team';
        alert(errorMsg);
        // Add to teamMembers set to prevent future attempts
        setTeamMembers(prev => new Set(prev).add(playerId));
      } else {
        alert(err.response?.data?.message || err.message || 'Failed to invite player');
      }
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

    // ✅ FILTER BY DISTANCE IF CAPTAIN HAS LOCATION
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
        return { ...player, distance: Infinity }; // Players without location
      });

      // Filter by radius (if radius is 999, show all)
      const radiusFiltered = radiusKm === 999 
        ? withDistance 
        : withDistance.filter(p => p.distance === Infinity || p.distance <= radiusKm);

      // Sort: players with location first (by distance), then players without location
      return radiusFiltered.sort((a, b) => {
        if (a.distance === Infinity && b.distance === Infinity) return 0;
        if (a.distance === Infinity) return 1; // a goes to bottom
        if (b.distance === Infinity) return -1; // b goes to bottom
        return a.distance - b.distance;
      });
    }

    return filtered;
  }, [players, searchTerm, captainLocation, radiusKm]);

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
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Invite Players</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Invite players to join your team</p>
      </div>

      {/* Team Selection */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-semibold mb-2">Select Team</label>
        <select
          value={selectedTeam}
          onChange={(e) => {
            setSelectedTeam(e.target.value);
            // Team members will be reloaded by useEffect
          }}
          className="w-full sm:max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {myTeams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search players by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Radius Filter */}
      {captainLocation && (
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Search Radius</label>
          <select 
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
            <option value={50}>Within 50 km</option>
            <option value={999}>Any distance</option>
          </select>
        </div>
      )}

      {/* Location Info */}
      {captainLocation && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">
              Players sorted by distance from your location
              {radiusKm !== 999 && ` (within ${radiusKm} km)`}
            </span>
          </div>
        </div>
      )}

      {/* Players List */}
      {filteredAndSortedPlayers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No players found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    {captainLocation && (
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                    )}
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedPlayers.map((player) => {
                    const fullName = player.fullName || player.full_name || 'Unknown';
                    const playerType = player.playerType || player.player_type || 'Player';
                    const hasDistance = 'distance' in player && player.distance !== Infinity;
                    
                    return (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 font-medium">{fullName}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{player.email}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {playerType}
                          </span>
                        </td>
                        {captainLocation && (
                          <td className="px-4 lg:px-6 py-4 text-sm">
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
                        <td className="px-4 lg:px-6 py-4 text-right">
                          {teamMembers.has(player.id) ? (
                            <span className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded text-xs">
                              Already Invited
                            </span>
                          ) : (
                            <button
                              onClick={() => handleInvite(player.id, fullName)}
                              disabled={inviting === player.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm transition"
                            >
                              {inviting === player.id ? 'Inviting...' : 'Invite'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedPlayers.map((player) => {
              const fullName = player.fullName || player.full_name || 'Unknown';
              const playerType = player.playerType || player.player_type || 'Player';
              const hasDistance = 'distance' in player && player.distance !== Infinity;
              
              return (
                <div key={player.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-base">{fullName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{player.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {playerType}
                    </span>
                  </div>
                  {captainLocation && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <MapPin className="h-4 w-4" />
                      {hasDistance ? formatDistance(player.distance) : 'No location'}
                    </div>
                  )}
                  <div className="pt-2">
                    {teamMembers.has(player.id) ? (
                      <span className="w-full block text-center px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm">
                        Already Invited/Member
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvite(player.id, fullName)}
                        disabled={inviting === player.id}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition"
                      >
                        {inviting === player.id ? 'Inviting...' : 'Invite'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
