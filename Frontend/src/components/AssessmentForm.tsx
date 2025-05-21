// src/components/AssessmentForm.tsx
import React, { useState, FormEvent, ChangeEvent, useCallback } from 'react';
import { FormData, AssessmentResult } from '../types/FormTypes';
import PersonalInfoStep from './form-steps/PersonalInfoStep';
import SymptomsStep from './form-steps/SymptomsStep';
import MedicalHistoryStep from './form-steps/MedicalHistoryStep';
import BloodReportStep from './form-steps/BloodReportStep';
import Results from './form-steps/Results';
import { predictHeartDisease, HeartDiseaseInput, PredictionApiResponse, uploadBloodReport } from '../services/api';

const initialFormData: FormData = {
    age: '', sex: '', cp: '', trestbps: '', chol: '',
    fbs: '0',
    restecg: '', thalach: '', exang: '', oldpeak: '', slope: '',
    diabetesType: 'no',
    weight: '', previousHeartConditions: '',
    shortnessOfBreath: '', oxygenSaturation: '',
};

const AssessmentForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formStep, setFormStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [processedMLInputData, setProcessedMLInputData] = useState<HeartDiseaseInput | null>(null);
  const [assessmentMode, setAssessmentMode] = useState<'quick' | 'full'>('quick');

  const generateRecommendations = (riskLevel: string, input: HeartDiseaseInput): string[] => {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
        // High Risk Recommendations
        recommendations.push("🚨 URGENT: Schedule an appointment with a cardiologist immediately.");
        recommendations.push("📊 Monitor your blood pressure and heart rate daily.");
        recommendations.push("💊 Take all prescribed medications as directed.");
        recommendations.push("🏥 Keep emergency contact numbers readily available.");
        recommendations.push("🚭 Stop smoking immediately if you smoke.");
        recommendations.push("🥗 Follow a strict heart-healthy diet (low sodium, low fat).");
        recommendations.push("🏃‍♂️ Exercise only under medical supervision.");
        recommendations.push("😴 Ensure 7-8 hours of quality sleep each night.");
        recommendations.push("🧘‍♂️ Practice stress management techniques daily.");
        recommendations.push("📅 Schedule regular follow-ups with your healthcare provider.");
    } else if (riskLevel === 'medium') {
        // Medium Risk Recommendations
        recommendations.push("👨‍⚕️ Schedule a comprehensive heart health checkup within a week.");
        recommendations.push("📊 Start monitoring your blood pressure regularly.");
        recommendations.push("🥗 Begin a heart-healthy diet plan.");
        recommendations.push("🏃‍♂️ Start a moderate exercise routine (30 minutes, 5 days/week).");
        recommendations.push("🚭 If you smoke, create a plan to quit.");
        recommendations.push("🧘‍♂️ Learn and practice stress management techniques.");
        recommendations.push("😴 Maintain a regular sleep schedule.");
        recommendations.push("💧 Stay hydrated and limit alcohol intake.");
        recommendations.push("📝 Keep a health journal to track your progress.");
        recommendations.push("👥 Consider joining a heart health support group.");
    } else {
        // Low Risk Recommendations
        recommendations.push("✅ Continue with regular health checkups.");
        recommendations.push("🥗 Maintain a balanced, heart-healthy diet.");
        recommendations.push("🏃‍♂️ Stay active with regular exercise.");
        recommendations.push("😴 Get adequate sleep (7-8 hours per night).");
        recommendations.push("🧘‍♂️ Practice stress management techniques.");
        recommendations.push("💧 Stay hydrated and limit alcohol consumption.");
        recommendations.push("🚭 Avoid smoking and secondhand smoke.");
        recommendations.push("📊 Monitor your health metrics regularly.");
        recommendations.push("👥 Stay connected with your healthcare provider.");
        recommendations.push("📚 Educate yourself about heart health maintenance.");
    }

    return recommendations;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = useCallback((stepToValidate: number): boolean => {
    setPredictionError(null);
    if (stepToValidate === 1) {
        if (!formData.age.trim() || parseInt(formData.age, 10) <= 0 || parseInt(formData.age, 10) > 120) {
            setPredictionError("Please enter your age (1-120)."); 
            return false;
        }
        if (formData.sex === "") { 
            setPredictionError("Please select your sex."); 
            return false; 
        }
        return true;
    } else if (stepToValidate === 2 && assessmentMode === 'full') {
        // Validate required fields for full assessment
        const requiredFields: Array<keyof Pick<FormData, 'cp' | 'trestbps' | 'restecg' | 'thalach' | 'oldpeak' | 'slope'>> =
            ['cp', 'trestbps', 'restecg', 'thalach', 'oldpeak', 'slope'];

        for (const field of requiredFields) {
            if (!formData[field] || String(formData[field]).trim() === "") {
                setPredictionError(`Please fill in the '${field}' field.`);
                return false;
            }
        }
        return true;
    } else if (stepToValidate === 3 && assessmentMode === 'full') {
        if (formData.diabetesType === "") {
            setPredictionError("Please select your diabetes status.");
            return false;
        }
        return true;
    }
    return true;
  }, [formData, assessmentMode]);

  const handleFileUpload = async (file: File) => {
    try {
      setPredictionError(null);
      const result = await uploadBloodReport(file);
      if (result.success && result.extracted) {
        // Update form data with extracted values
        setFormData(prev => ({
          ...prev,
          chol: result.extracted.chol?.toString() || prev.chol,
          fbs: result.extracted.fbs || prev.fbs,
        }));
        
        if (assessmentMode === 'quick') {
          // For quick assessment, automatically get results
          setPredictionError("✅ Blood report processed successfully! Getting your assessment...");
          setTimeout(() => {
            handleFormSubmit(new Event('submit') as any);
          }, 1000);
        } else {
          // For full assessment, just show success message
          setPredictionError("✅ Blood report processed successfully! Please fill in the remaining fields.");
        }
      }
    } catch (error: any) {
      setPredictionError(error.message || 'Failed to process blood report');
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(assessmentMode === 'quick' ? 1 : 3)) return;

    setLoadingPrediction(true);
    setPredictionError(null);
    setAssessmentResult(null);

    // Prepare input data based on assessment mode
    const mlInput: HeartDiseaseInput = {
        age: parseInt(formData.age, 10),
        sex: parseInt(formData.sex, 10),
        cp: parseInt(formData.cp, 10) || 0,
        trestbps: parseInt(formData.trestbps, 10) || 0,
        chol: formData.chol ? parseFloat(formData.chol) : 0,
        fbs: formData.fbs === "1" ? 1 : 0,
        restecg: parseInt(formData.restecg, 10) || 0,
        thalach: parseInt(formData.thalach, 10) || 0,
        exang: formData.exang === "1" ? 1 : 0,
        oldpeak: parseFloat(formData.oldpeak) || 0.0,
        slope: parseInt(formData.slope, 10) || 0,
        // Additional risk factors
        systolicBP: formData.systolicBP ? parseInt(formData.systolicBP, 10) : undefined,
        diastolicBP: formData.diastolicBP ? parseInt(formData.diastolicBP, 10) : undefined,
        height: formData.height ? parseInt(formData.height, 10) : undefined,
        weight: formData.weight ? parseInt(formData.weight, 10) : undefined,
        smokingStatus: formData.smokingStatus || undefined,
        physicalActivity: formData.physicalActivity ? parseInt(formData.physicalActivity, 10) : undefined,
        familyHistory: formData.familyHistory || undefined,
        dietQuality: formData.dietQuality || undefined,
        alcoholIntake: formData.alcoholIntake ? parseInt(formData.alcoholIntake, 10) : undefined,
        stressLevel: formData.stressLevel || undefined,
        sleepHours: formData.sleepHours ? parseInt(formData.sleepHours, 10) : undefined,
        sleepApnea: formData.sleepApnea || undefined,
        comorbidities: formData.comorbidities || undefined,
    };

    try {
        console.log("Submitting data:", mlInput);
        const apiResponse: PredictionApiResponse = await predictHeartDisease(mlInput);
        console.log("API Response:", apiResponse);

        const probability = typeof apiResponse.probability_of_heart_disease === 'number' 
            ? apiResponse.probability_of_heart_disease 
            : null;
        
        const riskPercentageDisplay = probability ? Math.round(probability * 100) : 
            (apiResponse.prediction === 1 ? 75 : 15);

        const riskLevelText: AssessmentResult['riskLevel'] = 
            riskPercentageDisplay >= 70 ? 'high' :
            riskPercentageDisplay >= 40 ? 'medium' : 'low';

        // Enhanced recommendations based on input data
        const recommendations = generateRecommendations(riskLevelText, mlInput);

        const currentResult: AssessmentResult = {
            ...apiResponse,
            prediction: apiResponse.prediction,
            interpretation: apiResponse.interpretation || 
                (apiResponse.prediction === 1 ? "Heart Disease Risk Detected" : "Low Heart Disease Risk"),
            probability_of_heart_disease: probability,
            riskLevel: riskLevelText,
            riskPercentage: riskPercentageDisplay,
            accuracyPercentage: assessmentMode === 'quick' ? 75 : 95, // Adjusted accuracy percentages
            recommendations
        };
        setAssessmentResult(currentResult);
        setShowResults(true);
    } catch (err: any) {
        console.error("Prediction error:", err);
        setPredictionError(err.error || err.message || "Failed to get assessment. Please try again.");
        setShowResults(false);
    } finally {
        setLoadingPrediction(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormStep(1);
    setShowResults(false);
    setAssessmentResult(null);
    setPredictionError(null);
    setProcessedMLInputData(null);
  };

  const getProgressPercentage = () => (formStep / 3) * 100;

  const nextStep = () => {
    if (validateStep(formStep)) {
      setFormStep((prev: number) => Math.min(prev + 1, 3));
      setPredictionError(null);
    }
  };

  const prevStep = () => {
    setFormStep((prev: number) => Math.max(prev - 1, 1));
    setPredictionError(null);
  };

  return (
    <section id="assessment-form" className="py-16 bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 font-['Libre_Franklin']">
            Heart Health Risk Assessment
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-['Libre_Franklin']">
            Choose your assessment mode and enter your information below.
          </p>
          
          {/* Assessment Mode Selection */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => {
                setAssessmentMode('quick');
                setFormStep(1);
                setShowResults(false);
                setPredictionError(null);
              }}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                assessmentMode === 'quick'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Quick Assessment
            </button>
            <button
              onClick={() => {
                setAssessmentMode('full');
                setFormStep(1);
                setShowResults(false);
                setPredictionError(null);
              }}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                assessmentMode === 'full'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Full Assessment
            </button>
          </div>
        </div>

        {predictionError && !loadingPrediction && (
          <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-md shadow-md ${
            predictionError.includes('✅') ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 
            'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}>
            <p>{predictionError}</p>
          </div>
        )}

        {!showResults ? (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-6 sm:p-8">
              {assessmentMode === 'quick' ? (
                // Quick Assessment Form
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter your age"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sex <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="sex"
                          value={formData.sex}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          required
                        >
                          <option value="">Select sex</option>
                          <option value="1">Male</option>
                          <option value="0">Female</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">
                      <i className="fas fa-file-medical mr-2"></i>
                      Upload Blood Report
                    </h3>
                    <p className="text-blue-600 mb-4">
                      Upload your blood test report to get your quick heart disease risk assessment.
                    </p>
                    <BloodReportStep
                      formData={formData}
                      onInputChange={handleInputChange}
                      onFileUpload={handleFileUpload}
                    />
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button
                      type="submit"
                      disabled={loadingPrediction}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-60"
                    >
                      {loadingPrediction ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Analyzing...
                        </div>
                      ) : (
                        <>Get Quick Assessment <i className="fas fa-heartbeat ml-2"></i></>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                // Full Assessment Form
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="mb-8">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-700 h-2.5 rounded-full transition-all duration-500 ease-in-out relative"
                        style={{ width: `${getProgressPercentage()}%` }}
                      >
                        <div className="absolute -right-1.5 -top-1.5 w-5 h-5 rounded-full bg-white border-2 border-red-600 shadow-md"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs sm:text-sm text-gray-500">
                      <span className={formStep >= 1 ? "text-red-600 font-medium" : ""}>Personal Info</span>
                      <span className={formStep >= 2 ? "text-red-600 font-medium" : ""}>Clinical Data</span>
                      <span className={formStep >= 3 ? "text-red-600 font-medium" : ""}>Medical History</span>
                    </div>
                  </div>

                  {formStep === 1 && (
                    <PersonalInfoStep
                      formData={{
                        age: formData.age,
                        sex: formData.sex
                      }}
                      handleInputChange={handleInputChange}
                    />
                  )}
                  {formStep === 2 && (
                    <SymptomsStep
                      formData={formData}
                      handleInputChange={handleInputChange}
                    />
                  )}
                  {formStep === 3 && (
                    <MedicalHistoryStep
                      formData={{
                        diabetesType: formData.diabetesType,
                        previousHeartConditions: formData.previousHeartConditions,
                        weight: formData.weight,
                        shortnessOfBreath: formData.shortnessOfBreath,
                        oxygenSaturation: formData.oxygenSaturation,
                        smokingStatus: formData.smokingStatus,
                        physicalActivity: formData.physicalActivity,
                        familyHistory: formData.familyHistory,
                        dietQuality: formData.dietQuality,
                        alcoholIntake: formData.alcoholIntake,
                        stressLevel: formData.stressLevel,
                        sleepHours: formData.sleepHours,
                        sleepApnea: formData.sleepApnea,
                        comorbidities: formData.comorbidities,
                      }}
                      handleInputChange={handleInputChange}
                    />
                  )}

                  <div className="mt-10 flex justify-between items-center">
                    {formStep > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2.5 px-6 rounded-lg transition"
                      >
                        <i className="fas fa-arrow-left mr-2"></i> Previous
                      </button>
                    ) : (
                      <div />
                    )}

                    {formStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="ml-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition"
                      >
                        Next <i className="fas fa-arrow-right ml-2"></i>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loadingPrediction}
                        className="ml-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-60"
                      >
                        {loadingPrediction ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Analyzing...
                          </div>
                        ) : (
                          <>Get Full Assessment <i className="fas fa-heartbeat ml-2"></i></>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          assessmentResult && (
            <Results
              result={assessmentResult}
              processedMLInput={processedMLInputData || {
                age: parseInt(formData.age, 10),
                sex: parseInt(formData.sex, 10),
                cp: assessmentMode === 'quick' ? 0 : parseInt(formData.cp, 10),
                trestbps: assessmentMode === 'quick' ? 120 : parseInt(formData.trestbps, 10),
                chol: formData.chol ? parseFloat(formData.chol) : 200,
                fbs: assessmentMode === 'quick' ? 
                    (formData.fbs === "1" ? 1 : 0) : 
                    (formData.diabetesType && formData.diabetesType !== 'no' ? 1 : 0),
                restecg: assessmentMode === 'quick' ? 0 : parseInt(formData.restecg, 10),
                thalach: assessmentMode === 'quick' ? 150 : parseInt(formData.thalach, 10),
                exang: assessmentMode === 'quick' ? 0 : (formData.exang === "1" ? 1 : 0),
                oldpeak: assessmentMode === 'quick' ? 0.0 : parseFloat(formData.oldpeak),
                slope: assessmentMode === 'quick' ? 1 : parseInt(formData.slope, 10),
              }}
              onReset={resetForm}
            />
          )
        )}
      </div>
    </section>
  );
};

export default AssessmentForm;