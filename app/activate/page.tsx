"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, UserPlus, User, Lock, CheckCircle2, Sparkles } from "lucide-react";

export default function ActivateAccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = username.trim().length > 0 && password.length > 0;

  const handleSubmit = () => {
    if (!isFormValid) return;
    // Auth bypassed — go straight to login
    router.push("/login");
  };

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background noise-bg">
      {/* Animated gradient orbs */}
      <div className="orb orb-1 w-[550px] h-[550px] -top-40 -right-32 opacity-50" />
      <div className="orb orb-2 w-[400px] h-[400px] -bottom-28 -left-20 opacity-45" />

      {/* Back button */}
      <button
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        onClick={() => router.push("/scan")}
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 text-center fade-in-up">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight gradient-text leading-none">
            Eternia
          </h1>
          <p className="text-muted-foreground mt-3 text-sm font-medium">
            Create your safe space
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass w-full rounded-2xl p-8 shadow-2xl gradient-border fade-in-up fade-in-up-delay-1">
          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.12), rgba(40,200,220,0.08))" }}
            >
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Activate Account</h2>
            <p className="text-sm text-muted-foreground mt-1">Set up your credentials to get started</p>
          </div>

          <div className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Set Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"));
                  if (error) setError(null);
                }}
                className="h-12 bg-background/60 border-border/60 focus:border-primary rounded-xl text-base transition-all duration-200"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground pl-1">Minimum 3 characters, lowercase only</p>
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
                  placeholder="Set new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-12 bg-background/60 border-border/60 focus:border-primary rounded-xl pr-12 text-base transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground pl-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`h-12 bg-background/60 rounded-xl pr-12 text-base transition-all duration-200 ${
                    passwordsMatch
                      ? "border-emerald-400/60 focus:border-emerald-500"
                      : passwordsMismatch
                      ? "border-destructive/60 focus:border-destructive"
                      : "border-border/60 focus:border-primary"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-destructive font-medium pl-1">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-emerald-500 font-medium pl-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="btn-premium w-full h-12 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              After submission, you will be redirected to the Login page
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
