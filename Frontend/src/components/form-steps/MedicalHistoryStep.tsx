// src/components/form-steps/MedicalHistoryStep.tsx
import React from 'react';
import { FormData } from '../../types/FormTypes';

interface MedicalHistoryStepProps {
  formData: Pick<FormData, 'diabetesType' | 'previousHeartConditions' | 'weight' | 'shortnessOfBreath' | 'oxygenSaturation' | 'smokingStatus' | 'physicalActivity' | 'familyHistory' | 'dietQuality' | 'alcoholIntake' | 'stressLevel' | 'sleepHours' | 'sleepApnea' | 'comorbidities'>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const MedicalHistoryStep: React.FC<MedicalHistoryStepProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 font-['Libre_Franklin']">Medical History</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diabetes Status */}
        <div>
          <label htmlFor="form-diabetesType" className="block text-sm font-medium text-gray-700 mb-1">
            Diabetes Status <span className="text-red-500">*</span>
          </label>
          <select
            id="form-diabetesType"
            name="diabetesType"
            value={formData.diabetesType}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select diabetes status</option>
            <option value="no">No Diabetes (FBS ≤ 120 mg/dl)</option>
            <option value="prediabetes">Prediabetes (FBS &gt; 120 mg/dl)</option>
            <option value="type1">Type 1 Diabetes</option>
            <option value="type2">Type 2 Diabetes</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Your current diabetes status affects heart disease risk assessment.</p>
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="form-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="form-weight"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="Enter your weight in kilograms"
            required
            min="20"
            max="300"
          />
          <p className="text-xs text-gray-500 mt-1">Your current weight helps assess BMI and related risks.</p>
        </div>

        {/* Shortness of Breath */}
        <div>
          <label htmlFor="form-shortnessOfBreath" className="block text-sm font-medium text-gray-700 mb-1">
            Experience Shortness of Breath? <span className="text-red-500">*</span>
          </label>
          <select
            id="form-shortnessOfBreath"
            name="shortnessOfBreath"
            value={formData.shortnessOfBreath}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select option</option>
            <option value="never">Never</option>
            <option value="occasional">Occasionally (during heavy exercise)</option>
            <option value="frequent">Frequently (during normal activities)</option>
            <option value="constant">Constantly (even at rest)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Frequency of shortness of breath episodes.</p>
        </div>

        {/* Oxygen Saturation */}
        <div>
          <label htmlFor="form-oxygenSaturation" className="block text-sm font-medium text-gray-700 mb-1">
            Oxygen Saturation Level (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="form-oxygenSaturation"
            name="oxygenSaturation"
            value={formData.oxygenSaturation}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="Enter your oxygen saturation level"
            required
            min="70"
            max="100"
          />
          <p className="text-xs text-gray-500 mt-1">Your blood oxygen level (normal range: 95-100%).</p>
        </div>

        {/* Previous Heart Conditions */}
        <div className="md:col-span-2">
          <label htmlFor="form-previousHeartConditions" className="block text-sm font-medium text-gray-700 mb-1">
            Previous Heart Conditions or Surgeries
          </label>
          <textarea
            id="form-previousHeartConditions"
            name="previousHeartConditions"
            value={formData.previousHeartConditions}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="Please list any previous heart conditions, surgeries, or procedures (e.g., bypass surgery, heart attack, stent placement, pacemaker)"
            rows={3}
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">Include any relevant heart-related medical history.</p>
        </div>

        {/* Family History */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family History of Heart Disease
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="family-history-father"
                name="familyHistoryFather"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="family-history-father" className="ml-2 block text-sm text-gray-700">
                Father had heart disease before age 55
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="family-history-mother"
                name="familyHistoryMother"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="family-history-mother" className="ml-2 block text-sm text-gray-700">
                Mother had heart disease before age 65
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="family-history-siblings"
                name="familyHistorySiblings"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="family-history-siblings" className="ml-2 block text-sm text-gray-700">
                Siblings with heart disease
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="family-history-grandparents"
                name="familyHistoryGrandparents"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="family-history-grandparents" className="ml-2 block text-sm text-gray-700">
                Grandparents with heart disease
              </label>
            </div>
          </div>
        </div>

        {/* Lifestyle Factors */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lifestyle Factors
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smoking"
                name="smoking"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="smoking" className="ml-2 block text-sm text-gray-700">
                Current or former smoker
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="alcohol"
                name="alcohol"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="alcohol" className="ml-2 block text-sm text-gray-700">
                Regular alcohol consumption
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sedentary"
                name="sedentary"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="sedentary" className="ml-2 block text-sm text-gray-700">
                Sedentary lifestyle
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="stress"
                name="stress"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="stress" className="ml-2 block text-sm text-gray-700">
                High stress levels
              </label>
            </div>
          </div>
        </div>

        {/* Smoking Status */}
        <div>
          <label htmlFor="form-smokingStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Do you currently smoke?
          </label>
          <select
            id="form-smokingStatus"
            name="smokingStatus"
            value={formData.smokingStatus || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Smoking is a major risk factor for heart disease.</p>
        </div>

        {/* Physical Activity */}
        <div>
          <label htmlFor="form-physicalActivity" className="block text-sm font-medium text-gray-700 mb-1">
            Days of physical activity per week
          </label>
          <input
            type="number"
            id="form-physicalActivity"
            name="physicalActivity"
            value={formData.physicalActivity || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            min="0"
            max="7"
            placeholder="e.g. 3"
          />
          <p className="text-xs text-gray-500 mt-1">Regular exercise lowers heart disease risk.</p>
        </div>

        {/* Family History */}
        <div>
          <label htmlFor="form-familyHistory" className="block text-sm font-medium text-gray-700 mb-1">
            Family history of heart disease?
          </label>
          <select
            id="form-familyHistory"
            name="familyHistory"
            value={formData.familyHistory || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Family history increases your risk.</p>
        </div>

        {/* Diet Quality */}
        <div>
          <label htmlFor="form-dietQuality" className="block text-sm font-medium text-gray-700 mb-1">
            How would you rate your diet quality?
          </label>
          <select
            id="form-dietQuality"
            name="dietQuality"
            value={formData.dietQuality || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select</option>
            <option value="good">Good (lots of fruits/veggies, low processed foods)</option>
            <option value="average">Average</option>
            <option value="poor">Poor (high processed foods, high salt/fat)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Diet is a modifiable risk factor.</p>
        </div>

        {/* Alcohol Intake */}
        <div>
          <label htmlFor="form-alcoholIntake" className="block text-sm font-medium text-gray-700 mb-1">
            Alcohol intake (drinks per week)
          </label>
          <input
            type="number"
            id="form-alcoholIntake"
            name="alcoholIntake"
            value={formData.alcoholIntake || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            min="0"
            max="50"
            placeholder="e.g. 2"
          />
          <p className="text-xs text-gray-500 mt-1">Excessive alcohol increases risk.</p>
        </div>

        {/* Stress Level */}
        <div>
          <label htmlFor="form-stressLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Stress level
          </label>
          <select
            id="form-stressLevel"
            name="stressLevel"
            value={formData.stressLevel || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Chronic stress impacts heart health.</p>
        </div>

        {/* Sleep Hours */}
        <div>
          <label htmlFor="form-sleepHours" className="block text-sm font-medium text-gray-700 mb-1">
            Average hours of sleep per night
          </label>
          <input
            type="number"
            id="form-sleepHours"
            name="sleepHours"
            value={formData.sleepHours || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            min="3"
            max="14"
            placeholder="e.g. 7"
          />
          <p className="text-xs text-gray-500 mt-1">Poor sleep is linked to heart disease.</p>
        </div>

        {/* Sleep Apnea */}
        <div>
          <label htmlFor="form-sleepApnea" className="block text-sm font-medium text-gray-700 mb-1">
            Do you have sleep apnea?
          </label>
          <select
            id="form-sleepApnea"
            name="sleepApnea"
            value={formData.sleepApnea || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Sleep apnea increases cardiovascular risk.</p>
        </div>

        {/* Comorbidities */}
        <div className="md:col-span-2">
          <label htmlFor="form-comorbidities" className="block text-sm font-medium text-gray-700 mb-1">
            Other medical conditions (comorbidities)
          </label>
          <input
            type="text"
            id="form-comorbidities"
            name="comorbidities"
            value={formData.comorbidities || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="e.g. diabetes, kidney disease, etc."
          />
          <p className="text-xs text-gray-500 mt-1">List any other chronic conditions.</p>
        </div>

        {/* Information Notice */}
        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            <i className="fas fa-info-circle mr-2"></i> Important Information
          </h4>
          <p className="text-sm text-gray-700">
            Your medical history helps our machine learning model provide a more accurate heart disease risk assessment. 
            All information is kept confidential and processed securely. Please provide accurate information for the best results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryStep;