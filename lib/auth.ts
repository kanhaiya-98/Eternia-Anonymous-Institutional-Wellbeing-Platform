"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Validate an Eternia institution code against the Supabase `institutions` table.
 * Returns { id, name } if the code is valid and the institution is active.
 * Returns null for any invalid / inactive code (no enumeration information leaked).
 */
export async function validateEterniaCode(
  code: string,
): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("eternia_code", code.trim())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return { id: data.id as string, name: data.name as string };
}

/**
 * Sign up a new Eternia student account.
 *
 * Flow:
 *  1. Call supabase.auth.signUp() — passes username, institution_id and role
 *     as raw_user_meta_data so the `handle_new_user` DB trigger can create the
 *     public.users row automatically.
 *  2. If a deviceFingerprint is supplied, patch the users row with the
 *     encrypted device fingerprint after the trigger has run.
 *
 * The constructed email `{username}@eternia.app` is never surfaced in the UI
 * and is used purely as a stable, globally-unique identifier for Supabase Auth.
 * No real email is collected or stored.
 *
 * Prerequisite: Email confirmation must be DISABLED in the Supabase Auth
 * settings for the project (see supabase/README.md → Step 4).
 */
export async function signUp(params: {
  username: string;
  password: string;
  institutionId: string;
  deviceFingerprint?: string;
}): Promise<{ error: string | null }> {
  const { username, password, institutionId, deviceFingerprint } = params;
  
  // Use the service role client so we can use the Admin API to create users and auto-confirm them
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return { error: "Server configuration error: Service role key is missing." };
  }
  
  const adminAuthClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // ── Step 0: Resolve the institution code to a UUID ─────────────────────
  // The frontend passes the eternia_code (e.g., 'DEMO2025') as institutionId,
  // but the DB trigger requires a valid UUID. We must look it up first.
  const { data: instData, error: instError } = await adminAuthClient
    .from("institutions")
    .select("id")
    .eq("eternia_code", institutionId)
    .single();

  if (instError || !instData) {
    return { error: "Invalid or expired institution code. Please scan again." };
  }

  const realInstitutionUuid = instData.id;

  // ── Step 1: Create the Supabase Auth user via Admin API ─────────────────
  // This bypasses the rate limits and requires no email confirmation.
  const { data, error: authError } = await adminAuthClient.auth.admin.createUser({
    email: `${username.trim().toLowerCase()}@eternia.app`,
    password,
    email_confirm: true, // Auto-confirm dummy email
    user_metadata: {
      username: username.trim().toLowerCase(),
      institution_id: realInstitutionUuid,
      role: "STUDENT",
    },
  });

  if (authError) {
    // Surface a user-friendly message without leaking internal details.
    if (authError.message.toLowerCase().includes("already registered") || authError.status === 422) {
      return {
        error: "This username is already taken. Please choose a different one.",
      };
    }
    return { error: authError.message };
  }

  const authUser = data?.user;
  if (!authUser) {
    return { error: "Account creation failed. Please try again." };
  }

  // ── Step 2 (optional): Patch device fingerprint ───────────────────────────
  if (deviceFingerprint) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await adminAuthClient
      .from("users")
      .update({ device_id_encrypted: deviceFingerprint })
      .eq("id", authUser.id);
  }

  return { error: null };
}

/**
 * Sign in an existing Eternia user using their username and password.
 *
 * Constructs the Supabase Auth email as `{username}@eternia.app` (the same
 * pattern used at registration). The user only ever types their username — no
 * email is shown or collected.
 */
export async function signIn(
  username: string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: `${username.trim().toLowerCase()}@eternia.app`,
    password,
  });

  if (error) {
    console.error("signIn error:", error);
    // Return a generic message to prevent user enumeration.
    return { error: "Invalid username or password. Please try again." };
  }

  return { error: null };
}

/**
 * Sign out the currently authenticated user and clear the Supabase session.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Get the currently authenticated Supabase Auth user.
 * Returns null if the user is not authenticated.
 */
export async function getCurrentAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Fetch the public.users profile record for the currently authenticated user.
 * Returns null if unauthenticated or if the record doesn't exist yet.
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
    return { data: null, error: "DEBUG: No user from supabase.auth.getUser()" };
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, username, role, institution_id, apaar_verified, erp_verified, created_at",
    )
    .eq("id", user.id)
    .single();

  if (error) {
    return { data: null, error: `DEBUG: DB Error: ${error.message}` };
  }
  
  if (!data) {
    return { data: null, error: "DEBUG: DB query returned NO DATA" };
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
    error: null
  };
}
