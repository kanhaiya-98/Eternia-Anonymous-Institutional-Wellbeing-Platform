"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import {
  Users, Shield, Bell, Hash, Clock, AlertTriangle, Radio,
  UserPlus, Stethoscope, GraduationCap, Building2, Activity,
  X, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface Escalation {
  id: string;
  eternia_code: string;
  escalated_by: string;
  escalation_level: string;
  timestamp: string;
  username?: string;
}

interface DBUser {
  id: string;
  username: string;
  role: string;
  institution_id: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLES = ["EXPERT", "INTERN", "SPOC", "ADMIN"];

const roleColors: Record<string, string> = {
  ADMIN:   "bg-purple-500/10 text-purple-500 border-purple-500/20",
  STUDENT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  EXPERT:  "bg-teal-500/10 text-teal-500 border-teal-500/20",
  SPOC:    "bg-orange-500/10 text-orange-500 border-orange-500/20",
  INTERN:  "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export default function AdminDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState<"escalations" | "users">("escalations");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Add User modal state
  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("EXPERT");
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return ts; }
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* silent */ }
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    loadUsers();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    fetch("/api/escalate")
      .then((r) => r.json())
      .then((data) => {
        if (data.escalations?.length) {
          setEscalations(data.escalations.map((e: Escalation) => ({ ...e, id: e.id || String(Math.random()) })));
        }
      })
      .catch(() => {});

    const channel = supabase
      .channel("escalations")
      .on("broadcast", { event: "new_escalation" }, ({ payload }) => {
        setEscalations((prev) => [{
          id: String(Date.now()),
          eternia_code: payload.eterniaCode,
          escalated_by: payload.escalatedBy || "Doctor",
          escalation_level: payload.level || "Level 3",
          timestamp: payload.timestamp || new Date().toISOString(),
          username: payload.username,
        }, ...prev]);
      })
      .subscribe((status) => setIsLive(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [loadUsers]);

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setCreateError("Username and password are required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user.");
      } else {
        setCreateSuccess(true);
        setNewUsername(""); setNewPassword(""); setNewRole("STUDENT");
        await loadUsers();
        setTimeout(() => { setCreateSuccess(false); setShowModal(false); }, 1500);
      }
    } catch { setCreateError("Network error."); }
    setCreating(false);
  };

  const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter((u) => u.role === r).length }), {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[600px] h-[600px] -top-40 -right-40 opacity-20" />
      <div className="orb orb-2 w-[500px] h-[500px] bottom-0 -left-20 opacity-10" />

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-primary/20 relative">
            <button onClick={() => { setShowModal(false); setCreateError(null); setCreateSuccess(false); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black gradient-text mb-1">Add New User</h2>
            <p className="text-sm text-muted-foreground mb-6">Create an account and assign a role instantly.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                  placeholder="e.g. dr_sharma"
                  className="w-full h-11 px-4 rounded-xl bg-background/60 border border-border/60 focus:border-primary focus:outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-11 px-4 pr-11 rounded-xl bg-background/60 border border-border/60 focus:border-primary focus:outline-none text-sm transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Assign Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button key={r} type="button" onClick={() => setNewRole(r)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        newRole === r ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-primary/40"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive font-medium">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-500 font-medium">
                  ✓ User created successfully!
                </div>
              )}

              <button onClick={handleCreateUser} disabled={creating || createSuccess}
                className="btn-premium w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                ) : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-500 text-sm font-semibold mb-3">
              <Shield className="w-4 h-4" />System Administrator
            </div>
            <h1 className="text-4xl md:text-5xl font-black gradient-text">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Full platform control — manage users, monitor escalations.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="btn-premium flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white mt-2">
            <UserPlus className="w-4 h-4" />Add User
          </button>
        </div>

        {/* Live indicator */}
        <div className={`flex items-center gap-2 mb-8 text-sm font-medium ${isLive ? "text-green-500" : "text-yellow-500"}`}>
          <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "Live stream active — all escalations visible" : "Connecting..."}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <Users className="w-5 h-5" />, label: "Total Users", value: users.length, color: "text-blue-500" },
            { icon: <AlertTriangle className="w-5 h-5" />, label: "Escalations", value: escalations.length, color: "text-red-500" },
            { icon: <Stethoscope className="w-5 h-5" />, label: "Experts", value: roleCounts.EXPERT || 0, color: "text-teal-500" },
            { icon: <Activity className="w-5 h-5" />, label: "Students", value: roleCounts.STUDENT || 0, color: "text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5">
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "escalations", label: "Escalations", icon: <Bell className="w-4 h-4" /> },
            { key: "users", label: "User Management", icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-card/40 border border-border/50 text-muted-foreground hover:text-foreground"
              }`}>
              {tab.icon}{tab.label}
              {tab.key === "escalations" && escalations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">{escalations.length}</span>
              )}
              {tab.key === "users" && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs">{users.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Escalations Tab */}
        {activeTab === "escalations" && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-red-400" />All Escalation Events</h2>
            </div>
            {escalations.length === 0 ? (
              <div className="py-20 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No escalations yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Go to Doctor Dashboard → Escalate Case</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                <div className="grid grid-cols-5 px-6 py-3 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Eternia Code</span>
                  <span>Student</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Level</span>
                  <span>Escalated By</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Time</span>
                </div>
                {escalations.map((esc) => (
                  <div key={esc.id} className="grid grid-cols-5 items-center px-6 py-4 hover:bg-muted/10 transition-colors animate-in fade-in slide-in-from-top-1">
                    <span className="font-mono font-bold text-primary">{esc.eternia_code}</span>
                    <span className="text-sm">{esc.username || "Anonymous"}</span>
                    <span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${esc.escalation_level === "Level 3" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"}`}>
                        {esc.escalation_level}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">{esc.escalated_by}</span>
                    <span className="text-sm text-muted-foreground font-mono">{formatTime(esc.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Registered Users (Live from Supabase)</h2>
              <button onClick={loadUsers} disabled={loadingUsers}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />Refresh
              </button>
            </div>

            {/* Role quick-stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 border-b border-border/40 bg-muted/10">
              {[
                { icon: <GraduationCap className="w-4 h-4" />, role: "STUDENT" },
                { icon: <Stethoscope className="w-4 h-4" />, role: "EXPERT" },
                { icon: <Building2 className="w-4 h-4" />, role: "SPOC" },
                { icon: <Users className="w-4 h-4" />, role: "INTERN" },
                { icon: <Shield className="w-4 h-4" />, role: "ADMIN" },
              ].map((item) => (
                <div key={item.role} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-card/60 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">{item.icon}<span className="font-medium">{item.role}</span></span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${roleColors[item.role]}`}>{roleCounts[item.role] || 0}</span>
                </div>
              ))}
            </div>

            {loadingUsers ? (
              <div className="py-16 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />Loading users from Supabase...
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No users yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Click &quot;Add User&quot; to create the first account</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                <div className="grid grid-cols-4 px-6 py-3 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Username</span><span>Role</span><span>Created</span><span>Status</span>
                </div>
                {users.map((user) => (
                  <div key={user.id} className="grid grid-cols-4 items-center px-6 py-3.5 hover:bg-muted/10 transition-colors">
                    <span className="font-medium font-mono text-sm">@{user.username}</span>
                    <span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[user.role] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {user.role}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${user.is_active ? "text-green-500" : "text-muted-foreground"}`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
