import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/admin/users — fetch all users from public.users
export async function GET() {
  const { data, error } = await admin()
    .from("users")
    .select("id, username, role, institution_id, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data || [] });
}

// POST /api/admin/users — create a new user with a given role
export async function POST(req: NextRequest) {
  const { username, password, role, institutionCode } = await req.json();

  if (!username || !password || !role) {
    return NextResponse.json({ error: "username, password and role are required" }, { status: 400 });
  }

  const supabase = admin();

  // Resolve institution code → UUID (default to first institution if not provided)
  let institutionId: string | null = null;
  if (institutionCode) {
    const { data: inst } = await supabase
      .from("institutions")
      .select("id")
      .eq("eternia_code", institutionCode.trim().toUpperCase())
      .maybeSingle();
    institutionId = inst?.id ?? null;
  } else {
    // Grab the first active institution
    const { data: inst } = await supabase
      .from("institutions")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    institutionId = inst?.id ?? null;
  }

  // Create the auth user (trigger will create public.users row)
  const { data, error } = await supabase.auth.admin.createUser({
    email: `${username.trim().toLowerCase()}@eternia.app`,
    password,
    email_confirm: true,
    user_metadata: {
      username: username.trim().toLowerCase(),
      institution_id: institutionId,
      role: role.toUpperCase(),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Patch role directly in case trigger didn't set it correctly
  if (data?.user) {
    await supabase
      .from("users")
      .update({ role: role.toUpperCase() })
      .eq("id", data.user.id);
  }

  return NextResponse.json({ success: true, userId: data?.user?.id });
}

// PATCH /api/admin/users — update a user's role
export async function PATCH(req: NextRequest) {
  const { userId, role } = await req.json();
  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }

  const { error } = await admin()
    .from("users")
    .update({ role: role.toUpperCase() })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
