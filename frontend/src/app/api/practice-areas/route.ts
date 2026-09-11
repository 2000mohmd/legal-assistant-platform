import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PracticeArea } from "@/types/practice-area";

// Real Supabase-backed data now (see supabase/migrations/0001_init.sql +
// seed.sql) — public read, no auth required, matching the practice_areas
// RLS policy.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_areas")
    .select("slug, name_ar, name_en, description_ar, description_en, status, href")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ practiceAreas: data as PracticeArea[] });
}
