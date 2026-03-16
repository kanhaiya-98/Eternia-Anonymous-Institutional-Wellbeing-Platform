import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testAuthTrigger() {
  const { data: inst } = await adminAuthClient.from("institutions").select("id").limit(1).single();
  const timestamp = Date.now();
  
  // Create an auth user to see the exact error
  const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: `test_${timestamp}@eternia.app`,
      password: "password123",
      email_confirm: true,
      user_metadata: {
        username: `test_${timestamp}`,
        role: "STUDENT",
        institution_id: inst?.id
      },
  });
  
  console.log("Auth Creation Error:", error);
}

testAuthTrigger();
