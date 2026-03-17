"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import {
  AlertTriangle, Activity, User, Hash, Clock,
  CheckCircle2, Loader2, Stethoscope, Radio, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

interface StudentSession {
  id: string;           // user id
  username: string;
  eterniaCode: string;  // will be ETR-{6 digits from user id}
  status: string;
  level: string;
}

export default function DoctorDashboard() {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscalating] = useState<Record<string, boolean>>({});
  const [escalated, setEscalated] = useState<Record<string, boolean>>({});

  // Derive a deterministic ETR code from user UUID (for display)
  const toEtrCode = (id: string) =>
    "ETR-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      const students: StudentSession[] = (data.users || [])
        .filter((u: { role: string }) => u.role === "STUDENT" || u.role === "USER")
        .map((u: { id: string; username: string }) => ({
          id: u.id,
          username: u.username,
          eterniaCode: toEtrCode(u.id),
          status: "Active",
          level: "Level 3",
        }));
      setSessions(students);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadSessions(); }, []);

  const handleEscalate = async (session: StudentSession) => {
    setEscalating((p) => ({ ...p, [session.id]: true }));

    await fetch("/api/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eterniaCode: session.eterniaCode,
        escalatedBy: "Doctor",
        level: session.level,
        sessionInfo: `Student: ${session.username}`,
      }),
    });

    // Broadcast via Supabase Realtime
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const channel = supabase.channel("escalations");
    await channel.send({
      type: "broadcast",
      event: "new_escalation",
      payload: {
        eterniaCode: session.eterniaCode,
        escalatedBy: "Doctor",
        level: session.level,
        username: session.username,
        timestamp: new Date().toISOString(),
      },
    });
    supabase.removeChannel(channel);

    setEscalating((p) => ({ ...p, [session.id]: false }));
    setEscalated((p) => ({ ...p, [session.id]: true }));
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[600px] h-[600px] -top-32 -right-32 opacity-20" />
      <div className="orb orb-2 w-[400px] h-[400px] bottom-10 -left-20 opacity-15" />

      <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold mb-3">
              <Stethoscope className="w-4 h-4" />Doctor Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-black gradient-text">Expert Dashboard</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Real student sessions from Supabase. Trigger escalation to notify SPOC &amp; Admin instantly.
            </p>
          </div>
          <button onClick={loadSessions} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 mt-2 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 mb-8 text-sm text-green-500 font-medium">
          <Radio className="w-4 h-4 animate-pulse" />
          Live — escalation broadcasts to SPOC &amp; Admin in real-time
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />Loading sessions from Supabase...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No active student sessions</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Students will appear here when they are registered in the system
            </p>
          </div>
        ) : (
          <div className="grid gap-5 max-w-4xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Student Sessions ({sessions.length})
            </h2>

            {sessions.map((session) => (
              <div key={session.id}
                className={`rounded-2xl border bg-card/40 backdrop-blur-xl p-7 relative overflow-hidden transition-all duration-300 ${
                  escalated[session.id] ? "border-red-500/40 bg-red-500/5" : "border-border/50 hover:border-primary/30"
                }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-7">
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><User className="w-3 h-3" />Student</label>
                      <p className="text-lg font-black">@{session.username}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Hash className="w-3 h-3" />Eternia Code</label>
                      <p className="font-mono font-bold text-primary">{session.eterniaCode}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Activity className="w-3 h-3" />Status</label>
                      {escalated[session.id] ? (
                        <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Escalated
                        </span>
                      ) : (
                        <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />{session.status}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Clock className="w-3 h-3" />Risk Level</label>
                      <p className="font-semibold text-orange-400">{session.level}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-border/40">
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Only escalate if you assess immediate risk to the student&apos;s well-being.
                    </p>
                    <Button onClick={() => handleEscalate(session)}
                      disabled={escalating[session.id] || escalated[session.id]}
                      className={`font-bold rounded-xl min-w-[180px] transition-all duration-300 ${
                        escalated[session.id]
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
                      }`}>
                      {escalating[session.id] ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Escalating...</>
                      ) : escalated[session.id] ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Escalated ✓</>
                      ) : (
                        <><AlertTriangle className="w-4 h-4 mr-2" />Escalate Case</>
                      )}
                    </Button>
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
