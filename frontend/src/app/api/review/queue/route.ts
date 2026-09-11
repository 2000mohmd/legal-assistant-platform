import { NextResponse } from "next/server";
import { listReviewItems } from "@/mocks/review-store";

export async function GET() {
  return NextResponse.json({ items: listReviewItems() });
}
