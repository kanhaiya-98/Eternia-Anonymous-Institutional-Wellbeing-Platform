import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// POST /api/escalate — store escalation + look up emergency contact by userId
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eterniaCode, escalatedBy, level, sessionInfo, userId, username } = body;

  if (!eterniaCode) {
    return NextResponse.json({ error: "Missing eterniaCode" }, { status: 400 });
  }

  const supabase = admin();

  // Fetch emergency contact from user_private if we have a userId
  let emergencyContact = { name: null as string | null, phone: null as string | null, relation: null as string | null };
  if (userId) {
    const { data: priv } = await supabase
      .from("user_private")
      .select("emergency_name_encrypted, emergency_phone_encrypted, emergency_relation_encrypted")
      .eq("user_id", userId)
      .maybeSingle();
    if (priv) {
      emergencyContact = {
        name: priv.emergency_name_encrypted || null,
        phone: priv.emergency_phone_encrypted || null,
        relation: priv.emergency_relation_encrypted || null,
      };
    }
  }

  const { data, error } = await supabase
    .from("escalation_log")
    .insert({
      eternia_code: eterniaCode,
      escalated_by: escalatedBy || "Doctor",
      escalation_level: level || "Level 3",
      timestamp: new Date().toISOString(),
      session_info: sessionInfo || null,
      student_username: username || null,
      emergency_contact_name: emergencyContact.name,
      emergency_contact_phone: emergencyContact.phone,
      emergency_contact_relation: emergencyContact.relation,
    })
    .select()
    .single();

  if (error) {
    console.error("[escalate] DB insert error:", error.message);
    // Realtime broadcast payload still carries emergency contact
    return NextResponse.json({
      success: true,
      dbError: error.message,
      escalation: {
        id: String(Date.now()),
        eternia_code: eterniaCode,
        escalated_by: escalatedBy || "Doctor",
        escalation_level: level || "Level 3",
        timestamp: new Date().toISOString(),
        username,
        emergency_contact_name: emergencyContact.name,
        emergency_contact_phone: emergencyContact.phone,
        emergency_contact_relation: emergencyContact.relation,
      },
    });
  }

  return NextResponse.json({
    success: true,
    escalation: data,
    emergencyContact,
  });
}

// PATCH /api/escalate — acknowledge (mark as acknowledged in DB)
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin()
    .from("escalation_log")
    .update({ is_acknowledged: true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET /api/escalate — fetch all escalations (for SPOC/Admin load)
export async function GET() {
  const { data, error } = await admin()
    .from("escalation_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ escalations: [] });
  return NextResponse.json({ escalations: data || [] });
}
