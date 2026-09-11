import { NextResponse } from "next/server";
import { applyReviewAction, getReviewItem } from "@/mocks/review-store";

export async function GET(_req: Request, { params }: { params: { itemId: string } }) {
  const item = getReviewItem(params.itemId);
  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function POST(req: Request, { params }: { params: { itemId: string } }) {
  const body = (await req.json()) as {
    action: "approved" | "edited_approve" | "rejected";
    reviewer: string;
    editedDraft?: string;
  };

  const item = applyReviewAction(params.itemId, body.action, body.reviewer, body.editedDraft);
  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}
