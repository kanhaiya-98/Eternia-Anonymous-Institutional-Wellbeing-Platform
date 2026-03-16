import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testTrigger() {
  const { data: inst } = await adminAuthClient.from("institutions").select("id").limit(1).single();
  
  // Directly try to call log_audit_event
  const { error } = await adminAuthClient.rpc("log_audit_event", {
    p_actor_id: "00000000-0000-0000-0000-000000000000",
    p_action_type: "USER_CREATED",
    p_target_table: "users",
    p_target_id: "00000000-0000-0000-0000-000000000000",
    p_metadata: { role: "EXPERT" }
  });
  
  if (error) {
     console.log("Audit log failed:", error.message);
  } else {
     console.log("Audit log succeeded.");
  }
}

testTrigger();
