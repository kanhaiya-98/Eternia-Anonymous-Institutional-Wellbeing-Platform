import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testAuthTrigger() {
  const { data: inst } = await adminAuthClient.from("institutions").select("id").limit(1).single();
  const timestamp = Date.now();
  
  // We cannot modify the trigger directly via SQL execution due to API limits.
  // We need the user to run the fix.
  // First let's check what happens if we remove the `role` and `institution_id` from metadata.
  console.log("Creating user WITHOUT institution ID to test if the fallback logic is crashing...");
  const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: `test_no_inst_${timestamp}@eternia.app`,
      password: "password123",
      email_confirm: true,
      user_metadata: {
        username: `test_no_inst_${timestamp}`,
      },
  });
  
  console.log("Auth Creation Error without ID:", error);
}

testAuthTrigger();
