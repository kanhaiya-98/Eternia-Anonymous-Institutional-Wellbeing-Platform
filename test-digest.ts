import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testTrigger() {
  const { data, error } = await adminAuthClient.rpc("log_audit_event", {
    p_actor_id: "00000000-0000-0000-0000-000000000000",
    p_action_type: "DIGEST_TEST",
    p_target_table: "users",
    p_target_id: "00000000-0000-0000-0000-000000000000",
    p_metadata: { role: "EXPERT" }
  });
  console.log("Error:", error);
}
testTrigger();
