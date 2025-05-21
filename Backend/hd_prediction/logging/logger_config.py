import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

def setup_logging(app):
    """Configure logging for the application"""
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Configure logging format
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )

    # File handler for all logs
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    # File handler for errors only
    error_file_handler = RotatingFileHandler(
        'logs/error.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    error_file_handler.setFormatter(formatter)
    error_file_handler.setLevel(logging.ERROR)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG)

    # Remove any existing handlers
    for handler in app.logger.handlers[:]:
        app.logger.removeHandler(handler)

    # Add handlers to app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(error_file_handler)
    app.logger.addHandler(console_handler)
    
    # Set the base logging level
    app.logger.setLevel(logging.INFO)

    # Log the startup
    app.logger.info('Logging system initialized')
    app.logger.info(f'Application started at {datetime.utcnow()}')

def get_logger(name):
    """Get a logger instance with the specified name"""
    return logging.getLogger(name) 