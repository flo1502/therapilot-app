from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_document_service
from app.core.security import Principal, get_current_principal
from app.db.database import get_db
from app.schemas.document import DocumentIngestRequest, DocumentOut
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/documents", response_model=DocumentOut)
async def ingest_document(
    body: DocumentIngestRequest,
    db: AsyncSession = Depends(get_db),
    document_service: DocumentService = Depends(get_document_service),
    _principal: Principal = Depends(get_current_principal),
) -> DocumentOut:
    document = await document_service.ingest_text(
        db,
        source=body.source,
        title=body.title,
        text=body.text,
        author=body.author,
        publication_date=body.publication_date,
        document_type=body.document_type,
        topic=body.topic,
    )
    return DocumentOut.model_validate(document)


@router.get("/documents", response_model=list[DocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    document_service: DocumentService = Depends(get_document_service),
    _principal: Principal = Depends(get_current_principal),
) -> list[DocumentOut]:
    documents = await document_service.list_documents(db)
    return [DocumentOut.model_validate(d) for d in documents]
