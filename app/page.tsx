"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Shield, Sparkles, ArrowRight, Lock } from "lucide-react";

export default function EnterCodePage() {
  const router = useRouter();
  const [eterniaCode, setEterniaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!eterniaCode.trim()) return;

    // Auth bypassed — accept any code and proceed
    sessionStorage.setItem(
      "eternia_institution",
      JSON.stringify({ id: "demo-institution", name: "Demo University" }),
    );

    router.push("/scan");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background noise-bg">
      {/* Animated gradient orbs */}
      <div className="orb orb-1 w-[600px] h-[600px] -top-32 -left-48 opacity-60" />
      <div className="orb orb-2 w-[500px] h-[500px] -bottom-20 -right-32 opacity-50" />
      <div className="orb orb-3 w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo + tagline */}
        <div className="mb-10 text-center fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 pulse-ring"
            style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight gradient-text leading-none">
            Eternia
          </h1>
          <p className="text-muted-foreground mt-3 text-sm md:text-base font-medium">
            A safe space beyond society&apos;s judgement
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass w-full rounded-2xl p-8 shadow-2xl gradient-border fade-in-up fade-in-up-delay-1">
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your Eternia Code to begin</p>
          </div>

          <div className="space-y-5">
            {/* Code Input */}
            <div className="space-y-2">
              <label htmlFor="eternia-code" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Eternia Code
              </label>
              <div className="relative">
                <Input
                  id="eternia-code"
                  type="text"
                  placeholder="Enter your unique code"
                  value={eterniaCode}
                  onChange={(e) => {
                    setEterniaCode(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-13 bg-background/60 border-border/60 focus:border-primary focus:ring-primary rounded-xl pl-4 pr-4 text-base transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!eterniaCode.trim() || isLoading}
              className="btn-premium w-full h-13 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  Let me in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-3 text-muted-foreground font-medium">or</span>
              </div>
            </div>

            {/* Login Button */}
            <Button
              variant="outline"
              className="w-full h-12 border-border/60 hover:border-primary/50 hover:bg-primary/5 text-foreground rounded-xl font-medium transition-all duration-200"
              onClick={() => router.push("/login")}
              disabled={isLoading}
            >
              Already have an account? Login
            </Button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-8 fade-in-up fade-in-up-delay-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <span>100% anonymous</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center max-w-xs fade-in-up fade-in-up-delay-3">
          Your privacy is sacred. All conversations are anonymous and encrypted.
        </p>
      </div>
    </div>
  );
}
