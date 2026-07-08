"""update_stage_enum_values

Revision ID: c3f81a90d421
Revises: 225d873200a7
Create Date: 2026-06-20 11:07:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f81a90d421'
down_revision: Union[str, Sequence[str], None] = '225d873200a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_VALUES = ('NEWBORN', 'CHILDHOOD', 'HIGH_SCHOOL', 'COLLEGE', 'ADULT', 'ELDER')
NEW_VALUES = ('Baby', 'Toddler', 'Pre-School', 'School', 'Exam-Prep', 'University', 'Adult', 'Elder')

# Mapping from old DB value → new DB value
UPGRADE_MAP = {
    'NEWBORN':    'Baby',
    'CHILDHOOD':  'Toddler',
    'HIGH_SCHOOL': 'School',
    'COLLEGE':    'University',
    'ADULT':      'Adult',
    'ELDER':      'Elder',
}

DOWNGRADE_MAP = {v: k for k, v in UPGRADE_MAP.items()}
# Extra new values that have no old counterpart get mapped back to a safe default
DOWNGRADE_MAP.update({
    'Pre-School': 'CHILDHOOD',
    'Exam-Prep':  'HIGH_SCHOOL',
})


def upgrade() -> None:
    """Migrate stage enum from old SCREAMING_SNAKE values to human-readable values."""
    conn = op.get_bind()

    # 1. Add new enum type
    new_type = sa.Enum(*NEW_VALUES, name='stage_new')
    new_type.create(conn)

    # 2. Add a temporary column with the new type
    op.add_column('character', sa.Column('stage_new', sa.Enum(*NEW_VALUES, name='stage_new'), nullable=True))

    # 3. Populate the new column via a CASE expression
    case_sql = ' '.join(
        f"WHEN stage::text = '{old}' THEN '{new}'"
        for old, new in UPGRADE_MAP.items()
    )
    conn.execute(sa.text(
        f"UPDATE character SET stage_new = (CASE {case_sql} ELSE 'Adult' END)::stage_new"
    ))

    # 4. Drop the old column
    op.drop_column('character', 'stage')

    # 5. Drop the old enum type
    sa.Enum(name='stage').drop(conn, checkfirst=True)

    # 6. Rename new type to 'stage'
    conn.execute(sa.text("ALTER TYPE stage_new RENAME TO stage"))

    # 7. Rename the temp column to 'stage'
    op.alter_column('character', 'stage_new', new_column_name='stage')

    # 8. Set NOT NULL now that all rows are populated
    op.alter_column('character', 'stage', nullable=False)


def downgrade() -> None:
    """Revert stage enum back to old SCREAMING_SNAKE values."""
    conn = op.get_bind()

    old_type = sa.Enum(*OLD_VALUES, name='stage_old')
    old_type.create(conn)

    op.add_column('character', sa.Column('stage_old', sa.Enum(*OLD_VALUES, name='stage_old'), nullable=True))

    case_sql = ' '.join(
        f"WHEN stage::text = '{new}' THEN '{old}'"
        for new, old in DOWNGRADE_MAP.items()
    )
    conn.execute(sa.text(
        f"UPDATE character SET stage_old = (CASE {case_sql} ELSE 'ADULT' END)::stage_old"
    ))

    op.drop_column('character', 'stage')
    sa.Enum(name='stage').drop(conn, checkfirst=True)
    conn.execute(sa.text("ALTER TYPE stage_old RENAME TO stage"))
    op.alter_column('character', 'stage_old', new_column_name='stage')
    op.alter_column('character', 'stage', nullable=False)
