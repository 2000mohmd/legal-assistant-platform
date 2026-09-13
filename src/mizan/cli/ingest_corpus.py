"""CLI to turn a raw text document into a SourceDocument JSON file under
data/practice_areas/<area>/corpus/, which `ingestion.loader.load_source_documents`
already knows how to read.

This is the actual entry point for tomorrow's dataset: point it at a real
document, and — once someone has redacted/reviewed it per the root
CLAUDE.md non-negotiables — it lands where the chat pipeline looks for it.
It does NOT do that review itself; it only performs the mechanical
chunking step. Nothing about this writes to a live/public path — data/
is local until a deliberate deploy step ships it, per the same
non-negotiables.

Usage:
    uv run ingest-corpus marriage_family "Some Statute" statute path/to/raw.txt
"""

from __future__ import annotations

from pathlib import Path

import typer

from mizan.ingestion.chunking import chunk_by_article_boundary
from mizan.schemas.documents import DocumentType, SourceDocument

app = typer.Typer(add_completion=False)

DATA_ROOT = Path(__file__).resolve().parents[3] / "data" / "practice_areas"


@app.command()
def main(
    practice_area: str,
    title: str,
    document_type: DocumentType,
    input_file: Path,
    doc_id: str | None = typer.Option(None, help="Defaults to a slug of the title."),
) -> None:
    raw_text = input_file.read_text(encoding="utf-8")
    articles = chunk_by_article_boundary(raw_text)

    if len(articles) == 1 and articles[0].number == "UNKNOWN":
        typer.secho(
            "WARNING: no article/madda boundary pattern matched — the whole "
            "document was ingested as a single UNKNOWN-numbered chunk. Citations "
            "against specific articles will not verify correctly. Pass a custom "
            "boundary pattern via chunk_by_article_boundary if this document uses "
            "a heading style other than 'Article N' / 'المادة N'.",
            fg=typer.colors.YELLOW,
        )

    resolved_id = doc_id or title.lower().replace(" ", "-")
    document = SourceDocument(
        id=resolved_id,
        title=title,
        practice_area=practice_area,
        document_type=document_type,
        articles=articles,
    )

    corpus_dir = DATA_ROOT / practice_area / "corpus"
    corpus_dir.mkdir(parents=True, exist_ok=True)
    out_path = corpus_dir / f"{resolved_id}.json"
    out_path.write_text(document.model_dump_json(indent=2), encoding="utf-8")

    typer.secho(
        f"[OK] Wrote {len(articles)} article(s) to {out_path}",
        fg=typer.colors.GREEN,
    )


if __name__ == "__main__":
    app()
