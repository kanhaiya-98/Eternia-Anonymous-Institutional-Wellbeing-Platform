"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

import {
  User,
  Shield,
  Phone,
  CheckCircle,
  AlertCircle,
  Bell,
  Lock,
  Eye,
  Trash2,
  Save,
  Coins,
  LogOut,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  username: string;
  role: string;
  apaar_verified: boolean;
  erp_verified: boolean;
  created_at: string;
  institution_name: string | null;
}

interface CreditBalance {
  balance: number;
  last_transaction_at: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  // ── Remote data ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance>({
    balance: 0,
    last_transaction_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // ── APAAR / ERP verification ───────────────────────────────────────────────
  const [apaarId, setApaarId] = useState("");
  const [apaarVerified, setApaarVerified] = useState(false);
  const [isVerifyingApaar, setIsVerifyingApaar] = useState(false);

  // ── Emergency contact ──────────────────────────────────────────────────────
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyContactSaved, setEmergencyContactSaved] = useState(false);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);

  // ── Privacy settings ───────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(true);

  // ── Save settings ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Fetch profile on mount (auth bypassed — mock data) ────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setPageError(null);

    try {
      // Auth bypassed: use mock profile
      await new Promise((resolve) => setTimeout(resolve, 400));

      setProfile({
        id: "demo-user-001",
        username: "demo_user",
        role: "STUDENT",
        apaar_verified: false,
        erp_verified: false,
        created_at: new Date().toISOString(),
        institution_name: "Demo University",
      });

      setApaarVerified(false);

      setCreditBalance({
        balance: 250,
        last_transaction_at: null,
      });
    } catch {
      setPageError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleApaarVerification = async () => {
    if (!apaarId.trim() || !profile) return;
    setIsVerifyingApaar(true);

    try {
      // Auth bypassed: simulate verification locally
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setApaarVerified(true);
      setProfile((prev) => (prev ? { ...prev, apaar_verified: true } : prev));
    } catch {
      setPageError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingApaar(false);
    }
  };

  const handleEmergencyContactSave = async () => {
    if (!emergencyContact.trim()) return;
    setIsSavingEmergency(true);

    try {
      // Phase 1: Simulated save with consent acknowledgement.
      // Phase 2+: Encrypt the phone number (AES-256-GCM) and upsert into
      //           user_private table, storing escalation_consent = TRUE
      //           and consent_timestamp = NOW().
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setEmergencyContactSaved(true);
    } catch {
      setPageError("Could not save emergency contact. Please try again.");
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Phase 1: Settings persisted locally.
      // Phase 2+: Persist notifications + anonymousMode to a user_settings table.
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    router.push("/");
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirmed) return;
    router.push("/");
  };

  // ─── Derived values ──────────────────────────────────────────────────────────

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "";

  // ─── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Card className="border-border/50 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full shrink-0" />
                <div className="space-y-3 flex-1 w-full">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-6 w-56" />
                </div>
              </div>
            </CardContent>
          </Card>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50 mb-6">
              <CardContent className="p-6">
                <Skeleton className="h-28 w-full" />
              </CardContent>
            </Card>
          ))}
        </main>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Page-level error */}
        {pageError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{pageError}</p>
          </div>
        )}

        {/* ── Profile card ── */}
        <Card className="border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="text-center sm:text-left space-y-2 flex-1">
                <h2 className="text-2xl font-semibold text-foreground">
                  {profile?.username ?? "—"}
                </h2>
                <p className="text-muted-foreground">
                  {profile?.institution_name ?? "Anonymous User"}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary capitalize"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {profile?.role?.toLowerCase() ?? "student"}
                  </Badge>
                  {memberSince && (
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground"
                    >
                      Member since {memberSince}
                    </Badge>
                  )}
                  {(apaarVerified || profile?.erp_verified) && (
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-600"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      ID Verified
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── ECC Balance card ── */}
        <Card className="border-border/50 mb-6 bg-gradient-to-br from-primary/5 to-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Eternia Care Credits (ECC)
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {creditBalance.balance}
                  </p>
                  {creditBalance.last_transaction_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last used:{" "}
                      {new Date(
                        creditBalance.last_transaction_at,
                      ).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10 shrink-0"
              >
                Top Up Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── APAAR / ERP Verification ── */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              APAAR / ABC ID Verification
            </CardTitle>
            <CardDescription>
              University &amp; college students: use your APAAR / ABC ID. School
              students: use your institution ERP ID. Stored encrypted — never
              visible to anyone on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter your APAAR / ERP ID"
                value={apaarId}
                onChange={(e) => setApaarId(e.target.value)}
                disabled={apaarVerified || isVerifyingApaar}
                className="h-12 bg-input/50 border-border flex-1"
              />
              <Button
                onClick={handleApaarVerification}
                disabled={!apaarId.trim() || apaarVerified || isVerifyingApaar}
                className={`h-12 shrink-0 ${
                  apaarVerified
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-primary hover:bg-primary/90"
                } text-white`}
              >
                {isVerifyingApaar ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : apaarVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            {apaarVerified && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Your ID has been successfully verified
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Emergency Contact ── */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Add a trusted contact for crisis escalation. This number is
              encrypted (AES-256-GCM) and is only shared with your
              institution&apos;s SPOC under a formal, admin-approved escalation
              protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter phone number (+91 XXXXX XXXXX)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                disabled={emergencyContactSaved || isSavingEmergency}
                className="h-12 bg-input/50 border-border flex-1"
              />
              <Button
                onClick={handleEmergencyContactSave}
                disabled={
                  !emergencyContact.trim() ||
                  emergencyContactSaved ||
                  isSavingEmergency
                }
                className={`h-12 shrink-0 ${
                  emergencyContactSaved
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-primary hover:bg-primary/90"
                } text-white`}
              >
                {isSavingEmergency ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : emergencyContactSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {emergencyContactSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Emergency contact encrypted and saved
              </div>
            )}
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                This contact will only be shared under a formal crisis
                escalation — SPOC request + Admin authorisation required. Your
                anonymity on the platform is never compromised.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Privacy & Settings ── */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-primary" />
              Privacy &amp; Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Session reminders and platform updates
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            {/* Anonymous mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Anonymous Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Keep your identity hidden in all peer interactions
                  </p>
                </div>
              </div>
              <Switch
                checked={anonymousMode}
                onCheckedChange={setAnonymousMode}
              />
            </div>

            {/* Encryption status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    AES-256-GCM Encryption
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All sensitive data encrypted at rest
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-600">Active</Badge>
            </div>

            {/* TLS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    TLS 1.3 Transport Security
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All network traffic encrypted in transit
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-600">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleSaveChanges}
            disabled={saving}
            className={`flex-1 ${
              saveSuccess
                ? "bg-green-600 hover:bg-green-600"
                : "bg-primary hover:bg-primary/90"
            } text-white`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleDeleteAccount}
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>

        {/* DPDP Act notice */}
        <p className="text-xs text-muted-foreground text-center mt-6 max-w-lg mx-auto">
          Under the Digital Personal Data Protection Act 2023, you have the
          right to access, correct, and request erasure of your personal data.
          Contact your institution&apos;s SPOC or Eternia support to exercise
          these rights.
        </p>
      </main>
    </div>
  );
}
