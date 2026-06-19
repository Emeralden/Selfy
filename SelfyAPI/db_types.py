import numpy as np
from sqlalchemy import types
from pgvector.sqlalchemy import Vector


class FloatVector(types.TypeDecorator):
    """
    SQLAlchemy TypeDecorator wrapping pgvector's Vector.
    Transparently converts numpy.ndarray → list[float] when reading from DB,
    so Pydantic / the rest of the app never sees a numpy type.
    """
    impl = Vector
    cache_ok = True

    def __init__(self, dim: int):
        self._dim = dim
        super().__init__(dim)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, np.ndarray):
            return value.tolist()
        return list(value)
