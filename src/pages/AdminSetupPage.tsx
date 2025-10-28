import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { calculatePasswordStrength } from '@/utils/passwordStrength';

export const AdminSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    setup_code: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSetupCode = (text: string): string => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
    }
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'setup_code') {
      setFormData((prev) => ({ ...prev, [field]: formatSetupCode(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.setup_code || !formData.password) {
      setError('All fields are required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }

    const setupCodePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!setupCodePattern.test(formData.setup_code)) {
      setError('Setup code must be in format XXXX-XXXX');
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
      const result = await authService.setupAccount({
        email: formData.email.toLowerCase().trim(),
        setup_code: formData.setup_code,
        password: formData.password,
      });

      // Store auth data
      authService.setAuthData(result.token, result.user);

      // Refresh auth context
      await checkAuth();

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Setup account error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to setup account. Please check your setup code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Admin Account Setup</CardTitle>
          <CardDescription className="text-center">
            Complete your account setup by entering your email and setup code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_code">Setup Code</Label>
              <Input
                id="setup_code"
                type="text"
                value={formData.setup_code}
                onChange={(e) => handleInputChange('setup_code', e.target.value)}
                placeholder="XXXX-XXXX"
                maxLength={9}
                disabled={loading}
                required
                className="font-mono text-lg tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 8-character code provided by your system administrator
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
                required
                minLength={8}
              />
              {formData.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            calculatePasswordStrength(formData.password).score >= level
                              ? calculatePasswordStrength(formData.password).color
                              : '#E5E7EB',
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: calculatePasswordStrength(formData.password).color }}
                  >
                    {calculatePasswordStrength(formData.password).label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                placeholder="Re-enter your password"
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Need help? Contact your system administrator.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
