import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import type { User } from '@/types/api.types';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendDialog, setSuspendDialog] = useState<{ userId: string; userName: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading all users...');
      
      const response = await userService.getAll();
      const usersData = Array.isArray(response) ? response : (response.data || []);
      
      console.log('✅ Users loaded:', usersData.length);
      setUsers(usersData);
    } catch (err: any) {
      console.error('❌ Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    // Prevent self-blocking
    if (userId === currentUser?.id) {
      alert('You cannot block your own account');
      return;
    }

    const action = currentlyBlocked ? 'unblock' : 'block';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      setActionLoading(userId);
      
      if (currentlyBlocked) {
        await userService.unblock(userId);
        console.log('✅ User unblocked');
      } else {
        await userService.block(userId);
        console.log('✅ User blocked');
      }
      
      // Update local state immediately
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isBlocked: !currentlyBlocked } : u
      ));
      
      alert(`User ${action}ed successfully!`);
      
    } catch (err: any) {
      console.error(`❌ Failed to ${action} user:`, err);
      alert(err.response?.data?.message || err.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string, currentlySuspended: boolean, userName: string) => {
    // Prevent self-suspension
    if (userId === currentUser?.id) {
      alert('You cannot suspend your own account');
      return;
    }

    if (currentlySuspended) {
      // Unsuspend
      if (!confirm(`Are you sure you want to unsuspend "${userName}"?`)) return;

      try {
        setActionLoading(userId);
        await userService.unsuspend(userId);
        
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isSuspended: false, suspendReason: undefined } : u
        ));
        
        alert('User unsuspended successfully!');
        
      } catch (err: any) {
        console.error('❌ Failed to unsuspend user:', err);
        alert(err.response?.data?.message || err.message || 'Failed to unsuspend user');
      } finally {
        setActionLoading(null);
      }
    } else {
      // Open suspend dialog
      setSuspendDialog({ userId, userName });
    }
  };

  const handleSuspendConfirm = async () => {
    if (!suspendDialog) return;

    try {
      setActionLoading(suspendDialog.userId);
      await userService.suspend(suspendDialog.userId, suspendReason || undefined);
      
      setUsers(users.map(u => 
        u.id === suspendDialog.userId ? { 
          ...u, 
          isSuspended: true, 
          suspendReason: suspendReason || undefined 
        } : u
      ));
      
      alert('User suspended successfully!');
      setSuspendDialog(null);
      setSuspendReason('');
      
    } catch (err: any) {
      console.error('❌ Failed to suspend user:', err);
      alert(err.response?.data?.message || err.message || 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Prevent self-deletion
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm(`⚠️ DELETE USER: ${userName}?\n\nThis action cannot be undone! All user data will be permanently deleted.`)) {
      return;
    }

    // Double confirmation for safety
    const confirmation = prompt('Type "DELETE" to confirm deletion:');
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    try {
      setActionLoading(userId);
      await userService.delete(userId);
      
      // Remove from local state
      setUsers(users.filter(u => u.id !== userId));
      
      alert('User deleted successfully!');
      
    } catch (err: any) {
      console.error('❌ Failed to delete user:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const getUserStatus = (user: User) => {
    if ((user as any).isBlocked) return { label: 'Blocked', color: 'bg-red-100 text-red-800' };
    if ((user as any).isSuspended) return { label: 'Suspended', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const filteredUsers = users.filter(user => {
    const fullName = user.fullName || user.full_name || '';
    const email = user.email || '';
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    const userRole = user.role || '';
    const matchesRole = roleFilter === 'ALL' || userRole.toUpperCase() === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-gray-600">View and manage all users ({users.length} total)</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CAPTAIN">Captain</option>
          <option value="PLAYER">Player</option>
        </select>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{users.filter(u => (u.role || '').toUpperCase() === 'ADMIN').length}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{users.filter(u => (u.role || '').toUpperCase() === 'CAPTAIN').length}</div>
          <div className="text-sm text-gray-600">Captains</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{users.filter(u => (u.role || '').toUpperCase() === 'PLAYER').length}</div>
          <div className="text-sm text-gray-600">Players</div>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const fullName = user.fullName || user.full_name || 'Unknown';
                  const email = user.email || '';
                  const role = (user.role || '').toUpperCase();
                  const playerType = user.playerType || user.player_type || '-';
                  const createdAt = user.createdAt || user.created_at || '';
                  const isCurrentUser = user.id === currentUser?.id;
                  const status = getUserStatus(user);
                  const isCurrentlyLoading = actionLoading === user.id;
                  const isBlocked = (user as any).isBlocked || false;
                  const isSuspended = (user as any).isSuspended || false;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{fullName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          role === 'CAPTAIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {playerType}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${status.color}`}>
                            {status.label}
                          </span>
                          {isSuspended && (user as any).suspendReason && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={(user as any).suspendReason}>
                              Reason: {(user as any).suspendReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {!isCurrentUser ? (
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {/* Block/Unblock Button */}
                            <button
                              onClick={() => handleBlockUser(user.id, isBlocked)}
                              disabled={isCurrentlyLoading}
                              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition ${
                                isBlocked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={isBlocked ? 'Unblock User' : 'Block User'}
                            >
                              {isCurrentlyLoading ? '...' : isBlocked ? 'Unblock' : 'Block'}
                            </button>

                            {/* Suspend/Unsuspend Button */}
                            <button
                              onClick={() => handleSuspendUser(user.id, isSuspended, fullName)}
                              disabled={isCurrentlyLoading}
                              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition ${
                                isSuspended
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={isSuspended ? 'Unsuspend User' : 'Suspend User'}
                            >
                              {isCurrentlyLoading ? '...' : isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(user.id, fullName)}
                              disabled={isCurrentlyLoading}
                              className="px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              title="Delete User"
                            >
                              {isCurrentlyLoading ? '...' : 'Delete'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Current User</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspend Reason Dialog */}
      {suspendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Suspend User</h2>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to suspend "{suspendDialog.userName}"? Please provide a reason (optional).
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Reason for Suspension (Optional)</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSuspendDialog(null);
                  setSuspendReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={actionLoading === suspendDialog.userId}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendConfirm}
                disabled={actionLoading === suspendDialog.userId}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {actionLoading === suspendDialog.userId ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
