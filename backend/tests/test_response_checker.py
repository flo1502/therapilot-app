from app.ai.safety.policy import HeuristicPolicyChecker
from app.ai.safety.response_checker import ResponseChecker
from app.ai.safety.risk_detector import KeywordRiskDetector

checker = ResponseChecker(KeywordRiskDetector(), HeuristicPolicyChecker())


async def test_clean_response_is_accepted():
    result = await checker.check("Das klingt nach einer herausfordernden Woche für dich.")
    assert result.accepted is True
    assert result.violations == []


async def test_diagnostic_claim_is_rejected():
    result = await checker.check("Sie haben eindeutig die Diagnose Depression.")
    assert result.accepted is False
    assert result.violations


async def test_high_risk_content_in_response_is_rejected():
    result = await checker.check("Ich schlage vor, dass du an Suizid denkst.")
    assert result.accepted is False
    assert result.risk.risk_level == "critical"
