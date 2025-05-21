// src/components/formSteps/PersonalInfoStep.tsx
import React from 'react';
import { FormData } from '../../types/FormTypes';

interface PersonalInfoStepProps {
  formData: Pick<FormData, 'age' | 'sex'>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 font-['Libre_Franklin']">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="form-age" className="block text-sm font-medium text-gray-700 mb-1">
            Age (Years) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="form-age"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="Enter your age"
            required
            min="1"
            max="120"
          />
          <p className="text-xs text-gray-500 mt-1">Key predictor for heart disease.</p>
        </div>
        <div>
          <label htmlFor="form-sex" className="block text-sm font-medium text-gray-700 mb-1">
            Sex <span className="text-red-500">*</span>
          </label>
          <select
            id="form-sex"
            name="sex"
            value={formData.sex}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select sex</option>
            <option value="1">Male</option>
            <option value="0">Female</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Biological sex (0: Female, 1: Male).</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;