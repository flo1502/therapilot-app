from app.ai.orchestrator.router import RuleBasedRouter
from app.ai.safety.risk_detector import RiskAssessment

router = RuleBasedRouter()


def _risk(**overrides) -> RiskAssessment:
    defaults = dict(risk_level="low", requires_special_flow=False)
    defaults.update(overrides)
    return RiskAssessment(**defaults)


def test_crisis_takes_priority_over_everything_else():
    decision = router.route(
        message="Vergleiche mehrere Optionen zur Diagnose bitte.",
        risk=_risk(risk_level="critical", requires_special_flow=True),
        frontier_available=True,
    )
    assert decision.target == "crisis"
    assert decision.use_rag is False


def test_clinical_knowledge_routes_local_with_rag():
    decision = router.route(
        message="Was sagt die Leitlinie zu Verhaltenstherapie bei Angststörung?",
        risk=_risk(),
        frontier_available=True,
    )
    assert decision.target == "local"
    assert decision.use_rag is True


def test_complex_reasoning_routes_frontier_when_available():
    decision = router.route(
        message="Bitte vergleiche mehrere Optionen und wäge Vor- und Nachteile ab.",
        risk=_risk(),
        frontier_available=True,
    )
    assert decision.target == "frontier"


def test_complex_reasoning_falls_back_to_local_when_frontier_unavailable():
    decision = router.route(
        message="Bitte vergleiche mehrere Optionen und wäge Vor- und Nachteile ab.",
        risk=_risk(),
        frontier_available=False,
    )
    assert decision.target == "local"


def test_default_routes_local_without_rag():
    decision = router.route(
        message="Danke für das Gespräch heute.",
        risk=_risk(),
        frontier_available=True,
    )
    assert decision.target == "local"
    assert decision.use_rag is False
