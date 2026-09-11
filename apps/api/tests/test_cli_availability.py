from app.core.llm.availability import CliQuotaAvailability


class _Usage:
    def __init__(self, groups):
        self.groups = groups
        self.calls = 0

    def read(self):
        self.calls += 1
        return {"groups": self.groups}


def test_zero_remaining_marks_matching_model_group_exhausted():
    reader = _Usage([
        {"name": "Gemini 3 Flash", "buckets": [
            {"id": "daily", "remaining_fraction": 0.0, "disabled": False}
        ]},
        {"name": "Gemini 3 Pro", "buckets": [
            {"id": "daily", "remaining_fraction": 0.8, "disabled": False}
        ]},
    ])

    result = CliQuotaAvailability(reader).check("gemini-3.8-flash-low")

    assert result.state == "exhausted"
    assert result.remaining_fraction == 0


def test_unknown_group_does_not_guess_that_cli_is_exhausted():
    reader = _Usage([
        {"name": "Other pool", "buckets": [
            {"id": "daily", "remaining_fraction": 0.0, "disabled": False}
        ]}
    ])

    assert CliQuotaAvailability(reader).check("gemini-3.8-flash-low").state == "unknown"


def test_all_required_windows_must_have_remaining_quota():
    reader = _Usage([
        {"name": "Gemini 3 Flash", "buckets": [
            {"id": "minute", "remaining_fraction": 0.5, "disabled": False},
            {"id": "weekly", "remaining_fraction": 0.0, "disabled": False},
        ]}
    ])

    assert CliQuotaAvailability(reader).check("gemini-3.8-flash-low").state == "exhausted"
