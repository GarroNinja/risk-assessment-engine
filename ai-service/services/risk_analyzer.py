def analyze_risk(text):
    risks = []

    lower = text.lower()

    if "no firewall" in lower:
        risks.append("No firewall detected")

    if "password" in lower and "123" in lower:
        risks.append("Weak password detected")

    if "drop table" in lower:
        risks.append("SQL injection pattern detected")

    if "<script>" in lower:
        risks.append("XSS pattern detected")

    if not risks:
        return {
            "risk_level": "LOW",
            "detected_issues": []
        }

    return {
        "risk_level": "HIGH",
        "detected_issues": risks
    }