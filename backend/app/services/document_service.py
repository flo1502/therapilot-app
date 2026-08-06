import re
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.pipeline import RagPipeline
from app.db.models.document import Document


def extract_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return path.read_text(encoding="utf-8")


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class DocumentService:
    def __init__(self, rag_pipeline: RagPipeline) -> None:
        self._rag_pipeline = rag_pipeline

    async def ingest_text(
        self,
        db: AsyncSession,
        *,
        source: str,
        title: str,
        text: str,
        author: str | None = None,
        publication_date: date | None = None,
        document_type: str = "guideline",
        topic: str | None = None,
    ) -> Document:
        return await self._rag_pipeline.ingest_document(
            db,
            source=source,
            title=title,
            text=clean_text(text),
            author=author,
            publication_date=publication_date,
            document_type=document_type,
            topic=topic,
        )

    async def ingest_file(
        self,
        db: AsyncSession,
        *,
        path: Path,
        source: str,
        title: str,
        document_type: str = "guideline",
        author: str | None = None,
        topic: str | None = None,
    ) -> Document:
        text = extract_text(path)
        return await self.ingest_text(
            db,
            source=source,
            title=title,
            text=text,
            author=author,
            document_type=document_type,
            topic=topic,
        )

    async def list_documents(self, db: AsyncSession, *, limit: int = 50) -> list[Document]:
        stmt = select(Document).order_by(Document.created_at.desc()).limit(limit)
        return list((await db.execute(stmt)).scalars())
