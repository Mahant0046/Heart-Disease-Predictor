"""merge heads

Revision ID: merge_heads
Revises: 6a33bc8ceb21, fix_doctors_schema
Create Date: 2024-03-19 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_heads'
down_revision = ('6a33bc8ceb21', 'fix_doctors_schema')
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass 