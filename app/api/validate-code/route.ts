import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/validate-code
 * Validates an Eternia institution code and returns the institution UUID.
 * Uses service role to bypass RLS (institutions table requires auth for SELECT).
 */
export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey || !serviceRoleKey.startsWith("eyJ")) {
    // Fallback: if service role key is missing/wrong, return a dummy UUID
    // so we can at least test the auth flow. Remove this in production.
    console.error("[validate-code] Service role key is missing or invalid.");
    return NextResponse.json(
      { error: "Server configuration error. Contact admin." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("eternia_code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Invalid or unrecognized Eternia Code." },
      { status: 404 }
    );
  }

  return NextResponse.json({ id: data.id, name: data.name });
}
