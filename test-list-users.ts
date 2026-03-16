import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing url or service role key in env");
}

const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function checkUsers() {
  const { data, error } = await adminAuthClient.auth.admin.listUsers();
  if (error) {
    console.error("List Users Error:", error);
    return;
  }
  
  console.log("Found users:", data.users.length);
  for (const user of data.users) {
    console.log(`- ${user.email} (confirmed: ${user.email_confirmed_at != null}) (metadata: ${JSON.stringify(user.user_metadata)})`);
  }
}

checkUsers();
