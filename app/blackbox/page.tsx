"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAgoraVoice } from "@/hooks/use-agora-voice";

type ConnectionState = "idle" | "searching" | "connecting" | "connected";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export default function BlackboxPage() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [connectionTime, setConnectionTime] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const pulseRef = useRef(0);

  // Agora Voice Hook
  const {
    isJoined,
    isMuted,
    isRemoteUserJoined,
    join,
    leave,
    toggleMute,
    setVolume,
  } = useAgoraVoice();

  // Generate channel name - in production this would come from a matchmaking server
  const generateChannelName = () => {
    return "eternia-blackbox-anonymous";
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer for connected state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connectionState === "connected") {
      interval = setInterval(() => {
        setConnectionTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connectionState]);

  // Timer for searching state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connectionState === "searching") {
      interval = setInterval(() => {
        setSearchTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connectionState]);

  // Watch for remote user joining (real Agora connection)
  useEffect(() => {
    if (isJoined && isRemoteUserJoined && connectionState === "searching") {
      setConnectionState("connecting");
      // Brief connecting animation then connected
      setTimeout(() => {
        setConnectionState("connected");
        setConnectionTime(0);
      }, 2000);
    }
  }, [isJoined, isRemoteUserJoined, connectionState]);

  // Handle volume/speaker changes
  useEffect(() => {
    if (isSpeakerOn) {
      setVolume(100);
    } else {
      setVolume(0);
    }
  }, [isSpeakerOn, setVolume]);

  // Initialize particles
  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const particles: Particle[] = [];
    const colors = [
      "rgba(94, 234, 212, 0.6)",
      "rgba(168, 85, 247, 0.4)",
      "rgba(236, 72, 153, 0.3)",
    ];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = particles;
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles(canvas);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Pulse animation
      pulseRef.current += 0.02;
      const pulse = Math.sin(pulseRef.current) * 0.2 + 1;

      // Draw neural waves based on connection state
      if (connectionState === "searching" || connectionState === "connecting") {
        // Draw expanding rings
        for (let i = 0; i < 3; i++) {
          const ringPulse = (pulseRef.current + i * 0.5) % 3;
          const radius = 60 + ringPulse * 80;
          const alpha = Math.max(0, 1 - ringPulse / 3) * 0.3;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(94, 234, 212, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw main orb(s)
      if (connectionState === "connected") {
        // Merged orbs effect
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          80 * pulse,
        );
        gradient.addColorStop(0, "rgba(94, 234, 212, 0.9)");
        gradient.addColorStop(0.3, "rgba(168, 85, 247, 0.6)");
        gradient.addColorStop(0.6, "rgba(236, 72, 153, 0.4)");
        gradient.addColorStop(1, "rgba(94, 234, 212, 0)");

        ctx.beginPath();
        ctx.arc(centerX, centerY, 70 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner glow
        const innerGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          40,
        );
        innerGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        innerGradient.addColorStop(0.5, "rgba(94, 234, 212, 0.5)");
        innerGradient.addColorStop(1, "rgba(94, 234, 212, 0)");

        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();

        // Draw connection particles between orbs
        for (let i = 0; i < 8; i++) {
          const angle = pulseRef.current * 0.5 + (i * Math.PI * 2) / 8;
          const radius = 50 + Math.sin(pulseRef.current * 2 + i) * 20;
          const px = centerX + Math.cos(angle) * radius;
          const py = centerY + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fill();
        }
      } else {
        // Single orb
        const orbRadius =
          connectionState === "searching" ? 55 * pulse : 50 * pulse;

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          orbRadius,
        );
        gradient.addColorStop(0, "rgba(94, 234, 212, 0.9)");
        gradient.addColorStop(0.5, "rgba(94, 234, 212, 0.4)");
        gradient.addColorStop(1, "rgba(94, 234, 212, 0)");

        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner bright core
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [connectionState, initParticles]);

  const handleConnect = async () => {
    setConnectionState("searching");
    setSearchTime(0);

    try {
      const channel = generateChannelName();
      await join(channel);

      // If no one joins within 45 seconds, simulate a connection for demo purposes
      setTimeout(() => {
        setConnectionState((current) => {
          if (current === "searching") {
            // Simulate connection for demo
            setTimeout(() => {
              setConnectionState("connected");
              setConnectionTime(0);
            }, 2000);
            return "connecting";
          }
          return current;
        });
      }, 45000);
    } catch (error) {
      console.error("Failed to join voice channel:", error);
      setConnectionState("idle");
    }
  };

  const handleDisconnect = async () => {
    await leave();
    setConnectionState("idle");
    setConnectionTime(0);
    setSearchTime(0);
  };

  const handleToggleMute = async () => {
    await toggleMute();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/dashboard">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
              <Shield className="w-4 h-4" />
              100% Anonymous
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ background: "linear-gradient(135deg, #5eead4 0%, #a855f7 50%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              The Blackbox Portal
            </h1>
            <p className="text-white/50 mt-1 text-sm">
              Your gateway to anonymous therapy. No name, no face.
            </p>
          </div>
        </div>

        {/* Main Orb Area */}
        <div className="relative mx-auto max-w-2xl">
          <div className="relative aspect-square max-h-[500px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* Status Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {connectionState === "idle" && (
                <div className="text-center mt-40">
                  <p className="text-white/40 text-sm">Tap the orb to begin</p>
                </div>
              )}

              {connectionState === "searching" && (
                <div className="text-center mt-40">
                  <p className="text-teal-400 text-lg font-medium animate-pulse">
                    Searching...
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    Finding someone who understands
                  </p>
                  <p className="text-teal-400/60 text-sm font-mono mt-2">
                    {formatTime(searchTime)}
                  </p>
                </div>
              )}

              {connectionState === "connecting" && (
                <div className="text-center mt-40">
                  <Loader2 className="h-6 w-6 text-purple-400 animate-spin mx-auto mb-2" />
                  <p className="text-purple-400 text-lg font-medium">
                    Connecting...
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    Establishing secure voice channel
                  </p>
                </div>
              )}

              {connectionState === "connected" && (
                <div className="text-center mt-40">
                  <p className="text-pink-400 text-lg font-medium">Connected</p>
                  <p className="text-white/60 text-2xl font-mono mt-2">
                    {formatTime(connectionTime)}
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    Anonymous voice space active
                  </p>
                  {isRemoteUserJoined && (
                    <p className="text-teal-400/60 text-xs mt-2">
                      Partner connected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Click area for idle state */}
            {connectionState === "idle" && (
              <button
                onClick={handleConnect}
                className="absolute inset-0 w-full h-full cursor-pointer"
                aria-label="Start anonymous connection"
              />
            )}
          </div>

          {/* Controls */}
          <div className="mt-8 flex justify-center gap-4">
            {connectionState === "connected" ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-full w-16 h-16 ${
                    isMuted
                      ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  onClick={handleToggleMute}
                >
                  {isMuted ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                  onClick={handleDisconnect}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-full w-16 h-16 ${
                    !isSpeakerOn
                      ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-6 w-6" />
                  ) : (
                    <VolumeX className="h-6 w-6" />
                  )}
                </Button>
              </>
            ) : connectionState === "idle" ? (
              <button
                className="rounded-full px-10 py-3.5 font-bold text-base text-white transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)",
                  boxShadow: "0 8px 32px rgba(20, 184, 166, 0.4)",
                }}
                onClick={handleConnect}
              >
                Begin Anonymous Connection
              </button>
            ) : (
              <button
                className="rounded-full px-10 py-3.5 font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                onClick={handleDisconnect}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Info text */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Connect with another anonymous soul for real-time voice support.
              Your identity remains completely hidden throughout the session.
            </p>
            {isJoined && (
              <p className="text-teal-400/50 text-xs mt-2">
                Voice channel active - Powered by Agora
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
