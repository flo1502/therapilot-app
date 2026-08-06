"""Ingest .txt/.md/.pdf files from a directory into the RAG store.

Usage:
    python -m scripts.ingest_documents ./docs/guidelines --document-type guideline
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.ai.rag.embeddings import build_embedding_provider
from app.ai.rag.pipeline import RagPipeline
from app.ai.rag.reranker import NoopReranker
from app.ai.rag.retriever import VectorRetriever
from app.core.config import get_settings
from app.db.database import async_session_factory
from app.services.document_service import DocumentService

_SUPPORTED_SUFFIXES = {".txt", ".md", ".pdf"}


async def main(directory: Path, document_type: str, source: str) -> None:
    settings = get_settings()
    embeddings = build_embedding_provider(settings)
    rag_pipeline = RagPipeline(embeddings, VectorRetriever(), NoopReranker())
    document_service = DocumentService(rag_pipeline)

    files = sorted(p for p in directory.rglob("*") if p.suffix.lower() in _SUPPORTED_SUFFIXES)
    if not files:
        print(f"No .txt/.md/.pdf files found under {directory}")
        return

    async with async_session_factory() as db:
        for path in files:
            print(f"Ingesting {path} ...")
            await document_service.ingest_file(
                db,
                path=path,
                source=source,
                title=path.stem,
                document_type=document_type,
            )
    print(f"Ingested {len(files)} document(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--document-type", default="guideline")
    parser.add_argument("--source", default="manual-ingest")
    args = parser.parse_args()

    asyncio.run(main(args.directory, args.document_type, args.source))
