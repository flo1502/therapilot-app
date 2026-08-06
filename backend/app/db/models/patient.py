from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base, TimestampMixin, UUIDPkMixin


class Patient(Base, UUIDPkMixin, TimestampMixin):
    """Deliberately minimal: no clinical content lives here, only what's
    needed to scope sessions/memory/messages to a patient. `label` is a
    pseudonym for display, not the patient's real name - data minimization
    per docs/compliance/.
    """

    __tablename__ = "patients"

    tenant_id: Mapped[str] = mapped_column(String, index=True)
    label: Mapped[str] = mapped_column(String)
