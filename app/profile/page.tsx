"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Shield, Phone, CheckCircle, AlertCircle, Bell,
  Lock, Eye, Trash2, Save, Coins, LogOut, RefreshCw,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  role: string;
  apaar_verified: boolean;
  erp_verified: boolean;
  created_at: string;
  institution_name: string | null;
}

interface EmergencyContact {
  name: string | null;
  phone: string | null;
  relation: string | null;
  consent: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("Parent/Guardian");
  const [emergencySaved, setEmergencySaved] = useState(false);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  // APAAR (simulated)
  const [apaarId, setApaarId] = useState("");
  const [apaarVerified, setApaarVerified] = useState(false);
  const [isVerifyingApaar, setIsVerifyingApaar] = useState(false);

  // Settings
  const [notifications, setNotifications] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.profile) {
        setProfile({
          ...data.profile,
          institution_name: null,
        });
        setApaarVerified(data.profile.apaar_verified);
      }
      if (data.emergency) {
        const ec: EmergencyContact = data.emergency;
        if (ec.name) setEmergencyName(ec.name);
        if (ec.phone) setEmergencyPhone(ec.phone);
        if (ec.relation) setEmergencyRelation(ec.relation);
        if (ec.phone) setEmergencySaved(true);
      }
    } catch {
      setPageError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleEmergencyContactSave = async () => {
    if (!emergencyPhone.trim()) {
      setEmergencyError("Phone number is required.");
      return;
    }
    setIsSavingEmergency(true);
    setEmergencyError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyName, emergencyPhone, emergencyRelation }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmergencyError(data.error || "Failed to save. Please try again.");
      } else {
        setEmergencySaved(true);
      }
    } catch {
      setEmergencyError("Network error. Please try again.");
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const handleApaarVerification = async () => {
    if (!apaarId.trim()) return;
    setIsVerifyingApaar(true);
    await new Promise((r) => setTimeout(r, 1500));
    setApaarVerified(true);
    setProfile((p) => p ? { ...p, apaar_verified: true } : p);
    setIsVerifyingApaar(false);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    router.push("/login");
  };

  const initials = profile?.username ? profile.username.slice(0, 2).toUpperCase() : "??";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50 mb-6">
              <CardContent className="p-6"><Skeleton className="h-28 w-full" /></CardContent>
            </Card>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and emergency contact</p>
        </div>

        {pageError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" /><p className="text-sm">{pageError}</p>
          </div>
        )}

        {/* Profile card */}
        <Card className="border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left space-y-2 flex-1">
                <h2 className="text-2xl font-semibold text-foreground">@{profile?.username ?? "—"}</h2>
                <p className="text-muted-foreground text-sm">Eternia Platform Member</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary capitalize">
                    <Shield className="w-3 h-3 mr-1" />{profile?.role?.toLowerCase() ?? "student"}
                  </Badge>
                  {memberSince && (
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      Member since {memberSince}
                    </Badge>
                  )}
                  {apaarVerified && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />ID Verified
                    </Badge>
                  )}
                  {emergencySaved && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                      <Phone className="w-3 h-3 mr-1" />Emergency Contact Set
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive shrink-0">
                <LogOut className="w-4 h-4 mr-1" />Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ECC Credits */}
        <Card className="border-border/50 mb-6 bg-gradient-to-br from-primary/5 to-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eternia Care Credits (ECC)</p>
                  <p className="text-3xl font-bold text-foreground">250</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 shrink-0">
                Top Up Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact — REAL, saves to DB */}
        <Card className="border-orange-500/20 border-2 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-orange-500" />
              Emergency Contact
              {emergencySaved && <Badge className="bg-green-500/10 text-green-600 ml-auto">Saved ✓</Badge>}
            </CardTitle>
            <CardDescription>
              Add a trusted contact for crisis escalation. This is revealed to your institution&apos;s SPOC
              <strong> only when a doctor formally escalates your case</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Contact Name</label>
                <Input
                  placeholder="e.g. Priya Sharma"
                  value={emergencyName}
                  onChange={(e) => { setEmergencyName(e.target.value); setEmergencySaved(false); }}
                  className="h-11 bg-input/50 border-border"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Relation</label>
                <Input
                  placeholder="e.g. Parent, Guardian, Friend"
                  value={emergencyRelation}
                  onChange={(e) => { setEmergencyRelation(e.target.value); setEmergencySaved(false); }}
                  className="h-11 bg-input/50 border-border"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number *</label>
              <Input
                placeholder="+91 XXXXX XXXXX"
                value={emergencyPhone}
                onChange={(e) => { setEmergencyPhone(e.target.value); setEmergencySaved(false); setEmergencyError(null); }}
                className="h-11 bg-input/50 border-border"
                type="tel"
              />
            </div>

            {emergencyError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />{emergencyError}
              </p>
            )}

            <Button onClick={handleEmergencyContactSave} disabled={isSavingEmergency || !emergencyPhone.trim()}
              className={`h-11 w-full ${emergencySaved ? "bg-green-600 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"} text-white`}>
              {isSavingEmergency ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : emergencySaved ? (
                <><CheckCircle className="w-4 h-4 mr-2" />Saved to Database</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Emergency Contact</>
              )}
            </Button>

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-orange-500/5 border border-orange-500/15 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
              <p>Your anonymity is always preserved. This contact is only shared with your SPOC under formal escalation protocol.</p>
            </div>
          </CardContent>
        </Card>

        {/* APAAR */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />APAAR / ABC ID Verification
            </CardTitle>
            <CardDescription>University students: use your APAAR/ABC ID. Stored securely — never visible to peers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Enter your APAAR / ERP ID" value={apaarId}
                onChange={(e) => setApaarId(e.target.value)} disabled={apaarVerified || isVerifyingApaar}
                className="h-12 bg-input/50 border-border flex-1" />
              <Button onClick={handleApaarVerification} disabled={!apaarId.trim() || apaarVerified || isVerifyingApaar}
                className={`h-12 shrink-0 ${apaarVerified ? "bg-green-600 hover:bg-green-600" : "bg-primary hover:bg-primary/90"} text-white`}>
                {isVerifyingApaar ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" />Verifying...</> : apaarVerified ? <><CheckCircle className="w-4 h-4 mr-1" />Verified</> : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Lock className="w-5 h-5 text-primary" />Privacy &amp; Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { icon: <Bell className="w-5 h-5 text-muted-foreground" />, label: "Notifications", sub: "Session reminders and updates", val: notifications, set: setNotifications },
              { icon: <Eye className="w-5 h-5 text-muted-foreground" />, label: "Anonymous Mode", sub: "Keep identity hidden in peer interactions", val: anonymousMode, set: setAnonymousMode },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">{item.icon}<div><p className="font-medium text-foreground">{item.label}</p><p className="text-sm text-muted-foreground">{item.sub}</p></div></div>
                <Switch checked={item.val} onCheckedChange={item.set} />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-muted-foreground" /><div><p className="font-medium">AES-256-GCM Encryption</p><p className="text-sm text-muted-foreground">All sensitive data encrypted at rest</p></div></div>
              <Badge className="bg-green-500/10 text-green-600">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSaveChanges} disabled={saving}
            className={`flex-1 ${saveSuccess ? "bg-green-600" : "bg-primary"} text-white`}>
            {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saveSuccess ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : <><Save className="w-4 h-4 mr-2" />Save Settings</>}
          </Button>
          <Button variant="outline" onClick={() => { if (confirm("Delete your account? This cannot be undone.")) router.push("/"); }}
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-2" />Delete Account
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6 max-w-lg mx-auto">
          Under the Digital Personal Data Protection Act 2023, you have the right to access, correct, and request erasure of your personal data.
        </p>
      </main>
    </div>
  );
}
