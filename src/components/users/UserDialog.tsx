import React, { useState, useEffect } from 'react';
import { User, CreateUserData, UpdateUserData } from '@/types/auth';
import { userService } from '@/services/userService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculatePasswordStrength } from '@/utils/passwordStrength';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

export const UserDialog: React.FC<UserDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'User'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSetupCode, setUseSetupCode] = useState(true);
  const [setupCode, setSetupCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          email: user.email,
          password: '', // Don't populate password for editing
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        });
        setUseSetupCode(false); // In edit mode, default to not using setup code
      } else {
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'User'
        });
        setUseSetupCode(true); // In create mode, default to using setup code
      }
      setError(null);
      setSetupCode(null);
      setCopied(false);
    }
  }, [isOpen, mode, user]);

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.first_name || !formData.last_name) {
      setError('Email, first name, and last name are required');
      return false;
    }

    // Only require password if not using setup code (or in edit mode with password provided)
    if (mode === 'create' && !useSetupCode && !formData.password) {
      setError('Password is required when not using setup code');
      return false;
    }

    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        // Prepare user data - omit password if using setup code
        const userData: CreateUserData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        };

        // Only include password if not using setup code
        if (!useSetupCode && formData.password) {
          userData.password = formData.password;
        }

        const result = await userService.createUser(userData);

        // If setup code was generated, show it to admin
        if (result.setup_code) {
          setSetupCode(result.setup_code);
          // Don't close dialog yet - let admin see and copy the code
        } else {
          // No setup code, close immediately
          onSuccess();
          onClose();
        }
      } else if (mode === 'edit' && user) {
        // For edit, only send fields that have values
        const updateData: UpdateUserData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        };

        // Only include password if it was provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await userService.updateUser(user.id, updateData);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySetupCode = () => {
    if (setupCode) {
      navigator.clipboard.writeText(setupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new user to the system. Choose their role carefully.'
              : 'Update user information. Leave password blank to keep current password.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Setup Code Success Display */}
        {setupCode ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="text-green-800 font-medium">User created successfully!</p>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm text-gray-600 mb-2">Setup Code:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold text-gray-900 flex-1">
                        {setupCode}
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
                    Share this code with <strong>{formData.first_name} {formData.last_name}</strong> ({formData.email}).
                    They will use it with their email to set their password on first login.
                  </p>
                  <p className="text-xs text-gray-500">
                    Code expires in 7 days.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={handleFinish}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="John"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Doe"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Setup Code Checkbox (only in create mode) */}
          {mode === 'create' && (
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                checked={useSetupCode}
                onCheckedChange={setUseSetupCode}
                disabled={loading}
              />
              <Label htmlFor="use-setup-code" className="text-sm font-normal cursor-pointer">
                Generate setup code (user sets password on first login)
              </Label>
            </div>
          )}

          {/* Password Field (hidden when using setup code in create mode) */}
          {!(mode === 'create' && useSetupCode) && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {mode === 'edit' && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={mode === 'create' ? 'Minimum 8 characters' : 'Leave blank to keep current'}
                disabled={loading}
                required={mode === 'create' && !useSetupCode}
                minLength={8}
              />
              {formData.password && formData.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            calculatePasswordStrength(formData.password || '').score >= level
                              ? calculatePasswordStrength(formData.password || '').color
                              : '#E5E7EB',
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: calculatePasswordStrength(formData.password || '').color }}
                  >
                    {calculatePasswordStrength(formData.password || '').label}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'Admin' | 'User' | 'Guide') => handleInputChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">Participant</SelectItem>
                <SelectItem value="Guide">Tour Guide</SelectItem>
                <SelectItem value="Admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};