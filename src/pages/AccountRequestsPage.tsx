import React, { useState, useEffect } from 'react';
import { passwordResetService } from '@/services/passwordResetService';
import { PasswordResetRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Copy, XCircle, RefreshCcw, AlertCircle, UserX, KeyRound, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

interface AccountDeletionRequest {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'completed' | 'dismissed';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const AccountRequestsPage: React.FC = () => {
  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('password-resets');
  const [setupCodeModal, setSetupCodeModal] = useState<{
    isOpen: boolean;
    setupCode: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [deletionNotes, setDeletionNotes] = useState<{
    isOpen: boolean;
    request: AccountDeletionRequest | null;
    notes: string;
  }>({ isOpen: false, request: null, notes: '' });
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPasswordResets = async (status?: 'pending' | 'completed' | 'dismissed') => {
    try {
      setLoading(true);
      setError(null);
      const data = await passwordResetService.getPasswordResets(status);
      setPasswordResets(data);
    } catch (err: any) {
      console.error('Error fetching password reset requests:', err);
      setError(err.response?.data?.error || 'Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletionRequests = async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/account-deletion-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: status ? { status } : {}
        }
      );
      setDeletionRequests(response.data);
    } catch (err: any) {
      console.error('Error fetching deletion requests:', err);
      setError(err.response?.data?.error || 'Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'password-resets') {
      fetchPasswordResets('pending');
    } else if (activeTab === 'deletion-requests') {
      fetchDeletionRequests('pending');
    }
  }, [activeTab]);

  const handlePasswordResetComplete = async (request: PasswordResetRequest) => {
    try {
      setActionLoading(request.id);
      const result = await passwordResetService.completeResetRequest(request.id);

      setSetupCodeModal({
        isOpen: true,
        setupCode: result.setup_code,
        userName: request.user_name,
        userEmail: request.user_email,
      });

      await fetchPasswordResets('pending');
    } catch (err: any) {
      console.error('Error completing request:', err);
      setError(err.response?.data?.error || 'Failed to complete request');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePasswordResetDismiss = async (requestId: string) => {
    if (!confirm('Are you sure you want to dismiss this password reset request?')) {
      return;
    }

    try {
      setActionLoading(requestId);
      await passwordResetService.dismissResetRequest(requestId, 'Dismissed by admin');
      await fetchPasswordResets('pending');
    } catch (err: any) {
      console.error('Error dismissing request:', err);
      setError(err.response?.data?.error || 'Failed to dismiss request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletionApprove = (request: AccountDeletionRequest) => {
    setDeletionNotes({
      isOpen: true,
      request,
      notes: ''
    });
  };

  const confirmDeletionApproval = async () => {
    if (!deletionNotes.request) return;

    try {
      setActionLoading(deletionNotes.request.id);
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/account-deletion-requests/${deletionNotes.request.id}/approve`,
        { admin_notes: deletionNotes.notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeletionNotes({ isOpen: false, request: null, notes: '' });
      await fetchDeletionRequests('pending');
    } catch (err: any) {
      console.error('Error approving deletion request:', err);
      setError(err.response?.data?.error || 'Failed to approve deletion request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletionDismiss = async (requestId: string) => {
    if (!confirm('Are you sure you want to dismiss this account deletion request?')) {
      return;
    }

    try {
      setActionLoading(requestId);
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/account-deletion-requests/${requestId}/dismiss`,
        { admin_notes: 'Dismissed by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchDeletionRequests('pending');
    } catch (err: any) {
      console.error('Error dismissing deletion request:', err);
      setError(err.response?.data?.error || 'Failed to dismiss request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopySetupCode = () => {
    if (setupCodeModal?.setupCode) {
      navigator.clipboard.writeText(setupCodeModal.setupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'completed':
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Dismissed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage password reset and account deletion requests
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="password-resets" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Password Resets
          </TabsTrigger>
          <TabsTrigger value="deletion-requests" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Account Deletions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password-resets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password Reset Requests</CardTitle>
              <CardDescription>
                Review and process password reset requests from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
                </div>
              ) : passwordResets.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending password reset requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passwordResets.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{request.user_name}</p>
                          <p className="text-sm text-muted-foreground">{request.user_email}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Requested {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePasswordResetComplete(request)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? 'Processing...' : 'Generate Reset Code'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePasswordResetDismiss(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deletion-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Deletion Requests</CardTitle>
              <CardDescription>
                Review and process account deletion requests from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
                </div>
              ) : deletionRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending account deletion requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deletionRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{request.user_name}</p>
                          <p className="text-sm text-muted-foreground">{request.user_email}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      {request.reason && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-sm text-gray-600">{request.reason}</p>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        Requested {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletionApprove(request)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? 'Processing...' : 'Approve Deletion'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletionDismiss(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Code Modal */}
      <Dialog open={setupCodeModal?.isOpen} onOpenChange={(open) => !open && setSetupCodeModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Code Generated</DialogTitle>
            <DialogDescription>
              Share this setup code with {setupCodeModal?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
              <code className="text-lg font-mono font-semibold">
                {setupCodeModal?.setupCode}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopySetupCode}
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This code expires in 48 hours. The user should use it to set a new password.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Notes Modal */}
      <Dialog open={deletionNotes.isOpen} onOpenChange={(open) => !open && setDeletionNotes({ isOpen: false, request: null, notes: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Account Deletion</DialogTitle>
            <DialogDescription>
              Confirm deletion for {deletionNotes.request?.user_name} ({deletionNotes.request?.user_email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will permanently delete the user's account and all associated data.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={deletionNotes.notes}
                onChange={(e) => setDeletionNotes({ ...deletionNotes, notes: e.target.value })}
                placeholder="Add any notes about this deletion..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDeletionApproval}
                disabled={actionLoading === deletionNotes.request?.id}
              >
                {actionLoading === deletionNotes.request?.id ? 'Processing...' : 'Confirm Deletion'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeletionNotes({ isOpen: false, request: null, notes: '' })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};