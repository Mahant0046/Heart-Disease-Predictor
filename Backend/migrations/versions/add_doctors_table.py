"""add doctors table

Revision ID: add_doctors_table
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_doctors_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fullName', sa.String(length=100), nullable=False),
        sa.Column('specialization', sa.String(length=100), nullable=False),
        sa.Column('qualifications', sa.Text(), nullable=False),
        sa.Column('experience', sa.Integer(), nullable=False),
        sa.Column('hospital', sa.String(length=200), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('area', sa.String(length=100), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('phoneNumber', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('availability', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('rating', sa.Float(), nullable=True, default=0.0),
        sa.Column('totalAppointments', sa.Integer(), nullable=True, default=0),
        sa.Column('reviews', sa.Integer(), nullable=True, default=0),
        sa.Column('consultationFee', sa.Float(), nullable=True, default=0.0),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

def downgrade():
    op.drop_table('doctors') 