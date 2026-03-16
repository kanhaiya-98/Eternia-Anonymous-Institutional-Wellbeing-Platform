import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bwnolhnctituzjlfztzz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bm9saG5jdGl0dXpqbGZ6dHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDAzOTgsImV4cCI6MjA4ODk3NjM5OH0.k4QmUGEyJRJSJEiHCo-z2IPnhIVLwRf1-60hjYvOTos";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "test_only2@eternia.app",
    password: "password123",
  });
  console.log("Login Data:", data);
  console.log("Login Error:", error);
}

testLogin();
