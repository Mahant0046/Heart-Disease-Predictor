class HeartDiseaseError(Exception):
    """Base exception for heart disease application"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status'] = 'error'
        return rv

class ValidationError(HeartDiseaseError):
    """Raised when input validation fails"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=400, payload=payload)

class AuthenticationError(HeartDiseaseError):
    """Raised when authentication fails"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=401, payload=payload)

class PredictionError(HeartDiseaseError):
    """Raised when prediction fails"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=500, payload=payload)

class DatabaseError(HeartDiseaseError):
    """Raised when database operations fail"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=500, payload=payload)

class ResourceNotFoundError(HeartDiseaseError):
    """Raised when a requested resource is not found"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=404, payload=payload) 