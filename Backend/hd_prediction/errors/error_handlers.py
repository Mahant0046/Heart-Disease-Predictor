from flask import jsonify, current_app
from .custom_exceptions import HeartDiseaseError
import traceback

def register_error_handlers(app):
    @app.errorhandler(HeartDiseaseError)
    def handle_heart_disease_error(error):
        response = error.to_dict()
        response['status_code'] = error.status_code
        current_app.logger.error(f"Application error: {error.message}")
        return jsonify(response), error.status_code

    @app.errorhandler(404)
    def handle_not_found(error):
        response = {
            'message': 'Resource not found',
            'status': 'error',
            'status_code': 404
        }
        current_app.logger.warning(f"404 error: {str(error)}")
        return jsonify(response), 404

    @app.errorhandler(500)
    def handle_server_error(error):
        response = {
            'message': 'Internal server error',
            'status': 'error',
            'status_code': 500
        }
        current_app.logger.error(f"500 error: {str(error)}\n{traceback.format_exc()}")
        return jsonify(response), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        response = {
            'message': 'An unexpected error occurred',
            'status': 'error',
            'status_code': 500
        }
        current_app.logger.error(f"Unexpected error: {str(error)}\n{traceback.format_exc()}")
        return jsonify(response), 500 