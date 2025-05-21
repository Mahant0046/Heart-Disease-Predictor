"""fix doctors schema

Revision ID: fix_doctors_schema
Revises: 6a33bc8ceb21
Create Date: 2024-03-19 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_doctors_schema'
down_revision = '6a33bc8ceb21'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing columns
    op.add_column('doctors', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.add_column('doctors', sa.Column('last_login', sa.DateTime(), nullable=True))
    
    # Make password_hash non-nullable after adding it
    op.alter_column('doctors', 'password_hash',
        existing_type=sa.String(length=255),
        nullable=False)
    
    # Add default values for existing rows
    op.execute("UPDATE doctors SET password_hash = 'default123' WHERE password_hash IS NULL")
    op.execute("UPDATE doctors SET last_login = NULL WHERE last_login IS NULL")

def downgrade():
    # Remove added columns
    op.drop_column('doctors', 'last_login')
    op.drop_column('doctors', 'password_hash') 