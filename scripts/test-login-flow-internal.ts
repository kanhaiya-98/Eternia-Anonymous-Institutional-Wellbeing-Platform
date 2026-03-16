import { signIn, getCurrentUserProfile } from "../lib/auth";

async function runTest() {
  const username = "krsnaa";
  const password = "password123"; // or whatever password we assume the user typed

  console.log("Signing in with auth.ts...");
  const res = await signIn(username, password);
  console.log("Sign-in Result:", res);
  
  if (!res.error) {
    console.log("Fetching profile...");
    const profile = await getCurrentUserProfile();
    console.log("Profile:", profile);
  }
}

// NextJS Server Actions module might crash when called from raw node script because of `cookies()`
runTest().catch(console.error);
