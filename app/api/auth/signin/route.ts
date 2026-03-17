import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: `${username.trim().toLowerCase()}@eternia.app`,
    password,
  });

  if (error) {
    return NextResponse.json({ error: "Invalid username or password. Please try again." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
