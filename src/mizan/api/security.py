"""Shared-secret auth between the frontend and this backend.

CORS alone does not protect this API: it's a browser-enforced mechanism
that stops a webpage on another origin from calling here with a user's
cookies, but does nothing to stop a direct server-to-server or curl call
once this service is reachable at all — which it will be the moment it's
deployed anywhere off localhost. Without this, anyone who found the URL
could call /v1/chat directly, bypassing the frontend's Supabase auth
check entirely and running up real model-API costs on our credentials.

Fails closed, not open: a missing MIZAN_INTERNAL_API_KEY is a server
misconfiguration (loud 500s), never "no check needed." Local dev sets a
clearly-labeled placeholder value rather than being exempt from the check
entirely, so the code path that will run in production is the same one
exercised locally.
"""

from __future__ import annotations

import os
import secrets

from fastapi import Header, HTTPException


def require_internal_api_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    expected = os.environ.get("MIZAN_INTERNAL_API_KEY")
    if not expected:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: MIZAN_INTERNAL_API_KEY is not set.",
        )
    if not x_internal_api_key or not secrets.compare_digest(x_internal_api_key, expected):
        raise HTTPException(status_code=401, detail="Missing or invalid API key.")
