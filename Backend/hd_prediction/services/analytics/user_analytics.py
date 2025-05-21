from datetime import datetime, timedelta
from hd_prediction.models import User, PredictionRecord
from ...logging import get_logger

logger = get_logger(__name__)

class UserAnalytics:
    @staticmethod
    def get_user_activity(user_id, days=30):
        """Get user activity for the last n days"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            predictions = PredictionRecord.query.filter(
                PredictionRecord.user_id == user_id,
                PredictionRecord.prediction_date >= start_date
            ).all()
            
            total_predictions = len(predictions)
            if total_predictions == 0:
                return {
                    'total_predictions': 0,
                    'average_risk_score': 0,
                    'risk_trend': 'stable',
                    'last_prediction_date': None
                }

            # Calculate average risk score
            risk_scores = [p.probability_score for p in predictions if p.probability_score is not None]
            avg_risk_score = sum(risk_scores) / len(risk_scores) if risk_scores else 0

            # Calculate risk trend
            risk_trend = 'stable'
            if len(predictions) >= 2:
                recent_scores = [p.probability_score for p in predictions[-2:] if p.probability_score is not None]
                if len(recent_scores) == 2:
                    if recent_scores[1] > recent_scores[0]:
                        risk_trend = 'increasing'
                    elif recent_scores[1] < recent_scores[0]:
                        risk_trend = 'decreasing'

            return {
                'total_predictions': total_predictions,
                'average_risk_score': round(avg_risk_score * 100, 2),
                'risk_trend': risk_trend,
                'last_prediction_date': predictions[-1].prediction_date.isoformat() if predictions else None
            }
        except Exception as e:
            logger.error(f"Error in get_user_activity: {str(e)}")
            return {
                'total_predictions': 0,
                'average_risk_score': 0,
                'risk_trend': 'unknown',
                'last_prediction_date': None
            }

    @staticmethod
    def get_user_health_metrics(user_id):
        """Get user's health metrics based on prediction history"""
        try:
            predictions = PredictionRecord.query.filter_by(
                user_id=user_id
            ).order_by(PredictionRecord.prediction_date.desc()).limit(5).all()

            if not predictions:
                return {
                    'health_score': 75,  # Default score
                    'risk_level': 'low',
                    'recommendations': ['Start tracking your heart health']
                }

            # Calculate health score based on recent predictions
            recent_scores = [p.probability_score for p in predictions if p.probability_score is not None]
            if not recent_scores:
                return {
                    'health_score': 75,
                    'risk_level': 'low',
                    'recommendations': ['Start tracking your heart health']
                }

            avg_risk = sum(recent_scores) / len(recent_scores)
            health_score = round((1 - avg_risk) * 100)

            # Determine risk level
            risk_level = 'low'
            if health_score < 40:
                risk_level = 'high'
            elif health_score < 70:
                risk_level = 'medium'

            # Generate recommendations based on risk level
            recommendations = []
            if risk_level == 'high':
                recommendations = [
                    'Schedule a consultation with a healthcare provider',
                    'Monitor your vital signs regularly',
                    'Consider lifestyle changes'
                ]
            elif risk_level == 'medium':
                recommendations = [
                    'Regular health check-ups recommended',
                    'Maintain a healthy lifestyle',
                    'Monitor your symptoms'
                ]
            else:
                recommendations = [
                    'Continue regular health monitoring',
                    'Maintain current healthy habits',
                    'Schedule routine check-ups'
                ]

            return {
                'health_score': health_score,
                'risk_level': risk_level,
                'recommendations': recommendations
            }
        except Exception as e:
            logger.error(f"Error in get_user_health_metrics: {str(e)}")
            return {
                'health_score': 75,
                'risk_level': 'unknown',
                'recommendations': ['Unable to generate recommendations at this time']
            } 