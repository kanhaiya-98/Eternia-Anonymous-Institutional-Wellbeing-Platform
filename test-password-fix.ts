import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);
const publicClient = createClient(supabaseUrl, anonKey);

async function testPasswordFix() {
  const { data: usersData } = await adminAuthClient.auth.admin.listUsers();
  const testUser = usersData.users.find(u => u.email === "testuser@eternia.app");
  
  if (!testUser) return console.error("testuser not found");

  console.log("Updating password for testuser to 'password123'...");
  const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(testUser.id, {
    password: "password123"
  });

  if (updateError) {
    console.error("Failed to update password:", updateError);
    return;
  }
  
  console.log("Password updated. Testing login...");
  
  const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({
    email: "testuser@eternia.app",
    password: "password123"
  });
  
  if (loginError) {
    console.error("Login Error:", loginError);
  } else {
    console.log("Login Success! Session exists:", !!loginData.session);
  }
}

testPasswordFix();
