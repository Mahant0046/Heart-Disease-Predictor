// src/components/form-steps/Results.tsx
import React, { useEffect, useRef, useState } from 'react'; // Added useState
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent, // Optional: if you want a legend
  DatasetComponent // If using dataset for more complex charts
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { AssessmentResult } from '../../types/FormTypes';
import { HeartDiseaseInput, getSuggestedDoctors, SuggestedDoctor, createAppointment, DoctorSuggestionResponse } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNotification } from '../../context/NotificationContext';
import { 
  LocalHospital as HospitalIcon,
  FitnessCenter as FitnessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Register necessary ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  CanvasRenderer,
  DatasetComponent
]);

interface ResultsProps {
  result: AssessmentResult;
  processedMLInput: HeartDiseaseInput;
  onReset: () => void;
}

// Define categories for feature impact visualization
type ImpactCategory = 'low' | 'moderate' | 'high' | 'very_high';

interface FeatureImpact {
    name: string;
    value: number;
    score: number;
    category: ImpactCategory;
    description: string;
}

// FeatureImpactDisplay is now the same as FeatureImpact
type FeatureImpactDisplay = FeatureImpact;

const Results: React.FC<ResultsProps> = ({ result, processedMLInput, onReset }) => {
  const chartRef = useRef<HTMLDivElement>(null); // Ref for the chart DOM element
  const notificationsShown = useRef(false);
  const { notify } = useNotification();
  const { currentUser } = useAuth();
  const [suggestedDoctors, setSuggestedDoctors] = useState<SuggestedDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  useEffect(() => {
    if (result && !notificationsShown.current) {
      notificationsShown.current = true;
      notify({
        message: `Your heart disease risk assessment is ready. Risk Level: ${result.riskLevel}`,
        type: result.riskLevel === 'low' ? 'success' : 'warning'
      });

      if (result.riskLevel === 'high') {
        setTimeout(() => {
          notify({
            message: "High risk detected! We recommend scheduling a doctor's appointment immediately.",
            type: 'warning'
          });
        }, 1000);
      }
    }
  }, [result]); // Remove notify from dependencies

  useEffect(() => {
    let myChart: echarts.ECharts | undefined;

    const initChart = () => {
      if (chartRef.current && processedMLInput) {
        myChart = echarts.init(chartRef.current);

        const getFeatureImpactDetails = (feature: string, value: number | null): FeatureImpact => {
            // Handle null values by defaulting to a low impact
            if (value === null) {
                return {
                    name: feature,
                    value: 0,
                    score: 0,
                    category: 'low',
                    description: 'No data available for this feature.'
                };
            }

            let score = 0;
            let category: ImpactCategory = 'low';
            let description = '';

            switch (feature) {
                case 'age':
                    if (value >= 65) {
                        score = 70;
                        category = 'high';
                        description = "Advanced age is a significant risk factor for heart disease.";
                    } else if (value >= 45) {
                        score = 40;
                        category = 'moderate';
                        description = "Middle age requires regular heart health monitoring.";
                    } else {
                        score = 10;
                        category = 'low';
                        description = "Younger age is generally associated with lower risk.";
                    }
                    break;

                case 'sex':
                    if (value === 1) { // Male
                        score = 30;
                        category = 'moderate';
                        description = "Males have a higher baseline risk of heart disease.";
                    } else {
                        score = 20;
                        category = 'low';
                        description = "Females generally have lower risk until menopause.";
                    }
                    break;

                case 'cp': // Chest Pain Type
                    if (value === 0) { // Typical angina
                        score = 80;
                        category = 'high';
                        description = "Typical angina is strongly associated with heart disease.";
                    } else if (value === 1) { // Atypical angina
                        score = 60;
                        category = 'moderate';
                        description = "Atypical angina requires medical evaluation.";
                    } else if (value === 2) { // Non-anginal pain
                        score = 40;
                        category = 'moderate';
                        description = "Non-anginal pain may indicate other conditions.";
                    } else if (value === 3) { // Asymptomatic
                        score = 20;
                        category = 'low';
                        description = "No chest pain is a positive sign.";
                    } else { // CP Type 4
                        score = 50;
                        category = 'moderate';
                        description = "Unusual chest pain pattern requires evaluation.";
                    }
                    break;

                case 'trestbps': // Resting Blood Pressure
                    if (value >= 180) {
                        score = 90;
                        category = 'very_high';
                        description = "Severe hypertension requires immediate attention.";
                    } else if (value >= 140) {
                        score = 70;
                        category = 'high';
                        description = "High blood pressure is a major risk factor.";
                    } else if (value >= 130) {
                        score = 50;
                        category = 'moderate';
                        description = "Elevated blood pressure should be monitored.";
                    } else if (value >= 120) {
                        score = 30;
                        category = 'moderate';
                        description = "Borderline blood pressure requires lifestyle changes.";
                    } else {
                        score = 10;
                        category = 'low';
                        description = "Normal blood pressure is good for heart health.";
                    }
                    break;

                case 'chol': // Cholesterol
                    if (value >= 300) {
                        score = 85;
                        category = 'high';
                        description = "Very high cholesterol requires medical intervention.";
                    } else if (value >= 240) {
                        score = 70;
                        category = 'high';
                        description = "High cholesterol is a significant risk factor.";
                    } else if (value >= 200) {
                        score = 50;
                        category = 'moderate';
                        description = "Borderline high cholesterol should be addressed.";
                    } else {
                        score = 10;
                        category = 'low';
                        description = "Normal cholesterol levels are good for heart health.";
                    }
                    break;

                case 'fbs': // Fasting Blood Sugar
                    if (value === 1) {
                        score = 60;
                        category = 'moderate';
                        description = "Elevated fasting blood sugar indicates metabolic issues.";
                    } else {
                        score = 10;
                        category = 'low';
                        description = "Normal fasting blood sugar is good for heart health.";
                    }
                    break;

                case 'restecg': // Resting ECG
                    if (value === 2) { // LVH
                        score = 80;
                        category = 'high';
                        description = "Left ventricular hypertrophy indicates significant heart disease risk.";
                    } else if (value === 1) { // ST-T wave abnormality
                        score = 60;
                        category = 'moderate';
                        description = "ST-T wave changes require medical evaluation.";
                    } else { // Normal
                        score = 10;
                        category = 'low';
                        description = "Normal ECG results are good for heart health.";
                    }
                    break;

                case 'thalach': // Maximum Heart Rate
                    if (value < 100) {
                        score = 80;
                        category = 'high';
                        description = "Very low maximum heart rate indicates poor cardiac function.";
                    } else if (value < 120) {
                        score = 60;
                        category = 'moderate';
                        description = "Low maximum heart rate may indicate reduced fitness or heart issues.";
                    } else if (value < 150) {
                        score = 40;
                        category = 'moderate';
                        description = "Moderate maximum heart rate is acceptable.";
                    } else {
                        score = 20;
                        category = 'low';
                        description = "Good maximum heart rate indicates healthy cardiac function.";
                    }
                    break;

                case 'exang': // Exercise Angina
                    if (value === 1) {
                        score = 85;
                        category = 'high';
                        description = "Exercise-induced angina is a strong indicator of heart disease.";
                    } else {
                        score = 10;
                        category = 'low';
                        description = "No exercise-induced angina is a positive sign.";
                    }
                    break;

                case 'oldpeak': // ST Depression
                    if (value > 2.0) {
                        score = 90;
                        category = 'very_high';
                        description = "Severe ST depression indicates significant heart disease risk.";
                    } else if (value > 1.0) {
                        score = 70;
                        category = 'high';
                        description = "Moderate ST depression requires medical attention.";
                    } else if (value > 0.5) {
                        score = 50;
                        category = 'moderate';
                        description = "Mild ST depression should be monitored.";
                    } else {
                        score = 10;
                        category = 'low';
                        description = "Normal ST segment is good for heart health.";
                    }
                    break;

                case 'slope': // ST Slope
                    if (value === 2) { // Downsloping
                        score = 75;
                        category = 'high';
                        description = "Downsloping ST segment indicates possible ischemia.";
                    } else if (value === 1) { // Flat
                        score = 50;
                        category = 'moderate';
                        description = "Flat ST segment may indicate minor issues.";
                    } else { // Upsloping
                        score = 10;
                        category = 'low';
                        description = "Upsloping ST segment is normal.";
                    }
                    break;

                default:
                    score = 0;
                    category = 'low';
                    description = "Unknown feature impact.";
            }

            return {
                name: feature,
                value: value,
                score: score,
                category: category,
                description: description
            };
        };
        
        const chartDataSource: FeatureImpactDisplay[] = [
            getFeatureImpactDetails('age', processedMLInput.age ?? null),
            getFeatureImpactDetails('sex', processedMLInput.sex ?? null),
            getFeatureImpactDetails('cp', processedMLInput.cp ?? null),
            getFeatureImpactDetails('trestbps', processedMLInput.trestbps ?? null),
            getFeatureImpactDetails('chol', processedMLInput.chol ?? null),
            getFeatureImpactDetails('fbs', processedMLInput.fbs ?? null),
            getFeatureImpactDetails('restecg', processedMLInput.restecg ?? null),
            getFeatureImpactDetails('thalach', processedMLInput.thalach ?? null),
            getFeatureImpactDetails('exang', processedMLInput.exang ?? null),
            getFeatureImpactDetails('oldpeak', processedMLInput.oldpeak ?? null),
            getFeatureImpactDetails('slope', processedMLInput.slope ?? null)
        ];

        // Sort by score for better visualization if desired, or keep original order
        // chartDataSource.sort((a, b) => b.score - a.score);

        const colorMapping: Record<ImpactCategory, string> = {
            low: '#68D391',       // Tailwind green-400
            moderate: '#F6E05E',  // Tailwind yellow-300
            high: '#F59E0B',      // Tailwind yellow-500 (amber)
            very_high: '#F56565', // Tailwind red-500
        };

        const option: echarts.EChartsCoreOption = {
          title: {
            text: 'Illustrative Feature Impact Profile',
            subtext: 'This chart shows a heuristic score for each input feature.\nIt is NOT a direct model-derived importance.',
            left: 'center',
            textStyle: { fontWeight: 'bold', fontSize: 16 },
            subtextStyle: { fontSize: 10, color: '#777'}
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const data = params[0].data as FeatureImpactDisplay;
                return `<b>${data.name.toUpperCase()}</b><br/>Input Value: ${data.value}<br/>Illustrative Impact: ${data.score}/100<br/><i>${data.description}</i>`;
            }
          },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true, width: 'auto' },
          xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}' } },
          yAxis: {
            type: 'category',
            data: chartDataSource.map(d => {
                // Make Y-axis labels more readable
                const nameMap: Record<string, string> = {
                    age: "Age", sex: "Sex", cp: "Chest Pain", trestbps: "Resting BP",
                    chol: "Cholesterol", fbs: "Fasting BS", restecg: "Resting ECG",
                    thalach: "Max HR", exang: "Ex. Angina", oldpeak: "Oldpeak", slope: "ST Slope"
                };
                return nameMap[d.name] || d.name;
            }),
            axisLine: { lineStyle: { color: '#CBD5E0' } }, // Tailwind gray-400
            axisLabel: { fontWeight: 'semibold', color: '#4A5568' } // Tailwind gray-700
          },
          series: [{
            name: 'Illustrative Impact Score',
            type: 'bar',
            data: chartDataSource, // Pass the whole object to use in itemStyle and tooltip
            itemStyle: {
              color: (params: any) => {
                const dataItem = params.data as FeatureImpactDisplay;
                return colorMapping[dataItem.category];
              },
              borderRadius: [0, 5, 5, 0]
            },
            label: {
                show: true,
                position: 'right',
                formatter: '{@[1]}', // @[1] refers to the 'score' property if data is [{name, score}]
                                     // if data is just array of scores, use '{c}'
                fontWeight: 'bold',
                color: '#4A5568'
            },
            barMaxWidth: 25,
            emphasis: {
              focus: 'series', // or 'self'
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.3)'
              }
            }
          }]
        };
        myChart.setOption(option);

        const resizeHandler = () => myChart?.resize();
        window.addEventListener('resize', resizeHandler);
        
        return () => {
            window.removeEventListener('resize', resizeHandler);
            myChart?.dispose();
        };
      }
    };

    // Debounce or ensure initChart runs after DOM element is surely available
    const timeoutId = setTimeout(initChart, 0);
    return () => clearTimeout(timeoutId);

  }, [processedMLInput]); // Depend on processedMLInput

  const getRiskLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'fas fa-exclamation-triangle';
      case 'medium':
        return 'fas fa-exclamation-circle';
      case 'low':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  const getRiskLevelBgColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-100';
      case 'medium':
        return 'bg-yellow-100';
      case 'low':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const downloadResults = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Heart Disease Risk Assessment Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add risk assessment summary
    doc.setFontSize(16);
    doc.text('Risk Assessment Summary', 20, 45);
    
    doc.setFontSize(12);
    const riskLevel = result.riskLevel.toUpperCase();
    doc.text(`Risk Level: ${riskLevel}`, 20, 55);
    doc.text(`Risk Probability: ${result.riskPercentage}%`, 20, 65);
    doc.text(`Model Accuracy: ${result.accuracyPercentage}%`, 20, 75);
    
    // Add interpretation
    doc.setFontSize(14);
    doc.text('Interpretation', 20, 90);
    doc.setFontSize(12);
    const splitInterpretation = doc.splitTextToSize(result.interpretation || 'No interpretation available', pageWidth - 40);
    doc.text(splitInterpretation, 20, 100);
    
    // Add input data
    doc.setFontSize(14);
    doc.text('Input Data', 20, 120);
    
    const inputData = [
      ['Parameter', 'Value'],
      ['Age', processedMLInput.age.toString()],
      ['Sex', processedMLInput.sex === 1 ? 'Male' : 'Female'],
      ['Chest Pain Type', getChestPainType(processedMLInput.cp)],
      ['Resting Blood Pressure', `${processedMLInput.trestbps} mm Hg`],
      ['Cholesterol', `${processedMLInput.chol} mg/dl`],
      ['Fasting Blood Sugar', processedMLInput.fbs === 1 ? '> 120 mg/dl' : '≤ 120 mg/dl'],
      ['Resting ECG', getRestingECG(processedMLInput.restecg)],
      ['Max Heart Rate', processedMLInput.thalach.toString()],
      ['Exercise Angina', processedMLInput.exang === 1 ? 'Yes' : 'No'],
      ['ST Depression', processedMLInput.oldpeak.toString()],
      ['ST Slope', getSTSlope(processedMLInput.slope)]
    ];
    
    autoTable(doc as any, {
      startY: 130,
      head: [inputData[0]],
      body: inputData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 10, cellPadding: 5 }
    });
    
    // Add recommendations if available
    if (result.recommendations && result.recommendations.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Recommendations', 20, finalY);
      doc.setFontSize(12);
      
      const recommendations = result.recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`);
      const splitRecommendations = doc.splitTextToSize(recommendations.join('\n'), pageWidth - 40);
      doc.text(splitRecommendations, 20, finalY + 10);
    }
    
    // Add footer
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        'This is a computer-generated report. Please consult with healthcare professionals for medical advice.',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save('heart-disease-assessment-report.pdf');
  };

  const getChestPainType = (type: number): string => {
    switch (type) {
      case 0: return 'Typical Angina';
      case 1: return 'Atypical Angina';
      case 2: return 'Non-anginal Pain';
      case 3: return 'Asymptomatic';
      default: return 'Unknown';
    }
  };

  const getRestingECG = (type: number): string => {
    switch (type) {
      case 0: return 'Normal';
      case 1: return 'ST-T Wave Abnormality';
      case 2: return 'Left Ventricular Hypertrophy';
      default: return 'Unknown';
    }
  };

  const getSTSlope = (type: number): string => {
    switch (type) {
      case 0: return 'Upsloping';
      case 1: return 'Flat';
      case 2: return 'Downsloping';
      default: return 'Unknown';
    }
  };

  const fetchSuggestedDoctors = async () => {
    try {
        setLoadingDoctors(true);
        const response = await getSuggestedDoctors({
            riskLevel: result.riskLevel,
            city: selectedCity,
            area: selectedArea
        });
        
        if (response.success) {
            setSuggestedDoctors(response.doctors);
        } else {
            notify({
                message: response.error || "Failed to fetch doctor suggestions. Please try again.",
                type: "error"
            });
        }
    } catch (error: any) {
        notify({
            message: error.message || "Failed to fetch doctor suggestions. Please try again.",
            type: "error"
        });
    } finally {
        setLoadingDoctors(false);
    }
  };

  const handleBookAppointment = async (doctorId: number) => {
    if (!currentUser) {
      notify({
        message: "Please log in to book an appointment",
        type: 'error'
      });
      return;
    }

    try {
      // Get current date and add 1 day to ensure future date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const appointmentDate = tomorrow.toISOString().split('T')[0];

      // First check available slots
      const slotsResponse = await api.get(`/api/appointments/available-slots?doctorId=${doctorId}&date=${appointmentDate}`);

      if (!slotsResponse.data.success) {
        throw new Error(slotsResponse.data.error || 'Failed to fetch available slots');
      }

      const availableSlots = slotsResponse.data.availableSlots;

      if (!availableSlots || availableSlots.length === 0) {
        notify({
          message: "No available slots for tomorrow. Please try another day.",
          type: 'error'
        });
        return;
      }

      // Use the first available slot
      const firstAvailableSlot = availableSlots[0];

      const response = await createAppointment({
        doctorId,
        date: appointmentDate,
        time: firstAvailableSlot,
        reason: `Heart disease risk assessment follow-up - Risk Level: ${result.riskLevel}`
      });

      if (response.success) {
        notify({
          message: "Appointment booked successfully!",
          type: 'success'
        });
      } else {
        // Handle specific error cases
        const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message;
        const suggestions = typeof response.error === 'object' ? response.error?.suggestions : undefined;

        if (errorMessage?.includes('not available')) {
          notify({
            message: "The selected time slot is not available. Please try a different time.",
            type: 'error'
          });
        } else if (errorMessage?.includes('already booked')) {
          notify({
            message: "This time slot is already booked. Please try booking for tomorrow or another day.",
            type: 'error'
          });
        } else if (suggestions && suggestions.length > 0) {
          notify({
            message: "Please try one of these available time slots: " + suggestions.join(', '),
            type: 'error'
          });
        } else {
          notify({
            message: errorMessage || "Failed to book appointment. Please try again later.",
            type: 'error'
          });
        }
      }
    } catch (error: any) {
      console.error('Appointment booking error:', error);
      notify({
        message: error.message || "Error booking appointment. Please try again.",
        type: 'error'
      });
    }
  };

  if (!result || !processedMLInput) { // Check for result as well
      return <div className="text-center p-8">Loading results or input data missing...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 font-['Libre_Franklin'] mb-2">
                Your Heart Health Assessment
              </h3>
              <p className="text-sm text-gray-600">Based on your input data and our AI model analysis</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm bg-blue-100 text-blue-700 font-semibold py-1.5 px-3 rounded-full">
                AI-Powered Prediction
              </span>
              <span className="text-xs sm:text-sm bg-green-100 text-green-700 font-semibold py-1.5 px-3 rounded-full">
                {result.accuracyPercentage}% Model Accuracy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
            <div className="md:col-span-1">
              <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg w-full">
                <div className="mb-4">
                  <i className={`${getRiskLevelIcon(result.riskLevel)} text-4xl ${
                    result.riskLevel === 'low' ? 'text-green-500' :
                    result.riskLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
                  }`}></i>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Risk Assessment</h4>
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4">
                  <div className={`w-full h-full rounded-full flex items-center justify-center border-8 shadow-lg transform transition-transform hover:scale-105 ${
                    result.riskLevel === 'low' ? 'border-green-400 shadow-green-200' :
                    result.riskLevel === 'medium' ? 'border-yellow-400 shadow-yellow-200' : 'border-red-400 shadow-red-200'
                  }`}>
                    <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none"
                        stroke={result.riskLevel === 'low' ? '#48BB78' : result.riskLevel === 'medium' ? '#F59E0B' : '#F56565'}
                        strokeWidth="5" strokeDasharray={`${result.riskPercentage * 2.89026524}, 289.026524`}
                        strokeLinecap="round" transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="text-center z-10">
                      <div className="text-3xl sm:text-4xl font-bold mb-1 text-gray-800">{result.riskPercentage}%</div>
                      <div className={`text-md sm:text-lg font-semibold capitalize ${
                        result.riskLevel === 'low' ? 'text-green-600' :
                        result.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.riskLevel} Risk
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-gray-600">Model Confidence:</span>
                    <span className="font-semibold text-blue-600">
                      {result.probability_of_heart_disease !== null && result.probability_of_heart_disease !== undefined 
                        ? `${(result.probability_of_heart_disease * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-gray-600">Assessment Date:</span>
                    <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-700 italic">
                    {result.interpretation || 'No interpretation available'}
                  </p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center md:text-left">Illustrative Feature Impact Profile</h4>
              <div ref={chartRef} style={{ width: '100%', height: '350px' }}></div> {/* Increased height */}
              <p className="text-xs text-gray-500 mt-2 text-center md:text-left">
                Note: This chart provides a general illustration of how different factors might contribute to risk scores and is not a direct output of the ML model's internal feature importance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
          Personalized Health Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Immediate Actions */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <h4 className="text-lg font-medium text-red-800 mb-3 flex items-center">
              <WarningIcon className="mr-2" />
              Immediate Actions
            </h4>
            <ul className="space-y-2">
              {(result.recommendations || []).slice(0, 2).map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-red-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lifestyle Changes */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
              <FitnessIcon className="mr-2" />
              Lifestyle Changes
            </h4>
            <ul className="space-y-2">
              {(result.recommendations || []).slice(2, 4).map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-blue-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Long-term Health Goals */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <h4 className="text-lg font-medium text-green-800 mb-3 flex items-center">
              <CheckCircleIcon className="mr-2" />
              Long-term Health Goals
            </h4>
            <ul className="space-y-2">
              {(result.recommendations || []).slice(4, 6).map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span className="text-green-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Medical Follow-up */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <h4 className="text-lg font-medium text-purple-800 mb-3 flex items-center">
              <HospitalIcon className="mr-2" />
              Medical Follow-up
            </h4>
            <ul className="space-y-2">
              {(result.recommendations || []).slice(6, 8).map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span className="text-purple-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 italic">
            <i className="fas fa-info-circle mr-2"></i>
            These recommendations are based on your assessment results. Please consult with healthcare professionals for personalized medical advice.
          </p>
        </div>
      </div>

      {/* Doctor Suggestions Section */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-user-md text-blue-600 mr-2"></i>
          Recommended Doctors
        </h3>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (Optional)</label>
              <input
                type="text"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                placeholder="Enter your area"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={fetchSuggestedDoctors}
            disabled={!selectedCity || loadingDoctors}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loadingDoctors ? 'Loading...' : 'Find Doctors'}
          </button>
        </div>

        {suggestedDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-800">{doctor.fullName}</h4>
                    <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    <p className="text-sm text-gray-600">{doctor.hospital}</p>
                    <p className="text-sm text-gray-600">{doctor.city}, {doctor.area}</p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Experience: {doctor.experience} years</span>
                      <span className="mx-2">•</span>
                      <span className="text-sm text-gray-600">Rating: {doctor.rating}/5</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookAppointment(doctor.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Book Appointment
                  </button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Available: {doctor.availability.days.join(', ')}</p>
                  <p>Hours: {doctor.availability.startTime} - {doctor.availability.endTime}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-4">
            {loadingDoctors ? 'Loading doctors...' : 'Enter your city to find recommended doctors'}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-4">
        <button
          onClick={onReset}
          className="group bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-md flex items-center"
        >
          <i className="fas fa-redo mr-2 group-hover:rotate-180 transition-transform duration-300"></i>
          Start New Assessment
        </button>
        <button
          onClick={downloadResults}
          className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-md flex items-center"
        >
          <i className="fas fa-download mr-2 group-hover:translate-y-1 transition-transform duration-300"></i>
          Download Detailed Report
        </button>
      </div>
    </div>
  );
};

export default Results;