import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

# Heuristic only - catches the most obvious phrasing, not a substitute for
# review. The product must never present itself as making medical/legal
# determinations (see CLAUDE.md / docs/compliance).
_DIAGNOSTIC_CLAIM_PATTERNS = [
    r"\bsie haben (eindeutig |definitiv )?(die )?diagnose\b",
    r"\byou (definitely |clearly )?have (a diagnosis of|been diagnosed with)\b",
    r"\bich diagnostiziere\b",
    r"\bi diagnose you\b",
]


@dataclass(frozen=True)
class PolicyResult:
    allowed: bool
    violations: list[str] = field(default_factory=list)


class PolicyChecker(ABC):
    name: str

    @abstractmethod
    async def check(self, text: str) -> PolicyResult: ...


class HeuristicPolicyChecker(PolicyChecker):
    name = "heuristic-policy-checker"

    async def check(self, text: str) -> PolicyResult:
        lowered = text.lower()
        violations = [p for p in _DIAGNOSTIC_CLAIM_PATTERNS if re.search(p, lowered)]
        return PolicyResult(allowed=not violations, violations=violations)
