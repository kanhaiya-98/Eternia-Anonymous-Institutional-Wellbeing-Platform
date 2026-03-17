import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eterniaCode, escalatedBy, level, sessionInfo } = body;

  if (!eterniaCode) {
    return NextResponse.json({ error: "Missing eterniaCode" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Store in escalation_log table (simple flat table for demo)
  const { data, error } = await supabase
    .from("escalation_log")
    .insert({
      eternia_code: eterniaCode,
      escalated_by: escalatedBy || "Doctor",
      escalation_level: level || "Level 3",
      timestamp: new Date().toISOString(),
      session_info: sessionInfo || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[escalate] DB insert error:", error.message);
    // Even if DB fails, return success so Realtime broadcast still works
    return NextResponse.json({
      success: true,
      dbError: error.message,
      escalation: {
        eternia_code: eterniaCode,
        escalated_by: escalatedBy || "Doctor",
        escalation_level: level || "Level 3",
        timestamp: new Date().toISOString(),
      },
    });
  }

  return NextResponse.json({ success: true, escalation: data });
}

// PATCH /api/escalate — acknowledge an escalation
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from("escalation_log")
    .update({ is_acknowledged: true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("escalation_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ escalations: [] });
  }

  return NextResponse.json({ escalations: data || [] });
}
