"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, LogIn, Lock, User, Sparkles } from "lucide-react";


export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = username.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    
    const signInRes = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((r) => r.json()).catch(() => ({ error: "Network error. Please try again." }));

    if (signInRes.error) {
      setIsLoading(false);
      setError(signInRes.error);
      return;
    }

    // Fetch profile via API route (server actions cannot be called from client components)
    const profileRes = await fetch("/api/me").then((r) => r.json()).catch(() => null);
    const role: string = profileRes?.data?.role || "STUDENT";

    setIsLoading(false);

    // Route based on role
    switch (role) {
      case "STUDENT":
        router.push("/dashboard");
        break;
      case "INTERN":
        router.push("/dashboard/intern");
        break;
      case "EXPERT":
        router.push("/dashboard/doctor");
        break;
      case "SPOC":
        router.push("/dashboard/spoc");
        break;
      case "ADMIN":
        router.push("/dashboard/admin");
        break;
      default:
        router.push("/dashboard");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background noise-bg">
      {/* Animated gradient orbs */}
      <div className="orb orb-1 w-[500px] h-[500px] -top-40 -right-32 opacity-55" />
      <div className="orb orb-2 w-[450px] h-[450px] -bottom-32 -left-24 opacity-45" />

      {/* Back button */}
      <button
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        onClick={() => router.push("/")}
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 text-center fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight gradient-text leading-none">
            Eternia
          </h1>
          <p className="text-muted-foreground mt-3 text-sm font-medium">
            Welcome back to your safe space
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass w-full rounded-2xl p-8 shadow-2xl gradient-border fade-in-up fade-in-up-delay-1">
          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.12), rgba(40,200,220,0.08))" }}>
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
          </div>

          <div className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                className="h-12 bg-background/60 border-border/60 focus:border-primary rounded-xl text-base transition-all duration-200"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-12 bg-background/60 border-border/60 focus:border-primary rounded-xl pr-12 text-base transition-all duration-200"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium px-1">{error}</p>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={!isFormValid || isLoading}
              className="btn-premium w-full h-12 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-3 text-muted-foreground font-medium">or</span>
              </div>
            </div>

            {/* Register */}
            <Button
              variant="outline"
              className="w-full h-12 border-border/60 hover:border-primary/50 hover:bg-primary/5 text-foreground rounded-xl font-medium transition-all duration-200"
              onClick={() => router.push("/")}
              disabled={isLoading}
            >
              New here? Register with Eternia Code
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs fade-in-up fade-in-up-delay-2">
          Your privacy is sacred. All conversations are anonymous and encrypted.
        </p>
      </div>
    </div>
  );
}
