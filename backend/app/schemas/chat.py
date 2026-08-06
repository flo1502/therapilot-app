import uuid

from pydantic import BaseModel, ConfigDict


class ChatRequest(BaseModel):
    patient_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None
    message: str


class SourceOut(BaseModel):
    document_id: uuid.UUID
    chunk_id: uuid.UUID
    title: str
    source: str


class ChatResponse(BaseModel):
    """Matches the spec's example response. `model_used`, `rag_used` and
    `sources` are internal routing metadata - fine for an internal/therapist
    -facing caller, but see api/routes/chat.py for how a patient-facing
    deployment would redact them via settings.expose_internal_ai_metadata.
    """

    model_config = ConfigDict(protected_namespaces=())

    session_id: uuid.UUID
    message: str
    model_used: str
    rag_used: bool
    sources: list[SourceOut]
    risk_level: str
