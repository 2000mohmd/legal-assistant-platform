"""FastAPI entry point. Run locally with:

    uv run uvicorn mizan.api.main:app --reload --port 8000

Only this process is allowed to cross the jurisdiction boundary (via
ClaudeClient, called from the chat route) — see the root CLAUDE.md
"Architecture principle: the jurisdiction boundary". CORS is restricted to
the known frontend origins rather than left open, since this API isn't
meant to be a public surface on its own.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mizan.api.routes.chat import router as chat_router

app = FastAPI(title="Mizan backend API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3100",
        "http://127.0.0.1:3100",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
