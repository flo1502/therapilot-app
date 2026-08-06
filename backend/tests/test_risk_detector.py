import pytest

from app.ai.safety.risk_detector import KeywordRiskDetector

detector = KeywordRiskDetector()


@pytest.mark.parametrize(
    "text",
    ["Ich denke oft an Suizid.", "I just want to kill myself.", "Ich will nicht mehr leben."],
)
async def test_suicide_language_is_critical(text: str):
    result = await detector.assess(text)
    assert result.risk_level == "critical"
    assert result.suicide is True
    assert result.requires_special_flow is True


async def test_self_harm_language_is_high():
    result = await detector.assess("Ich ritze mich seit ein paar Wochen wieder.")
    assert result.risk_level == "high"
    assert result.self_harm is True
    assert result.requires_special_flow is True


async def test_neutral_message_is_low_risk():
    result = await detector.assess("Ich hatte diese Woche eine gute Sitzung.")
    assert result.risk_level == "low"
    assert result.requires_special_flow is False
    assert not result.suicide and not result.self_harm and not result.psychosis
