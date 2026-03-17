"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Returns an admin-level Supabase client using the service role key.
 * This bypasses RLS and can call auth.admin.* methods.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Sign up a new Eternia student account via the Admin API.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set and valid.
 * The DB trigger (handle_new_user) auto-creates the public.users row.
 */
export async function signUp(params: {
  username: string;
  password: string;
  institutionId: string; // institution UUID (already resolved)
}): Promise<{ error: string | null }> {
  const { username, password, institutionId } = params;

  const admin = getAdminClient();

  const { data, error: authError } = await admin.auth.admin.createUser({
    email: `${username.trim().toLowerCase()}@eternia.app`,
    password,
    email_confirm: true, // skip email confirmation entirely
    user_metadata: {
      username: username.trim().toLowerCase(),
      institution_id: institutionId,
      role: "STUDENT",
    },
  });

  if (authError) {
    console.error("[signUp] admin.createUser error:", authError.message);
    if (
      authError.message.toLowerCase().includes("already registered") ||
      authError.message.toLowerCase().includes("already been registered") ||
      authError.status === 422
    ) {
      return {
        error: "This username is already taken. Please choose a different one.",
      };
    }
    return { error: `Signup failed: ${authError.message}` };
  }

  if (!data?.user) {
    return { error: "Account creation failed. Please try again." };
  }

  return { error: null };
}

/**
 * Sign in an existing Eternia user using their username and password.
 * Uses the cookie-based server client (needs valid anon key in .env).
 *
 * If you see 'Invalid API key', your NEXT_PUBLIC_SUPABASE_ANON_KEY in
 * .env.local is stale. Go to Supabase Dashboard → Settings → API and
 * copy the current anon/public key.
 */
export async function signIn(
  username: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: `${username.trim().toLowerCase()}@eternia.app`,
    password,
  });

  if (error) {
    console.error("[signIn] error:", error.message);
    if (error.message.toLowerCase().includes("invalid api key")) {
      return {
        error:
          "Server config error: NEXT_PUBLIC_SUPABASE_ANON_KEY is invalid. " +
          "Get the correct key from Supabase Dashboard → Settings → API.",
      };
    }
    return { error: "Invalid username or password. Please try again." };
  }

  return { error: null };
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Get the currently authenticated Supabase Auth user.
 */
export async function getCurrentAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Fetch the public.users profile for the currently authenticated user.
 */
export async function getCurrentUserProfile(): Promise<{
  data: {
    id: string;
    username: string;
    role: string;
    institution_id: string | null;
    apaar_verified: boolean;
    erp_verified: boolean;
    created_at: string;
  } | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, username, role, institution_id, apaar_verified, erp_verified, created_at"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("[getCurrentUserProfile] DB error:", error?.message);
    return { data: null, error: "Could not load user profile." };
  }

  return {
    data: {
      id: data.id as string,
      username: data.username as string,
      role: data.role as string,
      institution_id: data.institution_id as string | null,
      apaar_verified: data.apaar_verified as boolean,
      erp_verified: data.erp_verified as boolean,
      created_at: data.created_at as string,
    },
    error: null,
  };
}
