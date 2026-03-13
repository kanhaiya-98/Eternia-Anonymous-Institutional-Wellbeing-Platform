"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart, Shield, Sparkles, AlertCircle } from "lucide-react";
import { validateEterniaCode } from "@/lib/auth";

export default function EnterCodePage() {
  const router = useRouter();
  const [eterniaCode, setEterniaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!eterniaCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const institution = await validateEterniaCode(eterniaCode.trim());

      if (!institution) {
        setError("Invalid Eternia Code. Please check your code and try again.");
        return;
      }

      // Persist the validated institution for the activate step
      sessionStorage.setItem(
        "eternia_institution",
        JSON.stringify(institution),
      );

      router.push("/scan");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-secondary via-background to-muted">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <Heart className="w-16 h-16 text-primary" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-20">
        <Sparkles className="w-20 h-20 text-accent" />
      </div>
      <div className="absolute top-1/3 right-1/4 opacity-10">
        <Shield className="w-24 h-24 text-primary" />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
          Eternia
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          A safe space beyond society&apos;s judgement
        </p>
      </div>

      {/* Enter Code Card */}
      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/90">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-foreground">Welcome</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your Eternia Code to begin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="eternia-code"
              className="text-sm font-medium text-foreground"
            >
              Enter Eternia Code
            </label>
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
              className="h-12 bg-input/50 border-border focus:border-primary focus:ring-primary"
              disabled={isLoading}
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!eterniaCode.trim() || isLoading}
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              "SUBMIT"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 border-border hover:bg-secondary/50 text-foreground"
            onClick={() => router.push("/login")}
            disabled={isLoading}
          >
            Already have an account? Login
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm">
        Your privacy is sacred. All conversations are anonymous and encrypted.
      </p>
    </div>
  );
}
