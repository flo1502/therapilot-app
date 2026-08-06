import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import get_settings
from app.db.models.base import Base, TimestampMixin, UUIDPkMixin

_EMBEDDING_DIM = get_settings().embedding_dim


class MemoryItem(Base, UUIDPkMixin, TimestampMixin):
    """Patient-specific memory (goals, themes, preferences, prior-session
    notes) - strictly separate from Document/DocumentChunk (general clinical
    knowledge). Every query MUST filter by patient_id; never load a
    patient's whole memory into an LLM context, only what's relevant.
    """

    __tablename__ = "memory_items"

    tenant_id: Mapped[str] = mapped_column(String, index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), index=True
    )
    category: Mapped[str] = mapped_column(String)  # goal | theme | preference | note
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(_EMBEDDING_DIM))
    source_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=True
    )
