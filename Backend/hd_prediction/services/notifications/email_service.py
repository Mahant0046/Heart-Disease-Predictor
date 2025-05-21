from flask import current_app
from flask_mail import Mail, Message
from ...logging import get_logger
import os
import time
from smtplib import SMTPException
from datetime import datetime, timedelta

logger = get_logger(__name__)

class EmailService:
    def __init__(self, app):
        """Initialize email service with Flask-Mail"""
        try:
            self.mail = Mail(app)
            self.app = app
            logger.info("Email service initialized successfully")
            
            # Verify email configuration
            required_configs = [
                'MAIL_SERVER',
                'MAIL_PORT',
                'MAIL_USERNAME',
                'MAIL_PASSWORD'
            ]
            
            missing_configs = [config for config in required_configs 
                             if not app.config.get(config)]
            
            if missing_configs:
                logger.warning(f"Missing email configurations: {', '.join(missing_configs)}")
            else:
                logger.info("All email configurations are present")
                
        except Exception as e:
            logger.error(f"Failed to initialize email service: {str(e)}")
            raise

    def _send_email_with_retry(self, msg, max_retries=3, retry_delay=2):
        """Helper method to send email with retry logic"""
        for attempt in range(max_retries):
            try:
                self.mail.send(msg)
                return True
            except SMTPException as e:
                logger.error(f"SMTP error on attempt {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise
            except Exception as e:
                logger.error(f"Unexpected error sending email: {str(e)}")
                raise

    def send_prediction_result(self, user_email, prediction_result, risk_level):
        """Send prediction result email to user"""
        try:
            if not all([user_email, prediction_result, risk_level]):
                logger.error("Missing required parameters for prediction result email")
                return False
                
            subject = f"Heart Disease Prediction Result - {risk_level.upper()} Risk Level"
            
            # Customize message based on risk level
            risk_message = {
                'high': """
                Based on your recent prediction, you have a HIGH risk level. We strongly recommend:
                1. Schedule an appointment with your healthcare provider
                2. Review your lifestyle habits
                3. Consider additional medical tests
                """,
                'medium': """
                Based on your recent prediction, you have a MEDIUM risk level. We recommend:
                1. Monitor your health indicators regularly
                2. Consider lifestyle modifications
                3. Schedule a routine check-up
                """,
                'low': """
                Based on your recent prediction, you have a LOW risk level. We recommend:
                1. Continue maintaining healthy habits
                2. Regular health check-ups
                3. Stay informed about heart health
                """
            }.get(risk_level.lower(), "")
            
            body = f"""
            Dear User,

            Your heart disease prediction result is now available.

            Prediction Result: {prediction_result}
            Risk Level: {risk_level.upper()}

            {risk_message}

            Next Steps:
            1. Log in to your account to view detailed results
            2. Review your health metrics
            3. Check personalized recommendations

            Remember:
            - This prediction is based on the information provided
            - Regular medical check-ups are important
            - Maintain a healthy lifestyle

            Best regards,
            Heart Disease Prediction System Team

            ---
            This is an automated message. Please do not reply to this email.
            """

            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[user_email]
            )
            msg.body = body
            
            # Log email attempt
            logger.info(f"Attempting to send prediction result email to {user_email}")
            
            # Send email with retry logic
            success = self._send_email_with_retry(msg)
            if success:
                logger.info(f"Prediction result email sent successfully to {user_email}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error sending prediction result email to {user_email}: {str(e)}")
            return False

    def send_health_reminder(self, user_email, user_name):
        """Send health reminder email to user"""
        try:
            if not all([user_email, user_name]):
                logger.error("Missing required parameters for health reminder email")
                return False
                
            subject = "Your Health Check Reminder"
            
            body = f"""
            Dear {user_name},

            This is your regular health check reminder from the Heart Disease Prediction System.

            Health Tips for Today:
            1. Monitor your vital signs
            2. Stay hydrated
            3. Maintain a balanced diet
            4. Get regular exercise
            5. Manage stress levels

            Recommended Actions:
            - Schedule your next health check-up
            - Update your health metrics in the system
            - Review your recent predictions
            - Check new health resources

            Remember:
            - Prevention is better than cure
            - Regular monitoring is key to heart health
            - Small lifestyle changes make a big difference

            Stay healthy!
            Heart Disease Prediction System Team

            ---
            This is an automated message. Please do not reply to this email.
            """

            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[user_email]
            )
            msg.body = body
            
            # Log email attempt
            logger.info(f"Attempting to send health reminder email to {user_email}")
            
            # Send email with retry logic
            success = self._send_email_with_retry(msg)
            if success:
                logger.info(f"Health reminder email sent successfully to {user_email}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error sending health reminder email to {user_email}: {str(e)}")
            return False

    def send_welcome_email(self, user_email, user_name):
        """Send welcome email to new users"""
        try:
            if not all([user_email, user_name]):
                logger.error("Missing required parameters for welcome email")
                return False
                
            subject = "Welcome to Heart Disease Prediction System"
            body = f"""
            Dear {user_name},

            Welcome to the Heart Disease Prediction System! We're excited to have you on board.

            Your account has been successfully created. Here's what you can do now:

            1. Perform Heart Disease Predictions
               - Access our advanced ML model
               - Get instant risk assessments
               - View detailed health insights

            2. Track Your Health Metrics
               - Monitor your prediction history
               - Track changes in your health indicators
               - View your health score

            3. Access Health Resources
               - Read educational articles
               - Get personalized recommendations
               - Learn about heart health

            Getting Started:
            1. Log in to your account
            2. Complete your profile information
            3. Make your first prediction

            Important Notes:
            - Keep your login credentials secure
            - Update your profile with accurate information
            - Regular health check-ups are recommended

            If you have any questions or need assistance, please don't hesitate to contact us.

            Best regards,
            Heart Disease Prediction System Team

            ---
            This is an automated message. Please do not reply to this email.
            """

            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[user_email]
            )
            msg.body = body
            
            # Log email attempt
            logger.info(f"Attempting to send welcome email to {user_email}")
            
            # Send email with retry logic
            success = self._send_email_with_retry(msg)
            if success:
                logger.info(f"Welcome email sent successfully to {user_email}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error sending welcome email to {user_email}: {str(e)}")
            return False

    def schedule_health_reminders(self, user_email, user_name, frequency_days=30):
        """Schedule periodic health reminder emails"""
        try:
            if not all([user_email, user_name]):
                logger.error("Missing required parameters for scheduling health reminders")
                return False
                
            # Calculate next reminder date
            next_reminder = datetime.now() + timedelta(days=frequency_days)
            
            # Store reminder schedule in database or cache
            # This is a placeholder - implement actual scheduling logic
            logger.info(f"Scheduled health reminder for {user_email} on {next_reminder}")
            
            # Send initial reminder
            return self.send_health_reminder(user_email, user_name)
            
        except Exception as e:
            logger.error(f"Error scheduling health reminders for {user_email}: {str(e)}")
            return False

    def send_scheduled_reminder(self, user_email, user_name):
        """Send scheduled health reminder email"""
        try:
            if not all([user_email, user_name]):
                logger.error("Missing required parameters for scheduled reminder")
                return False
                
            # Check if user has recent predictions
            # This is a placeholder - implement actual check
            has_recent_predictions = True
            
            if not has_recent_predictions:
                subject = "Time for Your Health Check"
                body = f"""
                Dear {user_name},

                It's been a while since your last health check. We encourage you to:
                1. Log in to your account
                2. Perform a new prediction
                3. Update your health metrics

                Regular health monitoring is crucial for maintaining good heart health.

                Best regards,
                Heart Disease Prediction System Team

                ---
                This is an automated message. Please do not reply to this email.
                """
            else:
                return self.send_health_reminder(user_email, user_name)

            msg = Message(
                subject=subject,
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                recipients=[user_email]
            )
            msg.body = body
            
            # Log email attempt
            logger.info(f"Attempting to send scheduled reminder to {user_email}")
            
            # Send email with retry logic
            success = self._send_email_with_retry(msg)
            if success:
                logger.info(f"Scheduled reminder sent successfully to {user_email}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error sending scheduled reminder to {user_email}: {str(e)}")
            return False

    def send_password_reset_email(self, email, name, reset_link):
        """Send password reset email to a doctor."""
        try:
            msg = Message(
                'Password Reset Request',
                recipients=[email]
            )
            msg.body = f"""
            Dear {name},

            You have requested to reset your password. Please click the link below to reset your password:

            {reset_link}

            This link will expire in 1 hour.

            If you did not request this password reset, please ignore this email.

            Best regards,
            Heart Disease Prediction System Team
            """
            msg.html = f"""
            <h2>Password Reset Request</h2>
            <p>Dear {name},</p>
            <p>You have requested to reset your password. Please click the link below to reset your password:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Heart Disease Prediction System Team</p>
            """
            self.mail.send(msg)
            return True
        except Exception as e:
            self.app.logger.error(f"Error sending password reset email: {str(e)}")
            return False 