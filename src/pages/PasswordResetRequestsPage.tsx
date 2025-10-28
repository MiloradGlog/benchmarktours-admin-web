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
import { CheckCircle, Copy, XCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const PasswordResetRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [setupCodeModal, setSetupCodeModal] = useState<{
    isOpen: boolean;
    setupCode: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async (status?: 'pending' | 'completed' | 'dismissed') => {
    try {
      setLoading(true);
      setError(null);
      const data = await passwordResetService.getPasswordResets(status);
      setRequests(data);
    } catch (err: any) {
      console.error('Error fetching password reset requests:', err);
      setError(err.response?.data?.error || 'Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeTab as any);
  }, [activeTab]);

  const handleComplete = async (request: PasswordResetRequest) => {
    try {
      setActionLoading(request.id);
      const result = await passwordResetService.completeResetRequest(request.id);

      // Show setup code modal
      setSetupCodeModal({
        isOpen: true,
        setupCode: result.setup_code,
        userName: request.user_name,
        userEmail: request.user_email,
      });

      // Refresh the list
      await fetchRequests(activeTab as any);
    } catch (err: any) {
      console.error('Error completing request:', err);
      setError(err.response?.data?.error || 'Failed to complete request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (requestId: string) => {
    if (!confirm('Are you sure you want to dismiss this password reset request?')) {
      return;
    }

    try {
      setActionLoading(requestId);
      await passwordResetService.dismissResetRequest(requestId, 'Dismissed by admin');
      await fetchRequests(activeTab as any);
    } catch (err: any) {
      console.error('Error dismissing request:', err);
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
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800">Dismissed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Password Reset Requests</h1>
          <p className="text-muted-foreground">
            Manage user password reset requests
          </p>
        </div>
        <Button onClick={() => fetchRequests(activeTab as any)} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Loading requests...
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No {activeTab !== '' ? activeTab : ''} password reset requests found.
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{request.user_name}</CardTitle>
                      <CardDescription>{request.user_email}</CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        <strong>Requested:</strong> {formatDate(request.requested_at)}
                      </p>
                      {request.resolved_at && (
                        <p className="text-muted-foreground">
                          <strong>Resolved:</strong> {formatDate(request.resolved_at)}
                        </p>
                      )}
                      {request.notes && (
                        <p className="text-muted-foreground mt-2">
                          <strong>Notes:</strong> {request.notes}
                        </p>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleComplete(request)}
                          disabled={actionLoading === request.id}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {actionLoading === request.id ? 'Processing...' : 'Complete & Generate Code'}
                        </Button>
                        <Button
                          onClick={() => handleDismiss(request.id)}
                          disabled={actionLoading === request.id}
                          variant="outline"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Code Modal */}
      <Dialog
        open={setupCodeModal?.isOpen || false}
        onOpenChange={(open) => !open && setSetupCodeModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Completed</DialogTitle>
            <DialogDescription>
              A new setup code has been generated for the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="text-green-800 font-medium">Setup code generated successfully!</p>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm text-gray-600 mb-2">Setup Code:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold text-gray-900 flex-1">
                        {setupCodeModal?.setupCode}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopySetupCode}
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Share this code with <strong>{setupCodeModal?.userName}</strong> ({setupCodeModal?.userEmail}).
                    They will use it with their email to reset their password.
                  </p>
                  <p className="text-xs text-gray-500">
                    Code expires in 7 days.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={() => setSetupCodeModal(null)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
