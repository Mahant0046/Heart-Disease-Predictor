# Heart Disease Prediction API

A Flask-based REST API for heart disease prediction and user management.

## Features

- User authentication and authorization
- Heart disease prediction
- Educational resources management
- Admin dashboard
- PostgreSQL database integration
- JWT-based authentication
- CORS support

## Prerequisites

- Python 3.8+
- PostgreSQL
- pip

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and configure your environment variables
5. Initialize the database:
   ```bash
   python run.py
   ```

## Running the Application

Development:
```bash
python run.py
```

Production:
```bash
gunicorn run:app
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admin
- `POST /api/admin/login` - Login admin
- `GET /api/admin/verify` - Verify admin status
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/<id>` - Delete user
- `POST /api/admin/logout` - Logout admin

### Prediction
- `POST /api/predict` - Make heart disease prediction
- `GET /api/predict/history` - Get prediction history

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create resource (admin only)
- `PUT /api/resources/<id>` - Update resource (admin only)
- `DELETE /api/resources/<id>` - Delete resource (admin only)

## Testing

Run tests:
```bash
pytest
```

## Code Style

Format code:
```bash
black .
```

Lint code:
```bash
flake8
```

## License

MIT 