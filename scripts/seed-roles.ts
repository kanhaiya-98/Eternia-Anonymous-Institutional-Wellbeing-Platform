import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminAuthClient = createClient(supabaseUrl, serviceRoleKey);

const TEST_USERS = [
  { username: "expert_1", role: "EXPERT", password: "password123", email: "expert_1@eternia.app" },
  { username: "spoc_1", role: "SPOC", password: "password123", email: "spoc_1@eternia.app" },
  { username: "admin_1", role: "ADMIN", password: "password123", email: "admin_1@eternia.app" },
  { username: "intern_1", role: "INTERN", password: "password123", email: "intern_1@eternia.app" },
];

async function seedTestUsers() {
  console.log("Seeding test users for Role-Based Access Testing...");
  
  // Fetch the first institution
  let institutionId;
  const { data: instData, error: instError } = await adminAuthClient.from("institutions").select("id").limit(1).maybeSingle();
  
  if (instError || !instData) {
     console.error("No institution found! Please ensure migration 004_seed_data.sql was run so there is at least one institution.");
     return;
  }
  institutionId = instData.id;

  for (const user of TEST_USERS) {
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        role: user.role,
        institution_id: institutionId
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
         console.log(`[SKIP] User ${user.username} (${user.role}) already exists.`);
      } else {
         console.error(`[ERROR] creating ${user.username}:`, error.message);
      }
    } else {
      console.log(`[SUCCESS] Created ${user.username} (${user.role})`);
    }
  }
}

seedTestUsers().catch(console.error);
