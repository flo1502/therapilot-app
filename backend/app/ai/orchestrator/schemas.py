import uuid
from dataclasses import dataclass, field
from typing import Literal

from app.ai.models.base import ChatMessage
from app.ai.safety.risk_detector import RiskLevel

RouteTarget = Literal["crisis", "local", "frontier"]


@dataclass(frozen=True)
class RouteDecision:
    target: RouteTarget
    use_rag: bool
    reason: str


@dataclass(frozen=True)
class SourceRef:
    document_id: uuid.UUID
    chunk_id: uuid.UUID
    title: str
    source: str


@dataclass(frozen=True)
class OrchestratorInput:
    user_message: str
    patient_id: uuid.UUID | None
    session_id: uuid.UUID
    tenant_id: str
    conversation_history: list[ChatMessage] = field(default_factory=list)


@dataclass(frozen=True)
class OrchestratorOutput:
    message: str
    model_used: str
    rag_used: bool
    sources: list[SourceRef]
    risk_level: RiskLevel
