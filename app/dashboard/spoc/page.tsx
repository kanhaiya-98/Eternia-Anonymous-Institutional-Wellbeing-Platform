"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import {
  Bell,
  ShieldAlert,
  Clock,
  Hash,
  AlertTriangle,
  Radio,
  CheckCircle2,
  User,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface Escalation {
  id: string;
  eternia_code: string;
  escalated_by: string;
  escalation_level: string;
  timestamp: string;
  username?: string;
  acknowledged?: boolean;
}

export default function SpocDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  // Format timestamp
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

    // Load existing escalations from API
    fetch("/api/escalate")
      .then((r) => r.json())
      .then((data) => {
        if (data.escalations?.length) {
          setEscalations(
            data.escalations.map((e: Escalation) => ({
              ...e,
              id: e.id || String(Math.random()),
            }))
          );
        }
      })
      .catch(() => {});

    // Subscribe to live Realtime broadcasts
    const channel = supabase
      .channel("escalations")
      .on("broadcast", { event: "new_escalation" }, ({ payload }) => {
        const newEsc: Escalation = {
          id: String(Date.now()),
          eternia_code: payload.eterniaCode,
          escalated_by: payload.escalatedBy || "Doctor",
          escalation_level: payload.level || "Level 3",
          timestamp: payload.timestamp || new Date().toISOString(),
          username: payload.username,
        };
        setEscalations((prev) => [newEsc, ...prev]);
      })
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[500px] h-[500px] -top-32 -right-32 opacity-20" />
      <div className="orb orb-2 w-[400px] h-[400px] bottom-10 -left-20 opacity-15" />

      <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-sm font-semibold mb-3">
            <ShieldAlert className="w-4 h-4" />
            SPOC / Grievance Officer
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">SPOC Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor escalated cases in real-time. Identify students via Eternia Code.
          </p>
        </div>

        {/* Live indicator */}
        <div
          className={`flex items-center gap-2 mb-8 text-sm font-medium ${
            isLive ? "text-green-500" : "text-yellow-500"
          }`}
        >
          <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "Live — receiving escalations in real-time" : "Connecting to live feed..."}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Escalations", value: escalations.length, color: "text-red-500" },
            {
              label: "Pending Review",
              value: escalations.filter((e) => !acknowledged[e.id]).length,
              color: "text-orange-500",
            },
            {
              label: "Acknowledged",
              value: Object.values(acknowledged).filter(Boolean).length,
              color: "text-green-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5"
            >
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Escalation Table */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />
              Escalation Notifications
            </h2>
            {escalations.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                {escalations.filter((e) => !acknowledged[e.id]).length} new
              </span>
            )}
          </div>

          {escalations.length === 0 ? (
            <div className="py-20 text-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No escalations yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                New escalations from doctors will appear here instantly
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {/* Column headers */}
              <div className="grid grid-cols-5 px-6 py-3 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Eternia Code</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" />Student</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Level</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Time</span>
                <span>Action</span>
              </div>

              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className={`grid grid-cols-5 items-center px-6 py-4 transition-all duration-300 ${
                    acknowledged[esc.id]
                      ? "opacity-60 bg-transparent"
                      : "bg-red-500/3 animate-in fade-in slide-in-from-top-2"
                  }`}
                >
                  <span className="font-mono font-bold text-primary">
                    {esc.eternia_code}
                  </span>
                  <span className="text-sm text-foreground/80">
                    {esc.username || "Anonymous"}
                  </span>
                  <span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        esc.escalation_level === "Level 3"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : esc.escalation_level === "Level 2"
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      }`}
                    >
                      {esc.escalation_level || "L3"}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatTime(esc.timestamp)}
                  </span>
                  <button
                    onClick={() => setAcknowledged((p) => ({ ...p, [esc.id]: true }))}
                    disabled={acknowledged[esc.id]}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      acknowledged[esc.id]
                        ? "text-green-500 bg-green-500/10"
                        : "text-foreground bg-primary/10 hover:bg-primary/20 border border-primary/20"
                    }`}
                  >
                    {acknowledged[esc.id] ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" />Acknowledged</>
                    ) : (
                      "Acknowledge"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
