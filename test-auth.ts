import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bwnolhnctituzjlfztzz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bm9saG5jdGl0dXpqbGZ6dHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDAzOTgsImV4cCI6MjA4ODk3NjM5OH0.k4QmUGEyJRJSJEiHCo-z2IPnhIVLwRf1-60hjYvOTos";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: "test_only2@example.com",
    password: "password123",
    options: {
      data: {
        username: "test_only2",
        institution_id: "ETR-102938",
        role: "STUDENT"
      }
    }
  });
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
