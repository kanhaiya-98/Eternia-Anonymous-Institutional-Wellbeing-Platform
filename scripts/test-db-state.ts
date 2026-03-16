import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

async function testQuery() {
  const username = "krsnaa";

  console.log("Looking up auth user for:", username);
  // Email is username@eternia.app
  const { data: { users }, error: listError } = await adminAuthClient.auth.admin.listUsers();
  
  const user = users?.find(u => u.email === `${username}@eternia.app`);
  
  if (!user) {
    console.log("Auth user not found in total list of", users?.length, "users.");
    for (let u of users || []) {
      console.log(u.email);
    }
  } else {
    console.log("Auth user found:", user.id);
    
    // Check public.users
    const { data: publicUser, error: dbError } = await adminAuthClient
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
      
    if (dbError) {
      console.error("DB error fetching public user:", dbError);
    } else if (!publicUser) {
      console.log("Public user NOT found! This means the handle_new_user trigger failed to insert.");
    } else {
      console.log("Public user found:", publicUser);
    }
  }
}

testQuery();
