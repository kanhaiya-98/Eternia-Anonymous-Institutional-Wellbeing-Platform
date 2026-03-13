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
import { ArrowLeft, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = username.trim().length >= 3 && password.length >= 6;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await signIn(username.trim(), password);

      if (authError) {
        setError(authError);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-secondary via-background to-muted">
      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/")}
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
          Welcome back to your safe space
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/90">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">Login</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Enter Username */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              className="h-12 bg-input/50 border-border focus:border-primary focus:ring-primary"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          {/* Enter Password */}
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
                placeholder="Enter Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                className="h-12 bg-input/50 border-border focus:border-primary focus:ring-primary pr-12"
                disabled={isLoading}
                autoComplete="current-password"
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
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={!isFormValid || isLoading}
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "LOGIN"
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
            onClick={() => router.push("/")}
            disabled={isLoading}
          >
            New here? Register with Eternia Code
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
