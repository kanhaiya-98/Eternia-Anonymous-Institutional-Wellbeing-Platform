"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowLeft, AlertTriangle, Scan } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate QR scan on web; real scan handled natively on mobile
    setTimeout(() => {
      setIsScanning(false);
      router.push("/activate");
    }, 2500);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background noise-bg">
      {/* Animated gradient orbs */}
      <div className="orb orb-1 w-[500px] h-[500px] -top-32 -left-40 opacity-50" />
      <div className="orb orb-2 w-[400px] h-[400px] -bottom-24 -right-28 opacity-45" />

      {/* Back button */}
      <button
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 text-center fade-in-up">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight gradient-text leading-none">
            Eternia
          </h1>
          <p className="text-muted-foreground mt-3 text-sm font-medium">
            Verify your identity
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass w-full rounded-2xl p-8 shadow-2xl gradient-border fade-in-up fade-in-up-delay-1">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Scan Now</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Point your camera at the QR code provided by your institution
            </p>
          </div>

          <div className="space-y-6">
            {/* QR Scanner Window */}
            <div
              className={`aspect-square rounded-2xl border-2 flex items-center justify-center relative overflow-hidden transition-all duration-500 ${
                isScanning
                  ? "border-primary/60 bg-primary/5"
                  : "border-dashed border-border/60 bg-muted/20"
              }`}
            >
              {isScanning ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                  {/* Corner frames */}
                  {[
                    "top-4 left-4 rounded-tl-lg border-t-2 border-l-2",
                    "top-4 right-4 rounded-tr-lg border-t-2 border-r-2",
                    "bottom-4 left-4 rounded-bl-lg border-b-2 border-l-2",
                    "bottom-4 right-4 rounded-br-lg border-b-2 border-r-2",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-7 h-7 border-primary ${cls}`} />
                  ))}

                  {/* Scanning beam */}
                  <div
                    className="scan-line absolute left-6 right-6 h-0.5 rounded-full"
                    style={{
                      background: "var(--gradient-hero)",
                      boxShadow: "0 0 12px rgba(120,60,220,0.7)",
                    }}
                  />

                  <div className="text-center z-10">
                    <div className="w-10 h-10 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-primary">Scanning...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <QrCode className="w-20 h-20 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">
                    QR Scanning Window
                  </p>
                </div>
              )}
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="btn-premium w-full h-12 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning...
                </span>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Scan Now
                </>
              )}
            </button>

            {/* Disclaimer */}
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-50/60 dark:bg-yellow-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Disclaimer</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By scanning this QR code, you confirm that you are a
                    registered student of the partnering institution. Your
                    identity will remain anonymous within the Eternia platform.
                    The QR code is used solely for verification purposes and does
                    not store any personal information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
