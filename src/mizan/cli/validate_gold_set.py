"""CLI to schema-validate gold-set submissions before they're accepted.

Usage:
    uv run validate-gold-set data/practice_areas/marriage_family/gold_set/*.json
"""

from __future__ import annotations

import json
from pathlib import Path

import typer
from pydantic import ValidationError

from mizan.schemas.gold_set import GoldSetEntry

app = typer.Typer(add_completion=False)


@app.command()
def main(paths: list[Path]) -> None:
    """Validate one or more gold-set entry JSON files against GoldSetEntry."""
    exit_code = 0
    for path in paths:
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            GoldSetEntry.model_validate(raw)
        except (json.JSONDecodeError, ValidationError) as exc:
            exit_code = 1
            typer.secho(f"[INVALID] {path}", fg=typer.colors.RED)
            typer.echo(str(exc))
        else:
            typer.secho(f"[OK] {path}", fg=typer.colors.GREEN)

    raise typer.Exit(code=exit_code)


if __name__ == "__main__":
    app()
