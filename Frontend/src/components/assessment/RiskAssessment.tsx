import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { predictHeartDisease } from '../../services/api';
import DoctorSuggestions from './DoctorSuggestions';

interface FormData {
    age: number;
    sex: number;
    cp: number;
    trestbps: number;
    chol: number;
    fbs: number;
    restecg: number;
    thalach: number;
    exang: number;
    oldpeak: number;
    slope: number;
    city: string;
    area: string;
}

const RiskAssessment: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        age: 0,
        sex: 0,
        cp: 0,
        trestbps: 0,
        chol: 0,
        fbs: 0,
        restecg: 0,
        thalach: 0,
        exang: 0,
        oldpeak: 0,
        slope: 0,
        city: '',
        area: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<{
        riskLevel: string;
        probability: number;
        interpretation: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            
            const response = await predictHeartDisease(formData);
            
            setAssessmentResult({
                riskLevel: response.prediction === 1 ? 'High' : 'Low',
                probability: response.probability_of_heart_disease || 0,
                interpretation: response.interpretation
            });
            
            setShowSuggestions(true);
        } catch (err: any) {
            setError(err.message || 'Failed to assess risk');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Heart Disease Risk Assessment
            </Typography>

            {!showSuggestions ? (
                <form onSubmit={handleSubmit}>
                    {/* ... existing form fields ... */}
                </form>
            ) : assessmentResult && (
                <Box>
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Assessment Results
                            </Typography>
                            <Typography color={assessmentResult.riskLevel === 'High' ? 'error' : 'success'}>
                                Risk Level: {assessmentResult.riskLevel}
                            </Typography>
                            <Typography>
                                Probability: {(assessmentResult.probability * 100).toFixed(1)}%
                            </Typography>
                            <Typography sx={{ mt: 2 }}>
                                {assessmentResult.interpretation}
                            </Typography>
                        </CardContent>
                    </Card>

                    <DoctorSuggestions
                        riskLevel={assessmentResult.riskLevel}
                        city={formData.city}
                        area={formData.area}
                        specialization={assessmentResult.riskLevel === 'High' ? 'Cardiology' : 'General Medicine'}
                    />

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowSuggestions(false)}
                        >
                            Take Another Assessment
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default RiskAssessment; 