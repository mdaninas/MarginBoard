from __future__ import annotations

from app.config import Settings, _split_csv


def test_cors_origins_accepts_render_plain_string(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "https://margin-board.vercel.app")

    settings = Settings(_env_file=None)

    assert settings.cors_origins == "https://margin-board.vercel.app"
    assert _split_csv(settings.cors_origins) == ("https://margin-board.vercel.app",)


def test_cors_origins_accepts_comma_separated_values(monkeypatch) -> None:
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://margin-board.vercel.app, https://www.margin-board.com",
    )

    settings = Settings(_env_file=None)

    assert _split_csv(settings.cors_origins) == (
        "https://margin-board.vercel.app",
        "https://www.margin-board.com",
    )
