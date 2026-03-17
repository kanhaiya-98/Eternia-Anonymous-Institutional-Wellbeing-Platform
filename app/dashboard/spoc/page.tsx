"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import {
  Bell, ShieldAlert, Clock, Hash, AlertTriangle,
  Radio, CheckCircle2, User, Phone,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface Escalation {
  id: string;
  eternia_code: string;
  escalated_by: string;
  escalation_level: string;
  timestamp: string;
  username?: string;
  student_username?: string;
  is_acknowledged?: boolean;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
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
    await fetch("/api/escalate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: esc.id }),
    });
    setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
    setAcknowledging((p) => { const n = { ...p }; delete n[esc.id]; return n; });
  };

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Load only unacknowledged from DB
    fetch("/api/escalate")
      .then((r) => r.json())
      .then((data) => {
        const unacked = (data.escalations || []).filter(
          (e: Escalation) => !e.is_acknowledged
        );
        setEscalations(unacked.map((e: Escalation) => ({
          ...e,
          id: e.id || String(Math.random()),
          username: e.student_username || e.username,
        })));
      })
      .catch(() => {});

    // Live Realtime subscription
    const channel = supabase
      .channel("escalations")
      .on("broadcast", { event: "new_escalation" }, ({ payload }) => {
        setEscalations((prev) => [{
          id: payload.id || String(Date.now()),
          eternia_code: payload.eterniaCode,
          escalated_by: payload.escalatedBy || "Doctor",
          escalation_level: payload.level || "Level 3",
          timestamp: payload.timestamp || new Date().toISOString(),
          username: payload.username,
          is_acknowledged: false,
          emergency_contact_name: payload.emergency_contact_name || null,
          emergency_contact_phone: payload.emergency_contact_phone || null,
          emergency_contact_relation: payload.emergency_contact_relation || null,
        }, ...prev]);
      })
      .subscribe((status) => setIsLive(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
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
            <ShieldAlert className="w-4 h-4" />SPOC / Grievance Officer
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">SPOC Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor escalated cases. Emergency contacts are revealed for each escalation.
          </p>
        </div>

        {/* Live indicator */}
        <div className={`flex items-center gap-2 mb-8 text-sm font-medium ${isLive ? "text-green-500" : "text-yellow-500"}`}>
          <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "Live — receiving escalations in real-time" : "Connecting to live feed..."}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5">
            <p className="text-3xl font-black text-red-500">{escalations.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Escalations</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5">
            <p className={`text-2xl font-black ${escalations.length === 0 ? "text-green-500" : "text-orange-500"}`}>
              {escalations.length === 0 ? "✓ All Clear" : "Action Required"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Queue Status</p>
          </div>
        </div>

        {/* Escalation Cards */}
        {escalations.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl py-20 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto mb-4" />
            <p className="text-foreground font-semibold">All clear!</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              No pending escalations. New ones will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalations.map((esc) => (
              <div
                key={esc.id}
                className="rounded-2xl border border-red-500/20 bg-card/40 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2"
              >
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-red-500/5 border-b border-red-500/10">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      esc.escalation_level === "Level 3"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    }`}>
                      <AlertTriangle className="w-3 h-3 mr-1" />{esc.escalation_level}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatTime(esc.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={() => acknowledge(esc)}
                    disabled={acknowledging[esc.id]}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-600 disabled:opacity-50"
                  >
                    {acknowledging[esc.id] ? (
                      <span className="w-3.5 h-3.5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Acknowledge &amp; Close
                  </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5">
                  {/* Student info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Student Info</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold">@{esc.username || esc.student_username || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-mono font-bold text-primary text-sm">{esc.eternia_code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">Escalated by: {esc.escalated_by}</span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency contact */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-400" />Emergency Contact
                    </p>
                    {esc.emergency_contact_phone ? (
                      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
                        {esc.emergency_contact_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-orange-400 shrink-0" />
                            <span className="text-sm font-semibold">{esc.emergency_contact_name}</span>
                            {esc.emergency_contact_relation && (
                              <span className="text-xs text-muted-foreground">({esc.emergency_contact_relation})</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                          <a
                            href={`tel:${esc.emergency_contact_phone}`}
                            className="text-sm font-bold text-orange-500 hover:underline"
                          >
                            {esc.emergency_contact_phone}
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tap the number to call directly.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
                        No emergency contact saved by student yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
