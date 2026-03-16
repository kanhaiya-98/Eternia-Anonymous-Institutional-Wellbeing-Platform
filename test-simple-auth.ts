import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testAuthTrigger() {
  const timestamp = Date.now();
  console.log("Creating user explicitly mirroring the GoTrue schema...");
  
  // Note: we might need to cast institution_id as string if the trigger parsing 
  // `(NEW.raw_user_meta_data ->> 'institution_id')::UUID` expects a UUID-formatted string.
  const { data: inst } = await adminAuthClient.from("institutions").select("id").limit(1).single();
  const v_institution_id = inst?.id;

  const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: `test_simple_${timestamp}@eternia.app`,
      password: "password123",
      email_confirm: true,
      user_metadata: {
        username: `test_simple_${timestamp}`,
        role: "STUDENT",
        institution_id: v_institution_id
      },
  });
  
  console.log("Auth Creation Result:", error || "Success");
}

testAuthTrigger();
