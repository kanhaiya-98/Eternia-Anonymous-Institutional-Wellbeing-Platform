import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: "Not authenticated" }, { status: 401 });
  }

  // Use service role to bypass RLS on public.users
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await admin
    .from("users")
    .select("id, username, role, institution_id, apaar_verified, erp_verified, created_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // Fallback: check user_metadata for role
    const metaRole = user.user_metadata?.role as string | undefined;
    return NextResponse.json({
      data: {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
        role: metaRole || "STUDENT",
        institution_id: null,
        apaar_verified: false,
        erp_verified: false,
        created_at: user.created_at,
      },
      error: null,
    });
  }

  return NextResponse.json({ data, error: null });
}
