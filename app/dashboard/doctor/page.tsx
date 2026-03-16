"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { 
  AlertTriangle, 
  Activity, 
  User, 
  Hash, 
  Clock, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorDashboard() {
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationSuccess, setEscalationSuccess] = useState(false);

  const mockSession = {
    username: "yash_",
    eterniaCode: "ETR-102938",
    status: "Active",
    duration: "45 mins",
  };

  const handleEscalate = async () => {
    setIsEscalating(true);
    // Simulate API call for escalation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsEscalating(false);
    setEscalationSuccess(true);
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      setEscalationSuccess(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      
      {/* Background Orbs */}
      <div className="orb orb-1 w-[600px] h-[600px] -top-32 -right-32 opacity-20" />
      <div className="orb orb-2 w-[400px] h-[400px] bottom-10 -left-20 opacity-15" />

      <main className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold mb-3">
              <Stethoscope className="w-4 h-4" />
              Doctor Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-black gradient-text">
              Expert Dashboard
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Monitor your active sessions and trigger institutional escalation if a student is at high risk.
            </p>
          </div>
        </div>

        {/* Active Session Card */}
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-500" />
            Active Session
          </h2>
          
          <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-8 relative overflow-hidden transition-all duration-300 hover:border-primary/30">
            {/* Inner subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    Student Username
                  </label>
                  <p className="text-2xl font-black text-foreground">{mockSession.username}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4" />
                    Eternia Code
                  </label>
                  <div className="inline-flex items-center px-3 py-1 rounded-lg bg-secondary/50 border border-border text-foreground font-mono font-medium">
                    {mockSession.eterniaCode}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4" />
                    Session Status
                  </label>
                  <div className="inline-flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-lg font-bold text-green-500">{mockSession.status}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </label>
                  <p className="text-lg font-medium text-foreground">{mockSession.duration}</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <p>Only escalate if you assess an immediate risk to the student's well-being.</p>
              </div>
              
              <Button
                size="lg"
                onClick={handleEscalate}
                disabled={isEscalating || escalationSuccess}
                className={`w-full sm:w-auto font-bold rounded-xl transition-all duration-300 ${
                  escalationSuccess 
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
                }`}
              >
                {isEscalating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Escalating...
                  </>
                ) : escalationSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Case Escalated
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Escalate Case
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
