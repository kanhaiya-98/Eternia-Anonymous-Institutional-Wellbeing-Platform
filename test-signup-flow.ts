import { signUp } from "./lib/auth";

async function testSignup() {
  const timestamp = Date.now();
  console.log("Testing actual signUp function with text eterniaCode...");
  
  const result = await signUp({
    username: `test_actual_signup_${timestamp}`,
    password: "password123",
    institutionId: "DEMO2025" // This used to crash the trigger
  });
  
  console.log("Signup Result:", result);
}

testSignup();
