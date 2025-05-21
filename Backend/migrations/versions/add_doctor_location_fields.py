"""add doctor location fields

Revision ID: add_doctor_location_fields
Revises: add_appointments_table
Create Date: 2024-03-19 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_doctor_location_fields'
down_revision = 'add_appointments_table'
branch_labels = None
depends_on = None

def upgrade():
    # Add city and area columns to doctors table
    op.add_column('doctors', sa.Column('city', sa.String(length=100), nullable=True))
    op.add_column('doctors', sa.Column('area', sa.String(length=100), nullable=True))
    
    # Update existing records with default values
    op.execute("UPDATE doctors SET city = 'Unknown', area = 'Unknown'")
    
    # Make columns non-nullable after setting default values
    op.alter_column('doctors', 'city', nullable=False)
    op.alter_column('doctors', 'area', nullable=False)

def downgrade():
    op.drop_column('doctors', 'area')
    op.drop_column('doctors', 'city') 