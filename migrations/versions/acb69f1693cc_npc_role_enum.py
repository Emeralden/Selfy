"""npc_role_enum

Revision ID: acb69f1693cc
Revises: a3f9b2c71e04
Create Date: 2026-08-12 22:26:58.067595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'acb69f1693cc'
down_revision: Union[str, Sequence[str], None] = 'a3f9b2c71e04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Drop any broken partial enum from failed attempts
    conn.execute(sa.text("DROP TYPE IF EXISTS npcrole CASCADE"))

    # 2. Normalise ALL dirty data — fix every known variant before casting
    #    These are the real values that were stored by old buggy code
    conn.execute(sa.text("UPDATE npc SET role = 'Classmate'   WHERE lower(role) = 'classmate'"))
    conn.execute(sa.text("UPDATE npc SET role = 'Teacher'     WHERE lower(role) = 'teacher'"))
    conn.execute(sa.text("UPDATE npc SET role = 'Father'      WHERE lower(role) = 'father'"))
    conn.execute(sa.text("UPDATE npc SET role = 'Mother'      WHERE lower(role) = 'mother'"))
    conn.execute(sa.text("UPDATE npc SET role = 'Rival_Cousin' WHERE role IN ('Rival Cousin', 'rival cousin', 'rival_cousin')"))
    conn.execute(sa.text("UPDATE npc SET role = 'Nosy_Aunt'   WHERE role IN ('Nosy Aunt', 'nosy aunt', 'nosy_aunt')"))

    # 3. Create the enum with correct values (no spaces)
    conn.execute(sa.text(
        "CREATE TYPE npcrole AS ENUM "
        "('Father', 'Mother', 'Classmate', 'Teacher', 'Rival_Cousin', 'Nosy_Aunt')"
    ))

    # 4. Cast — all rows are clean now
    conn.execute(sa.text(
        "ALTER TABLE npc ALTER COLUMN role TYPE npcrole USING role::npcrole"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE npc ALTER COLUMN role TYPE VARCHAR"))
    conn.execute(sa.text("DROP TYPE IF EXISTS npcrole"))
