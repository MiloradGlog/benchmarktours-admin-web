export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  color: string;
  label: string;
  score: number;
}

/**
 * Calculate password strength based on length and character variety
 * Returns a score from 0-4 and corresponding strength level
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      strength: 'weak',
      color: '#D1D5DB', // gray
      label: '',
      score: 0,
    };
  }

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 0.5; // lowercase
  if (/[A-Z]/.test(password)) score += 0.5; // uppercase
  if (/[0-9]/.test(password)) score += 0.5; // numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5; // special chars

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.round(score));

  // Determine strength level
  if (normalizedScore <= 1) {
    return {
      strength: 'weak',
      color: '#EF4444', // red
      label: 'Weak',
      score: normalizedScore,
    };
  } else if (normalizedScore === 2) {
    return {
      strength: 'fair',
      color: '#F59E0B', // orange
      label: 'Fair',
      score: normalizedScore,
    };
  } else if (normalizedScore === 3) {
    return {
      strength: 'good',
      color: '#3B82F6', // blue
      label: 'Good',
      score: normalizedScore,
    };
  } else {
    return {
      strength: 'strong',
      color: '#10B981', // green
      label: 'Strong',
      score: normalizedScore,
    };
  }
}
