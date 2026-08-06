import re
from abc import ABC, abstractmethod

from app.ai.orchestrator.schemas import RouteDecision
from app.ai.safety.risk_detector import RiskAssessment

# Deterministic placeholders for intent/complexity detection. Section 3 of
# the spec is explicit that this should start simple and readable, and be
# replaceable later by a trained routing model - Router is the seam: swap
# RuleBasedRouter for a LearnedRouter without touching the orchestrator.
_CLINICAL_KEYWORDS = [
    "depression", "angststörung", "angst", "trauma", "ptbs", "borderline",
    "zwangsstörung", "leitlinie", "diagnose", "medikament", "therapiemethode",
    "kbt", "verhaltenstherapie", "psychoedukation",
]

_COMPLEX_REASONING_MARKERS = [
    "vergleiche", "differentialdiagnose", "analysiere", "wäge ab",
    "vor- und nachteile", "mehrere optionen",
]
_COMPLEX_LENGTH_THRESHOLD = 500


class Router(ABC):
    name: str

    @abstractmethod
    def route(
        self, *, message: str, risk: RiskAssessment, frontier_available: bool
    ) -> RouteDecision: ...


class RuleBasedRouter(Router):
    name = "rule-based-router"

    def route(
        self, *, message: str, risk: RiskAssessment, frontier_available: bool
    ) -> RouteDecision:
        if risk.requires_special_flow:
            return RouteDecision(target="crisis", use_rag=False, reason="risk_detected")

        requires_clinical_knowledge = _matches_any(message, _CLINICAL_KEYWORDS)
        requires_complex_reasoning = (
            _matches_any(message, _COMPLEX_REASONING_MARKERS)
            or len(message) > _COMPLEX_LENGTH_THRESHOLD
        )

        if requires_complex_reasoning and frontier_available:
            return RouteDecision(
                target="frontier",
                use_rag=requires_clinical_knowledge,
                reason="complex_reasoning",
            )

        if requires_clinical_knowledge:
            return RouteDecision(target="local", use_rag=True, reason="clinical_knowledge")

        return RouteDecision(target="local", use_rag=False, reason="default")


def _matches_any(text: str, keywords: list[str]) -> bool:
    lowered = text.lower()
    return any(re.search(rf"\b{re.escape(kw)}\b", lowered) for kw in keywords)
