import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DocumentIngestRequest(BaseModel):
    source: str
    title: str
    text: str
    author: str | None = None
    publication_date: date | None = None
    document_type: str = "guideline"
    topic: str | None = None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    source: str
    document_type: str
    created_at: datetime
