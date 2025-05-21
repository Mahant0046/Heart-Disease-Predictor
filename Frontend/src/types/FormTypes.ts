// src/types/FormTypes.ts
export interface FormData {
  age: string;
  sex: string;
  cp: string;
  trestbps: string;
  chol: string;
  fbs: string; // <<<< Make this non-optional (string "0" or "1")
  restecg: string;
  thalach: string;
  exang: string;
  oldpeak: string;
  slope: string;
  diabetesType: string; // Used to derive fbs

  weight?: string;
  previousHeartConditions?: string;
  shortnessOfBreath?: string;
  oxygenSaturation?: string;
  // --- New risk factor fields ---
  systolicBP?: string;
  diastolicBP?: string;
  height?: string;
  smokingStatus?: string; // 'yes' | 'no'
  physicalActivity?: string; // days per week
  familyHistory?: string; // 'yes' | 'no'
  dietQuality?: string; // e.g. 'good', 'average', 'poor'
  alcoholIntake?: string; // drinks per week
  stressLevel?: string; // 'low', 'medium', 'high'
  sleepHours?: string;
  sleepApnea?: string; // 'yes' | 'no'
  comorbidities?: string; // comma-separated
}

export interface AssessmentResult {
  prediction: number;
  interpretation: string;
  probability_of_heart_disease: number | null;
  riskLevel: 'low' | 'medium' | 'high';
  riskPercentage: number;
  accuracyPercentage: number;
  recommendations?: string[]; // Optional array of recommendations
}