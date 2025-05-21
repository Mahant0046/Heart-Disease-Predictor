// src/components/dashboard/PredictionHistory.tsx
import React from 'react';
import { PredictionHistoryRecord } from '../../services/api'; // Use the type from api.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PredictionHistoryProps {
  history: PredictionHistoryRecord[]; // Changed type here
}

const getRiskLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRiskBarColor = (level: string) => { // Helper for progress bar
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
};

const downloadPredictionPDF = (record: PredictionHistoryRecord) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  // Title
  doc.setFontSize(20);
  doc.text('Heart Disease Risk Assessment Report', pageWidth / 2, 20, { align: 'center' });
  // Date
  doc.setFontSize(12);
  doc.text(`Assessment Date: ${new Date(record.predictionDate).toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
  // Risk summary
  doc.setFontSize(16);
  doc.text('Risk Assessment Summary', 20, 45);
  doc.setFontSize(12);
  doc.text(`Risk Level: ${record.riskLevel.toUpperCase()}`, 20, 55);
  doc.text(`Risk Probability: ${record.riskPercentage}%`, 20, 65);
  if (record.probabilityScore !== null && record.probabilityScore !== undefined) {
    doc.text(`Probability Score: ${(record.probabilityScore * 100).toFixed(1)}%`, 20, 75);
  }
  doc.text(`Prediction: ${record.predictedClass === 1 ? 'Heart Disease Likely' : 'Heart Disease Unlikely'}`, 20, 85);
  // Input data
  doc.setFontSize(14);
  doc.text('Input Data', 20, 100);
  const inputData = [
    ['Parameter', 'Value'],
    ['Age', record.inputFeatures.age.toString()],
    ['Sex', record.inputFeatures.sex === 1 ? 'Male' : 'Female'],
    ['Chest Pain Type', record.inputFeatures.cp.toString()],
    ['Resting Blood Pressure', `${record.inputFeatures.trestbps} mm Hg`],
    ['Cholesterol', `${record.inputFeatures.chol} mg/dl`],
    ['Fasting Blood Sugar', record.inputFeatures.fbs === 1 ? '> 120 mg/dl' : '≤ 120 mg/dl'],
    ['Resting ECG', record.inputFeatures.restecg.toString()],
    ['Max Heart Rate', record.inputFeatures.thalach.toString()],
    ['Exercise Angina', record.inputFeatures.exang === 1 ? 'Yes' : 'No'],
    ['ST Depression', record.inputFeatures.oldpeak.toString()],
    ['ST Slope', record.inputFeatures.slope.toString()]
  ];
  autoTable(doc as any, {
    startY: 110,
    head: [inputData[0]],
    body: inputData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [220, 53, 69] },
    styles: { fontSize: 10, cellPadding: 5 }
  });
  // Symptoms
  if (record.symptoms && record.symptoms.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Key Factors Noted', 20, finalY);
    doc.setFontSize(12);
    const symptoms = record.symptoms.map((s, i) => `${i + 1}. ${s}`);
    doc.text(symptoms, 20, finalY + 10);
  }
  // Recommendations
  if (record.recommendations && record.recommendations.length > 0) {
    const y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 30 : 140;
    doc.setFontSize(14);
    doc.text('Recommendations', 20, y);
    doc.setFontSize(12);
    const recommendations = record.recommendations.map((rec, i) => `${i + 1}. ${rec}`);
    doc.text(recommendations, 20, y + 10);
  }
  // Footer
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
  doc.save(`prediction-report-${new Date(record.predictionDate).toLocaleDateString()}.pdf`);
};

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No prediction records found yet. Take an assessment to see your history!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Assessment History</h3>
      {history.map((record) => (
        <div key={record.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
            <div>
              <h4 className="text-md sm:text-lg font-semibold text-gray-800">
                Assessment on: {new Date(record.predictionDate).toLocaleDateString()}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500">
                Time: {new Date(record.predictionDate).toLocaleTimeString()}
              </p>
            </div>
            <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getRiskLevelColor(record.riskLevel)}`}>
              {record.riskLevel.charAt(0).toUpperCase() + record.riskLevel.slice(1)} Risk
            </span>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Predicted Risk Percentage</span>
              <span className="text-md sm:text-lg font-bold text-gray-800">{record.riskPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2"> {/* Adjusted height */}
              <div
                className={`h-2 rounded-full ${getRiskBarColor(record.riskLevel)}`}
                style={{ width: `${record.riskPercentage}%` }}
              ></div>
            </div>
             {record.probabilityScore !== null && record.probabilityScore !== undefined && (
                <p className="text-xs text-gray-500 mt-1">Probability Score: {(record.probabilityScore * 100).toFixed(1)}%</p>
             )}
             <p className="text-xs text-gray-500">Prediction: {record.predictedClass === 1 ? "Heart Disease Likely" : "Heart Disease Unlikely"}</p>
          </div>

          {/* Optionally display a summary of input features or key symptoms */}
          {record.symptoms && record.symptoms.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Key Factors Noted:</h5>
              <ul className="list-disc list-inside space-y-0.5">
                {record.symptoms.slice(0, 3).map((symptom, index) => ( // Show top 3 example
                  <li key={index} className="text-xs sm:text-sm text-gray-600">
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {record.recommendations && record.recommendations.length > 0 && (
             <div>
                <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">General Recommendations:</h5>
                 <ul className="list-disc list-inside space-y-0.5">
                    {record.recommendations.slice(0,2).map((rec, index) => (
                         <li key={index} className="text-xs sm:text-sm text-gray-600">{rec}</li>
                    ))}
                </ul>
             </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => downloadPredictionPDF(record)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center"
            >
              <i className="fas fa-download mr-2"></i>
              Download PDF
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PredictionHistory;