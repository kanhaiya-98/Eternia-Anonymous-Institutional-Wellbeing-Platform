"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import {
  Users,
  Shield,
  Bell,
  Hash,
  Clock,
  AlertTriangle,
  Radio,
  UserPlus,
  Stethoscope,
  GraduationCap,
  Building2,
  ChevronRight,
  Activity,
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

const DEMO_USERS = [
  { username: "kanhayya", role: "ADMIN", institution: "DEMO2025", status: "Active" },
  { username: "yash_", role: "STUDENT", institution: "DEMO2025", status: "Active" },
  { username: "rahul_k", role: "STUDENT", institution: "DEMO2025", status: "Active" },
  { username: "dr_meera", role: "EXPERT", institution: "DEMO2025", status: "Active" },
  { username: "spoc_raj", role: "SPOC", institution: "DEMO2025", status: "Active" },
];

export default function AdminDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState<"escalations" | "users">("escalations");

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Load existing
    fetch("/api/escalate")
      .then((r) => r.json())
      .then((data) => {
        if (data.escalations?.length) {
          setEscalations(
            data.escalations.map((e: Escalation) => ({ ...e, id: e.id || String(Math.random()) }))
          );
        }
      })
      .catch(() => {});

    // Live subscription
    const channel = supabase
      .channel("escalations")
      .on("broadcast", { event: "new_escalation" }, ({ payload }) => {
        setEscalations((prev) => [
          {
            id: String(Date.now()),
            eternia_code: payload.eterniaCode,
            escalated_by: payload.escalatedBy || "Doctor",
            escalation_level: payload.level || "Level 3",
            timestamp: payload.timestamp || new Date().toISOString(),
            username: payload.username,
          },
          ...prev,
        ]);
      })
      .subscribe((status) => setIsLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    STUDENT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    EXPERT: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    SPOC: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    INTERN: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[600px] h-[600px] -top-40 -right-40 opacity-20" />
      <div className="orb orb-2 w-[500px] h-[500px] bottom-0 -left-20 opacity-10" />

      <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-500 text-sm font-semibold mb-3">
            <Shield className="w-4 h-4" />
            System Administrator
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Full platform control — manage users, monitor escalations, oversee all dashboards.
          </p>
        </div>

        {/* Live indicator */}
        <div
          className={`flex items-center gap-2 mb-8 text-sm font-medium ${
            isLive ? "text-green-500" : "text-yellow-500"
          }`}
        >
          <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "Live stream active — all escalations visible" : "Connecting..."}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <Users className="w-5 h-5" />, label: "Total Users", value: DEMO_USERS.length, color: "text-blue-500" },
            { icon: <AlertTriangle className="w-5 h-5" />, label: "Escalations", value: escalations.length, color: "text-red-500" },
            { icon: <Stethoscope className="w-5 h-5" />, label: "Doctors", value: 1, color: "text-teal-500" },
            { icon: <Activity className="w-5 h-5" />, label: "Active Sessions", value: 2, color: "text-green-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5"
            >
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
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/40 border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === "escalations" && escalations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
                  {escalations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Escalations Tab */}
        {activeTab === "escalations" && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-400" />
                All Escalation Events
              </h2>
            </div>

            {escalations.length === 0 ? (
              <div className="py-20 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No escalations yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Go to Doctor Dashboard and click &quot;Escalate Case&quot; to see live updates
                </p>
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
                  <div
                    key={esc.id}
                    className="grid grid-cols-5 items-center px-6 py-4 hover:bg-muted/10 transition-colors animate-in fade-in slide-in-from-top-1"
                  >
                    <span className="font-mono font-bold text-primary">{esc.eternia_code}</span>
                    <span className="text-sm">{esc.username || "Anonymous"}</span>
                    <span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                        esc.escalation_level === "Level 3"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      }`}>
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
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Registered Users
              </h2>
              <button className="flex items-center gap-1.5 text-sm font-semibold text-primary px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {/* Role management quick links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border/40 bg-muted/10">
              {[
                { icon: <GraduationCap className="w-4 h-4" />, label: "Manage Students", count: 2 },
                { icon: <Stethoscope className="w-4 h-4" />, label: "Manage Doctors", count: 1 },
                { icon: <Building2 className="w-4 h-4" />, label: "Manage SPOCs", count: 1 },
                { icon: <Users className="w-4 h-4" />, label: "Manage Interns", count: 0 },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <span className="text-xs font-bold text-primary">{item.count}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </button>
              ))}
            </div>

            <div className="divide-y divide-border/30">
              <div className="grid grid-cols-4 px-6 py-3 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Username</span>
                <span>Role</span>
                <span>Institution</span>
                <span>Status</span>
              </div>
              {DEMO_USERS.map((user) => (
                <div
                  key={user.username}
                  className="grid grid-cols-4 items-center px-6 py-4 hover:bg-muted/10 transition-colors"
                >
                  <span className="font-medium font-mono">@{user.username}</span>
                  <span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[user.role] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                      {user.role}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">{user.institution}</span>
                  <span className="flex items-center gap-1.5 text-sm text-green-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
