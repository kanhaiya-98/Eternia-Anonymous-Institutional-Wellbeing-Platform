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
import { ArrowLeft, AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import { signUp } from "@/lib/auth";
import { generateDeviceFingerprint } from "@/lib/device";

export default function ActivateAccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword && password.length >= 6;
  const isFormValid = username.trim().length >= 3 && passwordsMatch;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Retrieve the institution saved during the code-entry step
      const raw = sessionStorage.getItem("eternia_institution");
      if (!raw) {
        // Institution missing — restart onboarding
        router.push("/");
        return;
      }

      const institution = JSON.parse(raw) as { id: string; name: string };

      const deviceFingerprint = generateDeviceFingerprint();

      const { error: signUpError } = await signUp({
        username: username.trim(),
        password,
        institutionId: institution.id,
        deviceFingerprint,
      });

      if (signUpError) {
        setError(signUpError);
        return;
      }

      // Clean up — institution no longer needed after successful signup
      sessionStorage.removeItem("eternia_institution");

      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-secondary via-background to-muted">
      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/scan")}
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
          Eternia
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Create your safe space
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/90">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            Activate Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up your credentials to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Global error banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Set Username */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
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
              className="h-12 bg-input/50 border-border focus:border-primary focus:ring-primary"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Set new username (minimum 3 characters)
            </p>
          </div>

          {/* Set Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
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
                className="h-12 bg-input/50 border-border focus:border-primary focus:ring-primary pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Set new password (minimum 6 characters)
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-foreground"
            >
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
                className="h-12 bg-input/50 border-border focus:border-primary focus:ring-primary pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : (
              "SUBMIT"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            After submission, you will be redirected to the Login page
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
