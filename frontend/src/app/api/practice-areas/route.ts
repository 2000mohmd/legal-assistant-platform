import { NextResponse } from "next/server";
import { practiceAreas } from "@/mocks/fixtures/practice-areas";

// Mock backend seam: this is intentionally a real HTTP endpoint (not an
// in-memory function) so swapping in the real FastAPI service later is a
// base-URL config change, not a rewrite. See frontend-CLAUDE.md.
export async function GET() {
  return NextResponse.json({ practiceAreas });
}
