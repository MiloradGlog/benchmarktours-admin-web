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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      } else {
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'User'
        });
      }
      setError(null);
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

    if (mode === 'create' && !formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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
        await userService.createUser(formData);
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
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
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

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === 'edit' && '(leave blank to keep current)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={mode === 'create' ? 'Minimum 6 characters' : 'Leave blank to keep current'}
              disabled={loading}
              required={mode === 'create'}
              minLength={6}
            />
          </div>

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
      </DialogContent>
    </Dialog>
  );
};