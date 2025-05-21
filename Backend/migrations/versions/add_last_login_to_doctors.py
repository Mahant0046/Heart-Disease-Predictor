"""add last_login to doctors

Revision ID: add_last_login_to_doctors
Revises: merge_all_heads
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_last_login_to_doctors'
down_revision = 'merge_all_heads'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('doctors', sa.Column('last_login', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('doctors', 'last_login') 