import uuid
from datetime import date

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import get_settings
from app.db.models.base import Base, TimestampMixin, UUIDPkMixin

_EMBEDDING_DIM = get_settings().embedding_dim


class Document(Base, UUIDPkMixin, TimestampMixin):
    """A source in the evidence-based knowledge base (guideline,
    psychoeducation material, paper, ...). Chunked + embedded into
    DocumentChunk for retrieval.
    """

    __tablename__ = "documents"

    source: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    publication_date: Mapped[date | None] = mapped_column(nullable=True)
    document_type: Mapped[str] = mapped_column(String)
    topic: Mapped[str | None] = mapped_column(String, nullable=True)


class DocumentChunk(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(_EMBEDDING_DIM))
