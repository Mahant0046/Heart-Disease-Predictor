"""Update system health model

Revision ID: 1b3edfdca87e
Revises: 6a33bc8ceb21
Create Date: 2025-05-18 16:58:08.360910

"""
from alembic import op
import sqlalchemy as sa
from werkzeug.security import generate_password_hash


# revision identifiers, used by Alembic.
revision = '1b3edfdca87e'
down_revision = '6a33bc8ceb21'
branch_labels = None
depends_on = None


def upgrade():
    # First, create a temporary table with the new schema
    op.create_table(
        'doctors_temp',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fullName', sa.String(length=100), nullable=False),
        sa.Column('specialization', sa.String(length=100), nullable=False),
        sa.Column('qualifications', sa.String(length=200), nullable=False),
        sa.Column('experience', sa.Integer(), nullable=False),
        sa.Column('hospital', sa.String(length=200), nullable=False),
        sa.Column('address', sa.String(length=200), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('area', sa.String(length=100), nullable=False),
        sa.Column('phoneNumber', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('availability', sa.JSON(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('totalAppointments', sa.Integer(), nullable=True),
        sa.Column('reviews', sa.Integer(), nullable=True),
        sa.Column('consultationFee', sa.Float(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Copy data from old table to new table
    default_password = generate_password_hash('default123')
    op.execute(f"""
        INSERT INTO doctors_temp (
            id, fullName, specialization, qualifications, experience,
            hospital, address, city, area, phoneNumber, email,
            password_hash, availability, rating, totalAppointments,
            reviews, consultationFee, latitude, longitude,
            created_at, updated_at, last_login
        )
        SELECT 
            id, fullName, specialization, qualifications, experience,
            hospital, address, city, area, phoneNumber, email,
            '{default_password}', availability, rating, totalAppointments,
            reviews, consultationFee, latitude, longitude,
            created_at, updated_at, last_login
        FROM doctors
    """)

    # Drop the old table
    op.drop_table('doctors')

    # Rename the new table to the original name
    op.rename_table('doctors_temp', 'doctors')


def downgrade():
    # Create a temporary table without password_hash
    op.create_table(
        'doctors_temp',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fullName', sa.String(length=100), nullable=False),
        sa.Column('specialization', sa.String(length=100), nullable=False),
        sa.Column('qualifications', sa.String(length=200), nullable=False),
        sa.Column('experience', sa.Integer(), nullable=False),
        sa.Column('hospital', sa.String(length=200), nullable=False),
        sa.Column('address', sa.String(length=200), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('area', sa.String(length=100), nullable=False),
        sa.Column('phoneNumber', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('availability', sa.JSON(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('totalAppointments', sa.Integer(), nullable=True),
        sa.Column('reviews', sa.Integer(), nullable=True),
        sa.Column('consultationFee', sa.Float(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Copy data back
    op.execute("""
        INSERT INTO doctors_temp (
            id, fullName, specialization, qualifications, experience,
            hospital, address, city, area, phoneNumber, email,
            availability, rating, totalAppointments,
            reviews, consultationFee, latitude, longitude,
            created_at, updated_at, last_login
        )
        SELECT 
            id, fullName, specialization, qualifications, experience,
            hospital, address, city, area, phoneNumber, email,
            availability, rating, totalAppointments,
            reviews, consultationFee, latitude, longitude,
            created_at, updated_at, last_login
        FROM doctors
    """)

    # Drop the new table
    op.drop_table('doctors')

    # Rename the old table back
    op.rename_table('doctors_temp', 'doctors')
