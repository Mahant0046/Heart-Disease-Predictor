import React from 'react';
import {
  calculatePasswordStrength,
  getPasswordStrengthText,
  getPasswordStrengthColor // This function is now used for the bar color
} from './validation';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  // No need to check for !password here, as parent component might want to show "Enter a password"
  // The calculatePasswordStrength handles empty string.

  const strength = calculatePasswordStrength(password);
  const strengthText = getPasswordStrengthText(strength);
  const barColorClass = getPasswordStrengthColor(strength); // Use the function from validation.ts

  // Only render if password has some length, or always show for feedback
  if (!password && strength === 0) { // Or some other condition to hide when empty
    return (
        <div className="mt-2">
             <p className="mt-1 text-xs text-gray-500">
                Use 8+ characters with a mix of letters, numbers & symbols.
            </p>
        </div>
    );
  }


  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">Password strength:</span>
        {/* Dynamically set text color based on strengthColor output (which is a bg- class) */}
        <span className={`text-xs font-medium ${barColorClass.replace('bg-', 'text-')}`}>
          {strengthText}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${barColorClass}`}
          style={{ width: `${(strength / 5) * 100}%` }} // Assuming max strength is 5
        ></div>
      </div>
      {password && strength < 3 && ( // Show hint only if password entered and weak
        <p className="mt-1 text-xs text-yellow-600">
          Consider making your password stronger.
        </p>
      )}
       {password && strength >=3 && ( // Default hint if password is okay or strong
        <p className="mt-1 text-xs text-gray-500">
          Use 8+ characters with a mix of letters, numbers & symbols.
        </p>
      )}
    </div>
  );
};

export default PasswordStrength;