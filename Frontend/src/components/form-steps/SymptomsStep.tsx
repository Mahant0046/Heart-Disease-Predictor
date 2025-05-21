// src/components/form-steps/SymptomsStep.tsx
import React from 'react';
import { FormData } from '../../types/FormTypes';

interface SymptomsStepProps {
  formData: Pick<FormData, 'cp' | 'trestbps' | 'chol' | 'restecg' | 'thalach' | 'exang' | 'oldpeak' | 'slope'>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const SymptomsStep: React.FC<SymptomsStepProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 font-['Libre_Franklin']">Clinical Measurements & Symptoms</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="form-cp" className="block text-sm font-medium text-gray-700 mb-1">
            Chest Pain Type (cp) <span className="text-red-500">*</span>
          </label>
          <select
            id="form-cp"
            name="cp"
            value={formData.cp}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select chest pain type</option>
            {/* Based on your dataset: 0, 1, 2, 3, 4. You need to know the meaning of each.
                Assuming a common mapping for UCI like datasets:
                1: typical angina
                2: atypical angina
                3: non-anginal pain
                4: asymptomatic
                What is 0 in your dataset? If it's not one of these, you need to adjust.
                For now, I'll provide options matching common interpretations for 0-4.
                If your dataset cp=0 is 'Typical Angina', value="0". If it's 1, value="1".
            */}
            <option value="0">Value 0 (e.g., No significant pain / Different baseline)</option> 
            <option value="1">Typical Angina (Value 1)</option>
            <option value="2">Atypical Angina (Value 2)</option>
            <option value="3">Non-anginal Pain (Value 3)</option>
            <option value="4">Asymptomatic (Value 4)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Type of chest pain. Values 0-4. VERIFY MEANINGS.</p>
        </div>

        {/* trestbps, chol, restecg, thalach, exang, oldpeak are likely okay from previous version */}
        <div>
          <label htmlFor="form-trestbps" className="block text-sm font-medium text-gray-700 mb-1">
            Resting Blood Pressure (trestbps - systolic, mmHg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" id="form-trestbps" name="trestbps" value={formData.trestbps} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="e.g., 120" required min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Systolic blood pressure at rest.</p>
        </div>
        <div>
          <label htmlFor="form-chol" className="block text-sm font-medium text-gray-700 mb-1">
            Serum Cholesterol (chol, mg/dL) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" id="form-chol" name="chol" value={formData.chol} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="e.g., 200" required min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Total cholesterol level.</p>
        </div>
        <div>
          <label htmlFor="form-restecg" className="block text-sm font-medium text-gray-700 mb-1">
            Resting ECG Results (restecg) <span className="text-red-500">*</span>
          </label>
          <select
            id="form-restecg" name="restecg" value={formData.restecg} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select ECG result</option>
            <option value="0">Normal</option>
            <option value="1">Having ST-T wave abnormality</option>
            <option value="2">Showing probable/definite left ventricular hypertrophy</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Resting electrocardiographic results (0, 1, or 2).</p>
        </div>
        <div>
          <label htmlFor="form-thalach" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Heart Rate Achieved (thalach, bpm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" id="form-thalach" name="thalach" value={formData.thalach} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="e.g., 150 bpm during exercise" required min="60" max="220"
          />
          <p className="text-xs text-gray-500 mt-1">Your highest heart rate recorded, typically during an exercise test.</p>
        </div>
        <div>
          <label htmlFor="form-exang" className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Induced Angina (exang) 
          </label>
          <select
            id="form-exang" name="exang" value={formData.exang} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select (or leave blank if unknown)</option>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">0: No, 1: Yes. Backend imputes if blank.</p>
        </div>
        <div>
          <label htmlFor="form-oldpeak" className="block text-sm font-medium text-gray-700 mb-1">
            ST Depression (oldpeak) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" step="0.1" id="form-oldpeak" name="oldpeak" value={formData.oldpeak} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="e.g., 1.0" required // min="-2.6" (based on your dataset) or 0 if appropriate
          />
          <p className="text-xs text-gray-500 mt-1">ST depression by exercise relative to rest.</p>
        </div>
        <div>
          <label htmlFor="form-slope" className="block text-sm font-medium text-gray-700 mb-1">
            Slope of Peak Exercise ST Segment (slope) <span className="text-red-500">*</span>
          </label>
          <select
            id="form-slope" name="slope" value={formData.slope} onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select slope</option>
            {/* Based on your dataset: 0, 1, 2, 3. You need to know the meaning of each.
                Assuming common mapping for UCI like datasets (where 1=upsloping, 2=flat, 3=downsloping)
                and mapping your dataset's 0 to one of these or a new category.
                For now, I'll provide options matching 0,1,2,3 if these are all distinct meaningful categories.
                If your dataset's "Upsloping" was 1, this needs to be <option value="1">.
            */}
            <option value="0">Value 0 (e.g., Other/Unknown type if not up/flat/down)</option>
            <option value="1">Upsloping (Value 1)</option>
            <option value="2">Flat (Value 2)</option>
            <option value="3">Downsloping (Value 3)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">The slope of the peak exercise ST segment. Values 0-3. VERIFY MEANINGS.</p>
        </div>
      </div>
    </div>
  );
};

export default SymptomsStep;