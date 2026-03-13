import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client that uses the SERVICE ROLE key.
 *
 * SECURITY WARNING:
 * This client BYPASSES Row Level Security (RLS) completely.
 * It must ONLY be used in:
 *   - Next.js Server Components (no "use client" directive)
 *   - Next.js Route Handlers  (app/api/[...]/route.ts)
 *   - Next.js Server Actions  (functions marked "use server")
 *   - Middleware (middleware.ts) -- only if absolutely required
 *
 * NEVER import or call this function from any "use client" component.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY in a NEXT_PUBLIC_ variable.
 * NEVER commit this key to source control.
 *
 * Use cases in Eternia (Phase 1):
 *   - Writing immutable audit_log entries on behalf of any user
 *   - DPDP Act erasure -- hard-deleting user_private on account deletion
 *   - Admin identity reveal under formal escalation protocol
 *   - SPOC bulk credit grant operations
 *   - Seeding / migration scripts run from the server
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "[Eternia] NEXT_PUBLIC_SUPABASE_URL is not set. " +
        "Add it to your .env.local file. See supabase/README.md for setup instructions.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "[Eternia] SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Add it to your .env.local file. " +
        "NEVER prefix this with NEXT_PUBLIC_ -- it must remain server-side only. " +
        "See supabase/README.md for setup instructions.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable automatic session persistence -- service role clients must
      // never persist a session to cookies or localStorage.
      persistSession: false,
      // Do not auto-refresh: service role tokens do not expire.
      autoRefreshToken: false,
      // Suppress Supabase built-in browser detection warnings.
      detectSessionInUrl: false,
    },
  });
}

/**
 * Write an immutable entry to the audit_logs table using the service role.
 *
 * This is the ONLY authorised path for writing audit log entries from
 * server-side code. The audit_logs table has RLS policies that prevent
 * any client-side writes -- service role is required.
 *
 * @param actorId     - UUID of the user performing the action (auth.uid())
 * @param actionType  - Enum string describing the action, e.g. "USER_CREATED"
 * @param targetTable - The table the action affects, e.g. "users"
 * @param targetId    - UUID of the affected row
 * @param metadata    - Arbitrary JSONB payload. NEVER include raw PII here.
 * @param ipHash      - SHA-256 hash of the request IP address (never raw IP).
 */
export async function writeAuditLog(params: {
  actorId: string;
  actionType: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipHash?: string;
}): Promise<void> {
  const { actorId, actionType, targetTable, targetId, metadata, ipHash } =
    params;

  const supabase = createServiceClient();

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action_type: actionType,
    target_table: targetTable ?? null,
    target_id: targetId ?? null,
    metadata: metadata ?? {},
    ip_hash: ipHash ?? null,
  });

  if (error) {
    // Audit log failures are serious -- log to stderr so they appear in
    // platform monitoring (Sentry / Railway logs) even if the main request succeeds.
    console.error(
      `[Eternia audit] Failed to write audit log entry. ` +
        `actor=${actorId} action=${actionType} error=${error.message}`,
    );
  }
}

/**
 * Fetch the (encrypted) emergency contact fields for a given user_id.
 *
 * This function is ONLY called during a formal Level 3 crisis escalation,
 * after the SPOC has submitted a written justification AND an Eternia Admin
 * has approved the escalation request. Both events must be logged in
 * audit_logs BEFORE this function is called.
 *
 * In Phase 1, the _encrypted fields store plain text.
 * In Phase 2+, decrypt each field with AES-256-GCM using institution-scoped key.
 *
 * @returns The contact fields, or null if the row does not exist.
 */
export async function getEmergencyContactForEscalation(
  userId: string,
): Promise<{
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
} | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("user_private")
    .select(
      "emergency_name_encrypted, emergency_phone_encrypted, emergency_relation_encrypted",
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    emergency_name: (data.emergency_name_encrypted as string) ?? null,
    emergency_phone: (data.emergency_phone_encrypted as string) ?? null,
    emergency_relation: (data.emergency_relation_encrypted as string) ?? null,
  };
}

/**
 * Soft-delete a user account (DPDP Act erasure flow).
 *
 * Step 1 (this function):
 *   - Hard-delete user_private (strictest PII -- erase immediately)
 *   - Soft-delete users row (is_active = false, preserves FK integrity)
 *
 * Step 2 (caller's responsibility):
 *   - Delete the Supabase Auth user via supabase.auth.admin.deleteUser(userId)
 *     after this function returns true.
 *
 * Credit transactions are preserved for financial audit purposes
 * (DPDP Act data minimisation exception for financial records).
 *
 * @returns true if the erasure succeeded, false otherwise.
 */
export async function eraseUserData(userId: string): Promise<boolean> {
  const supabase = createServiceClient();

  // 1. Hard-delete user_private
  const { error: privateDeleteError } = await supabase
    .from("user_private")
    .delete()
    .eq("user_id", userId);

  if (privateDeleteError) {
    console.error(
      `[Eternia erasure] Failed to delete user_private for user ${userId}: ${privateDeleteError.message}`,
    );
    return false;
  }

  // 2. Soft-delete the users row
  const { error: softDeleteError } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", userId);

  if (softDeleteError) {
    console.error(
      `[Eternia erasure] Failed to soft-delete user ${userId}: ${softDeleteError.message}`,
    );
    return false;
  }

  return true;
}

/**
 * Grant ECC credits to a student on behalf of a SPOC.
 *
 * Inserts an immutable GRANT transaction into credit_transactions.
 * The trigger in migration 003 automatically refreshes the
 * credit_balance materialized view after the insert.
 *
 * @param userId        - The student receiving the credits
 * @param institutionId - The institution the student belongs to
 * @param delta         - Number of credits to grant (must be greater than 0)
 * @param spocId        - The SPOC authorising the grant (for audit trail)
 * @param notes         - Optional description, e.g. "Term 1 allocation"
 */
export async function grantCredits(params: {
  userId: string;
  institutionId: string;
  delta: number;
  spocId: string;
  notes?: string;
}): Promise<{ error: string | null }> {
  const { userId, institutionId, delta, spocId, notes } = params;

  if (delta <= 0) {
    return { error: "Credit grant amount must be greater than zero." };
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("credit_transactions").insert({
    user_id: userId,
    institution_id: institutionId,
    delta,
    type: "GRANT",
    reference_id: spocId,
    notes: notes ?? `Credit grant by SPOC ${spocId}`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
