from dataclasses import dataclass

from app.ai.safety.policy import PolicyChecker
from app.ai.safety.risk_detector import RiskAssessment, RiskDetector


@dataclass(frozen=True)
class ResponseValidation:
    accepted: bool
    risk: RiskAssessment
    violations: list[str]


class ResponseChecker:
    """Runs on every LLM output before it reaches the user: re-checks for
    risk content the model itself introduced, plus the policy checks
    (no diagnostic/legal claims). Both must pass for a response to be
    accepted as-is.
    """

    def __init__(self, risk_detector: RiskDetector, policy_checker: PolicyChecker) -> None:
        self._risk_detector = risk_detector
        self._policy_checker = policy_checker

    async def check(self, response_text: str) -> ResponseValidation:
        risk = await self._risk_detector.assess(response_text)
        policy = await self._policy_checker.check(response_text)
        accepted = policy.allowed and risk.risk_level not in ("high", "critical")
        return ResponseValidation(accepted=accepted, risk=risk, violations=policy.violations)
