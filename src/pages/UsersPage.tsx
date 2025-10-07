import React, { useState, useEffect } from 'react';
import { User, UserStats } from '@/types/auth';
import { userService } from '@/services/userService';
import { UserList } from '@/components/users/UserList';
import { UserDialog } from '@/components/users/UserDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Shield, MapPin, RefreshCw } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    user: User | null;
  }>({
    isOpen: false,
    mode: 'create',
    user: null
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    loading: boolean;
  }>({
    isOpen: false,
    user: null,
    loading: false
  });
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        userService.getAllUsers(),
        userService.getUserStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = () => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      user: null
    });
  };

  const handleEditUser = (user: User) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      user
    });
  };

  const handleDeleteUser = (user: User) => {
    setDeleteDialog({
      isOpen: true,
      user,
      loading: false
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      await userService.deleteUser(deleteDialog.user!.id);
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== deleteDialog.user!.id));
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          total: prev.total - 1,
          byRole: {
            ...prev.byRole,
            [deleteDialog.user!.role]: (prev.byRole[deleteDialog.user!.role] || 1) - 1
          }
        } : null);
      }

      setDeleteDialog({ isOpen: false, user: null, loading: false });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDialogClose = () => {
    setDialogState({
      isOpen: false,
      mode: 'create',
      user: null
    });
  };

  const handleDialogSuccess = () => {
    loadUsers(); // Reload all data after successful create/update
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; description: string }> = ({
    title,
    value,
    icon,
    description
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button 
          onClick={loadUsers} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            description="All registered users"
          />
          <StatCard
            title="Administrators"
            value={stats.byRole['Admin'] || 0}
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            description="System administrators"
          />
          <StatCard
            title="Tour Guides"
            value={stats.byRole['Guide'] || 0}
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            description="Tour guide accounts"
          />
          <StatCard
            title="Participants"
            value={stats.byRole['User'] || 0}
            icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
            description="Regular tour participants"
          />
        </div>
      )}

      {/* Users List */}
      <UserList
        users={users}
        loading={loading}
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onRefresh={loadUsers}
      />

      {/* Create/Edit User Dialog */}
      <UserDialog
        isOpen={dialogState.isOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        user={dialogState.user}
        mode={dialogState.mode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={() => !deleteDialog.loading && setDeleteDialog({ isOpen: false, user: null, loading: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deleteDialog.user && userService.getFullName(deleteDialog.user)}
              </span>
              ? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, user: null, loading: false })}
              disabled={deleteDialog.loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteDialog.loading}
            >
              {deleteDialog.loading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};