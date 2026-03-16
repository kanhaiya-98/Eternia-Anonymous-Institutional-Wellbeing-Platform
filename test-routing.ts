import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const client = createClient(supabaseUrl, anonKey);

async function testRole(username: string) {
  const { data, error } = await client.auth.signInWithPassword({
    email: `${username}@eternia.app`,
    password: "password123",
  });
  if (error) {
    console.log(`❌ Login failed for ${username}: ${error.message}`);
    return;
  }
  
  // Directly mimic what getCurrentUserProfile does in server auth
  const { data: dbUser, error: dbError } = await client
    .from("users")
    .select("role")
    .eq("id", data.user.user_metadata.id || data.user.id)
    .single();
    
  if (dbError) {
     console.log(`❌ Failed to fetch user row for ${username}: ${dbError.message}. Does the user row exist in public.users?`);
  } else {
     console.log(`✅ ${username} logged in successfully. Role in DB: ${dbUser.role}`);
  }
}

async function run() {
  await testRole("expert_1");
  await testRole("spoc_1");
  await testRole("admin_1");
  await testRole("intern_1");
}

run();
