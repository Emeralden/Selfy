"""added vector to LifeEvent Model

Revision ID: 719109e1a1cd
Revises: 324224bf3238
Create Date: 2026-06-17 19:54:37.282222

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '719109e1a1cd'
down_revision: Union[str, Sequence[str], None] = '324224bf3238'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.add_column('lifeevent', sa.Column('embedding', pgvector.sqlalchemy.Vector(768), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('lifeevent', 'embedding')
    op.execute("DROP EXTENSION IF EXISTS vector")
    # ### end Alembic commands ###
