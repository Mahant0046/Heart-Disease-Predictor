"""update doctor location fields

Revision ID: update_doctor_location
Revises: remove_doctor_city_area
Create Date: 2024-03-19 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_doctor_location'
down_revision = 'remove_doctor_city_area'
branch_labels = None
depends_on = None

def upgrade():
    # Make latitude and longitude nullable
    op.alter_column('doctors', 'latitude',
        existing_type=sa.Float(),
        nullable=True)
    op.alter_column('doctors', 'longitude',
        existing_type=sa.Float(),
        nullable=True)
    
    # Add reviews and consultationFee columns if they don't exist
    op.add_column('doctors', sa.Column('reviews', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('doctors', sa.Column('consultationFee', sa.Float(), nullable=True, server_default='0.0'))

def downgrade():
    # Make latitude and longitude non-nullable again
    op.alter_column('doctors', 'latitude',
        existing_type=sa.Float(),
        nullable=False)
    op.alter_column('doctors', 'longitude',
        existing_type=sa.Float(),
        nullable=False)
    
    # Remove reviews and consultationFee columns
    op.drop_column('doctors', 'reviews')
    op.drop_column('doctors', 'consultationFee') 