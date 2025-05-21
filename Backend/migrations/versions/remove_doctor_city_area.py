"""remove doctor city area fields

Revision ID: remove_doctor_city_area
Revises: add_doctor_location_fields
Create Date: 2024-03-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_doctor_city_area'
down_revision = 'add_doctor_location_fields'
branch_labels = None
depends_on = None

def upgrade():
    # Drop the city and area columns
    op.drop_column('doctors', 'city')
    op.drop_column('doctors', 'area')

def downgrade():
    # Add back the city and area columns
    op.add_column('doctors', sa.Column('city', sa.String(length=100), nullable=True))
    op.add_column('doctors', sa.Column('area', sa.String(length=100), nullable=True))
    
    # Update existing records with default values
    op.execute("UPDATE doctors SET city = 'Unknown', area = 'Unknown'")
    
    # Make columns non-nullable after setting default values
    op.alter_column('doctors', 'city', nullable=False)
    op.alter_column('doctors', 'area', nullable=False) 