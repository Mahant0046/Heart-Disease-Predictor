// src/components/auth/validation.ts

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  // You might add more complexity checks here (uppercase, number, symbol)
  return { isValid: true };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  return { isValid: true };
};

export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName) {
    return { isValid: false, message: 'Full name is required' };
  }
  if (fullName.trim().length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters long' };
  }
  return { isValid: true };
};

export const validateDateOfBirth = (dateOfBirth: string): ValidationResult => {
  if (!dateOfBirth) {
    return { isValid: false, message: 'Date of birth is required' };
  }
  // Assuming dateOfBirth is "YYYY-MM-DD"
  const parts = dateOfBirth.split('-');
  if (parts.length !== 3) return { isValid: false, message: 'Invalid date format. Use YYYY-MM-DD.'};

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
    return { isValid: false, message: 'Invalid date components.' };
  }

  const dob = new Date(Date.UTC(year, month, day));
  const today = new Date();
  // Compare only dates, ignoring time, by setting today to UTC midnight
  const todayUTCStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  if (dob >= todayUTCStart) {
      return { isValid: false, message: 'Date of birth cannot be today or in the future.'};
  }

  let age = todayUTCStart.getUTCFullYear() - dob.getUTCFullYear();
  const m = todayUTCStart.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && todayUTCStart.getUTCDate() < dob.getUTCDate())) {
      age--;
  }

  if (age < 18) {
    return { isValid: false, message: 'You must be at least 18 years old.' };
  }
  if (age > 120) {
    return { isValid: false, message: 'Please enter a realistic age.'};
  }
  return { isValid: true };
};


export const validateGender = (gender: string): ValidationResult => {
  if (!gender) {
    return { isValid: false, message: 'Please select your gender' };
  }
  return { isValid: true };
};

export const validateTerms = (agreeTerms: boolean): ValidationResult => {
  if (!agreeTerms) {
    return { isValid: false, message: 'Please agree to the terms and conditions' };
  }
  return { isValid: true };
};

export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber) {
    return { isValid: false, message: 'Phone number is required' };
  }
  // Basic regex: allows optional +, digits, spaces, hyphens, at least 10 digits.
  const phoneRegex = /^\+?[\d\s-]{10,}$/; 
  if (!phoneRegex.test(phoneNumber.replace(/\s|-/g, ''))) { // Remove spaces/hyphens for length check if desired
    return { isValid: false, message: 'Please enter a valid phone number (at least 10 digits).' };
  }
  return { isValid: true };
};

export const validateAddress = (address: string): ValidationResult => {
  if (!address) {
    return { isValid: false, message: 'Address is required' };
  }
  if (address.trim().length < 5) {
    return { isValid: false, message: 'Address must be at least 5 characters long' };
  }
  return { isValid: true };
};

export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9\s]/.test(password)) strength += 1; // Exclude space from special char check
  return Math.min(strength, 5); // Cap at 5
};

export const getPasswordStrengthText = (strength: number): string => {
  if (strength <= 1) return 'Very Weak';
  if (strength === 2) return 'Weak';
  if (strength === 3) return 'Medium';
  if (strength === 4) return 'Strong';
  return 'Very Strong';
};

export const getPasswordStrengthColor = (strength: number): string => {
  if (strength <= 1) return 'bg-red-500';
  if (strength === 2) return 'bg-orange-500';
  if (strength === 3) return 'bg-yellow-500';
  if (strength === 4) return 'bg-lime-500';
  return 'bg-green-500';
};