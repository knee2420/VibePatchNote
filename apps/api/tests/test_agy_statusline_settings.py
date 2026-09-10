import json

import pytest

from app.llm_settings.adapters import LocalAgyStatusLineSettings


def test_install_preserves_existing_agy_settings_and_marks_bridge_installed(tmp_path):
    settings_file = tmp_path / ".gemini" / "antigravity-cli" / "settings.json"
    settings_file.parent.mkdir(parents=True)
    settings_file.write_text(json.dumps({"theme": "dark", "statusLine": {"type": "text"}}), encoding="utf-8")
    adapter = LocalAgyStatusLineSettings(settings_file, 'python "C:/app/agy_status_bridge.py"')

    path = adapter.install()

    assert path == str(settings_file)
    saved = json.loads(settings_file.read_text(encoding="utf-8"))
    assert saved["theme"] == "dark"
    assert saved["statusLine"]["command"] == 'python "C:/app/agy_status_bridge.py"'
    assert saved["statusLine"]["stack_with_default"] is True
    assert adapter.is_installed() is True


def test_install_refuses_to_overwrite_invalid_json(tmp_path):
    settings_file = tmp_path / "settings.json"
    settings_file.write_text("{broken", encoding="utf-8")
    adapter = LocalAgyStatusLineSettings(settings_file, "python bridge.py")

    with pytest.raises(ValueError, match="형식"):
        adapter.install()

    assert settings_file.read_text(encoding="utf-8") == "{broken"
