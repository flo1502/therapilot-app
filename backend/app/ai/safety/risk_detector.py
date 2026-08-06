import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Literal

RiskLevel = Literal["none", "low", "medium", "high", "critical"]


@dataclass(frozen=True)
class RiskAssessment:
    risk_level: RiskLevel
    self_harm: bool = False
    suicide: bool = False
    psychosis: bool = False
    requires_special_flow: bool = False
    matched_terms: list[str] = field(default_factory=list)


class RiskDetector(ABC):
    name: str

    @abstractmethod
    async def assess(self, text: str) -> RiskAssessment: ...


# NOT a clinically validated screening tool. Keyword matching is a coarse,
# high-recall/low-precision MVP placeholder whose only job is to route
# obviously concerning messages to the crisis workflow instead of the
# normal chat flow, and to never silently let them through. Replace with a
# proper safety-classification model before this carries real clinical
# weight - see ai/safety/response_checker.py for where it plugs in.
_SUICIDE_TERMS = [
    r"suizid", r"selbstmord", r"mich (um|töten|umbringen)", r"nicht mehr leben",
    r"suicide", r"kill myself", r"end my life", r"want to die",
]
_SELF_HARM_TERMS = [
    r"selbstverletz", r"ritze mich", r"self.?harm", r"cutting myself",
]
_PSYCHOSIS_TERMS = [
    r"stimmen (in meinem kopf|hören)", r"verfolgt mich", r"hearing voices",
    r"being watched", r"psychose",
]


class KeywordRiskDetector(RiskDetector):
    name = "keyword-risk-detector"

    async def assess(self, text: str) -> RiskAssessment:
        lowered = text.lower()
        matched: list[str] = []

        suicide = _match_any(lowered, _SUICIDE_TERMS, matched)
        self_harm = _match_any(lowered, _SELF_HARM_TERMS, matched)
        psychosis = _match_any(lowered, _PSYCHOSIS_TERMS, matched)

        if suicide:
            level: RiskLevel = "critical"
        elif self_harm or psychosis:
            level = "high"
        else:
            level = "low"

        return RiskAssessment(
            risk_level=level,
            self_harm=self_harm,
            suicide=suicide,
            psychosis=psychosis,
            requires_special_flow=level in ("high", "critical"),
            matched_terms=matched,
        )


def _match_any(text: str, patterns: list[str], matched: list[str]) -> bool:
    found = False
    for pattern in patterns:
        if re.search(pattern, text):
            matched.append(pattern)
            found = True
    return found
