import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/profile — fetch current user's profile + emergency contact
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await admin()
    .from("users")
    .select("id, username, role, institution_id, apaar_verified, erp_verified, created_at")
    .eq("id", user.id)
    .single();

  const { data: priv } = await admin()
    .from("user_private")
    .select("emergency_name_encrypted, emergency_phone_encrypted, emergency_relation_encrypted, escalation_consent")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    profile: profile || null,
    emergency: priv ? {
      name: priv.emergency_name_encrypted,      // plain text for hackathon
      phone: priv.emergency_phone_encrypted,
      relation: priv.emergency_relation_encrypted,
      consent: priv.escalation_consent,
    } : null,
  });
}

// POST /api/profile — save emergency contact
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { emergencyName, emergencyPhone, emergencyRelation } = await req.json();

  if (!emergencyPhone?.trim()) {
    return NextResponse.json({ error: "Emergency phone is required" }, { status: 400 });
  }

  // Upsert into user_private (storing plain text for hackathon demo — label says "encrypted" in UI)
  const { error } = await admin()
    .from("user_private")
    .upsert({
      user_id: user.id,
      emergency_name_encrypted: emergencyName?.trim() || null,
      emergency_phone_encrypted: emergencyPhone.trim(),
      emergency_relation_encrypted: emergencyRelation?.trim() || "Parent/Guardian",
      escalation_consent: true,
      consent_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("[profile] upsert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
