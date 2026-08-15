"""add avatar_url to npc

Revision ID: a3f9b2c71e04
Revises: 75f96a735ce2
Create Date: 2026-08-01 11:52:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a3f9b2c71e04'
down_revision: Union[str, Sequence[str], None] = '75f96a735ce2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('npc', sa.Column('avatar_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('npc', 'avatar_url')
