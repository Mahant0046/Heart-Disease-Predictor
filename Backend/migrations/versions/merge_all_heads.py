"""merge all heads

Revision ID: merge_all_heads
Revises: 1b3edfdca87e, merge_heads
Create Date: 2024-05-18 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_all_heads'
down_revision = ('1b3edfdca87e', 'merge_heads')
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass 