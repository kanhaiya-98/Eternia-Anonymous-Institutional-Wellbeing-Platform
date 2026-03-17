"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import {
  Bell, ShieldAlert, Clock, Hash, AlertTriangle,
  Radio, CheckCircle2, User,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface Escalation {
  id: string;
  eternia_code: string;
  escalated_by: string;
  escalation_level: string;
  timestamp: string;
  username?: string;
  is_acknowledged?: boolean;
}

export default function SpocDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [acknowledging, setAcknowledging] = useState<Record<string, boolean>>({});

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
    } catch { return ts; }
  };

  const acknowledge = async (esc: Escalation) => {
    setAcknowledging((p) => ({ ...p, [esc.id]: true }));

    // Persist to DB
    await fetch("/api/escalate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: esc.id }),
    });

    // Remove from local list immediately
    setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
    setAcknowledging((p) => { const n = { ...p }; delete n[esc.id]; return n; });
  };

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Load only UNACKNOWLEDGED escalations
    fetch("/api/escalate")
      .then((r) => r.json())
      .then((data) => {
        const unacked = (data.escalations || []).filter(
          (e: Escalation) => !e.is_acknowledged
        );
        setEscalations(unacked.map((e: Escalation) => ({ ...e, id: e.id || String(Math.random()) })));
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
          is_acknowledged: false,
        };
        setEscalations((prev) => [newEsc, ...prev]);
      })
      .subscribe((status) => setIsLive(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, []);

  const pendingCount = escalations.length;

  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[500px] h-[500px] -top-32 -right-32 opacity-20" />
      <div className="orb orb-2 w-[400px] h-[400px] bottom-10 -left-20 opacity-15" />

      <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-sm font-semibold mb-3">
            <ShieldAlert className="w-4 h-4" />SPOC / Grievance Officer
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">SPOC Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor escalated cases in real-time. Acknowledge to remove from queue.
          </p>
        </div>

        {/* Live indicator */}
        <div className={`flex items-center gap-2 mb-8 text-sm font-medium ${isLive ? "text-green-500" : "text-yellow-500"}`}>
          <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "Live — receiving escalations in real-time" : "Connecting to live feed..."}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5">
            <p className="text-3xl font-black text-red-500">{pendingCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Escalations</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5">
            <p className="text-3xl font-black text-green-500">
              {pendingCount === 0 ? "✓ Clear" : "Action Required"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Queue Status</p>
          </div>
        </div>

        {/* Escalation Table */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />Escalation Queue
            </h2>
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                {pendingCount} pending
              </span>
            )}
          </div>

          {escalations.length === 0 ? (
            <div className="py-20 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto mb-4" />
              <p className="text-foreground font-semibold">All clear!</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                No pending escalations. New ones will appear here instantly.
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
                <div key={esc.id}
                  className="grid grid-cols-5 items-center px-6 py-4 bg-red-500/3 animate-in fade-in slide-in-from-top-2 transition-all duration-300">
                  <span className="font-mono font-bold text-primary">{esc.eternia_code}</span>
                  <span className="text-sm text-foreground/80">{esc.username || "Anonymous"}</span>
                  <span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      esc.escalation_level === "Level 3"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : esc.escalation_level === "Level 2"
                        ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    }`}>
                      {esc.escalation_level}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">{formatTime(esc.timestamp)}</span>
                  <button
                    onClick={() => acknowledge(esc)}
                    disabled={acknowledging[esc.id]}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all bg-primary/10 hover:bg-primary/20 border border-primary/20 text-foreground disabled:opacity-50"
                  >
                    {acknowledging[esc.id] ? (
                      <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    )}
                    Acknowledge
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
