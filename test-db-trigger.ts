import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testTrigger() {
  const { data: inst } = await adminAuthClient.from("institutions").select("id").limit(1).single();
  
  const { error } = await adminAuthClient.from("users").insert({
     id: "00000000-0000-0000-0000-000000000000", // A UUID usually assigned by Auth
     institution_id: inst?.id,
     username: "test_trigger_1",
     role: "EXPERT"
  });
  console.log("Direct Insert Error:", error);
}

testTrigger();
