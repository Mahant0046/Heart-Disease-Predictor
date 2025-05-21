import React, { useState, ChangeEvent } from 'react';
import { FormData } from '../../types/FormTypes';

interface BloodReportStepProps {
  formData: FormData;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFileUpload: (file: File) => Promise<void>;
}

const BloodReportStep: React.FC<BloodReportStepProps> = ({ formData, onInputChange, onFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or image file (JPEG/PNG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await onFileUpload(file);
      setUploadSuccess(true);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Blood Report Upload</h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="blood-report-upload"
            />
            <label
              htmlFor="blood-report-upload"
              className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Blood Report'}
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Upload your blood report (PDF, JPEG, or PNG) to automatically extract relevant data
            </p>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <p>{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
              <p>Blood report uploaded successfully! Data has been extracted and filled in the form.</p>
            </div>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Report Types:</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Complete Blood Count (CBC)</li>
              <li>Lipid Profile</li>
              <li>Blood Glucose Tests</li>
              <li>Cardiac Enzyme Tests</li>
              <li>Other relevant blood work</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Note:</h4>
            <p className="text-sm text-blue-600">
              After uploading your report, our AI will attempt to extract relevant values. 
              Please verify the extracted data before proceeding. You can still manually adjust any values if needed.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Entry Fields (shown as fallback or for verification) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Manual Entry (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cholesterol (mg/dL)</label>
            <input
              type="number"
              name="chol"
              value={formData.chol}
              onChange={onInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter cholesterol level"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fasting Blood Sugar (mg/dL)</label>
            <input
              type="number"
              name="fbs"
              value={formData.fbs}
              onChange={onInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter blood sugar level"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodReportStep; 