"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Clock,
  Star,
  Heart,
  MessageCircle,
  Phone,
  CheckCircle,
  Users,
  Sparkles,
} from "lucide-react";

interface PeerListener {
  id: string;
  name: string;
  specialization: string;
  sessions_completed: number;
  rating: number;
  availability: string;
  initials: string;
  is_good_listener: boolean;
  bio: string;
}

export default function PeerConnectPage() {
  const [listeners, setListeners] = useState<PeerListener[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListener, setSelectedListener] = useState<PeerListener | null>(
    null,
  );
  const [connectionType, setConnectionType] = useState<"chat" | "voice">(
    "chat",
  );
  const [connectionStep, setConnectionStep] = useState<
    "select" | "connecting" | "connected"
  >("select");

  useEffect(() => {
    async function fetchListeners() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("peer_listeners")
        .select("*")
        .order("rating", { ascending: false });

      if (!error && data) {
        setListeners(data);
      }
      setLoading(false);
    }
    fetchListeners();
  }, []);

  const filteredListeners = listeners.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.specialization.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleConnect = (listener: PeerListener) => {
    setSelectedListener(listener);
    setConnectionStep("select");
  };

  const startConnection = () => {
    setConnectionStep("connecting");
    setTimeout(() => {
      setConnectionStep("connected");
    }, 2000);
  };

  const closeDialog = () => {
    setSelectedListener(null);
    setConnectionStep("select");
  };

  const gradientPairs = [
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-pink-600",
    "from-indigo-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Page Hero */}
      <div className="relative overflow-hidden noise-bg border-b border-border/40">
        <div className="orb orb-1 w-72 h-72 -top-16 -left-16 opacity-40" />
        <div className="orb orb-2 w-56 h-56 top-0 right-0 opacity-30" />
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Community Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Peer <span className="gradient-text">Connect</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed">
            Connect with trained peer listeners who understand what you&apos;re going through
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Info Banner */}
        <div
          className="rounded-2xl border border-primary/15 p-5 flex items-start gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(120,60,220,0.06), rgba(40,200,220,0.04))",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Safe & Confidential</h3>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Our peer listeners are trained students who understand what you&apos;re going through.
              All conversations are anonymous and confidential.
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-background/60 border-border/60 rounded-xl focus:border-primary transition-all duration-200"
            />
          </div>
          <button className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border border-border/60 text-sm font-semibold text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all duration-200">
            <Filter className="w-4 h-4 text-primary" />
            Filters
          </button>
        </div>

        {/* Listener Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border/50 p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-3/4 rounded-full bg-muted" />
                    <div className="h-3 w-1/2 rounded-full bg-muted" />
                    <div className="h-3 w-2/3 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListeners.map((listener, idx) => (
              <div
                key={listener.id}
                className="gradient-border portal-hover rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/30"
                onClick={() => handleConnect(listener)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative shrink-0">
                      <Avatar className="h-16 w-16 border-2 border-white/50 shadow-md">
                        <AvatarFallback
                          className={`text-lg font-black bg-gradient-to-br ${gradientPairs[idx % gradientPairs.length]} text-white`}
                        >
                          {listener.initials}
                        </AvatarFallback>
                      </Avatar>
                      {listener.availability.toLowerCase().includes("available") && (
                        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm tracking-tight">{listener.name}</h3>
                      {listener.is_good_listener && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                          <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                            Good Listener
                          </span>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground font-medium leading-snug">
                        {listener.specialization}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold">{listener.rating}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{listener.sessions_completed} sessions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <Badge
                      className={`rounded-xl text-xs font-semibold px-2.5 py-1 flex items-center gap-1 ${
                        listener.availability.toLowerCase().includes("available")
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40"
                          : "bg-muted text-muted-foreground border-border/50"
                      }`}
                      variant="outline"
                    >
                      <Clock className="w-3 h-3" />
                      {listener.availability}
                    </Badge>
                    <button className="btn-premium inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredListeners.length === 0 && !loading && (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.1), rgba(40,200,220,0.08))" }}
            >
              <Search className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground font-medium">No listeners found matching your search.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try a different name or topic</p>
          </div>
        )}
      </main>

      {/* Connection Dialog */}
      <Dialog open={!!selectedListener} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md glass border-border/60 rounded-2xl shadow-2xl">
          {connectionStep === "connecting" ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="relative mb-6">
                <div className="h-24 w-24 animate-ping rounded-full bg-primary/15 absolute inset-0" />
                <Avatar className="relative h-24 w-24 border-4 border-primary/30 shadow-xl">
                  <AvatarFallback
                    className="text-2xl font-black"
                    style={{ background: "var(--gradient-hero)", color: "white" }}
                  >
                    {selectedListener?.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <DialogTitle className="text-xl font-bold">Connecting...</DialogTitle>
              <DialogDescription className="mt-2">
                Connecting you with {selectedListener?.name}
              </DialogDescription>
            </div>
          ) : connectionStep === "connected" ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold">Connected!</DialogTitle>
              <DialogDescription className="mt-2 max-w-xs">
                You are now connected with {selectedListener?.name}. Remember, this is a safe space.
              </DialogDescription>
              <button
                className="btn-premium mt-6 w-full h-12 rounded-xl font-semibold text-white"
                onClick={closeDialog}
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarFallback
                      className="font-black text-lg"
                      style={{ background: "var(--gradient-hero)", color: "white" }}
                    >
                      {selectedListener?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="flex items-center gap-2 font-bold">
                      {selectedListener?.name}
                      {selectedListener?.is_good_listener && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-xs rounded-full bg-pink-50 dark:bg-pink-950/30 text-pink-600 border-pink-200/50"
                        >
                          <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                          Good Listener
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium mt-0.5">
                      {selectedListener?.specialization}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 py-3">
                {/* Bio */}
                <div
                  className="rounded-xl p-4 text-sm text-muted-foreground leading-relaxed"
                  style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.05), rgba(40,200,220,0.04))" }}
                >
                  {selectedListener?.bio}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-black text-lg">{selectedListener?.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Rating</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-3.5 text-center">
                    <div className="font-black text-lg mb-0.5">
                      {selectedListener?.sessions_completed}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Sessions</p>
                  </div>
                </div>

                {/* Connection Type */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">
                    How would you like to connect?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConnectionType("chat")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                        connectionType === "chat"
                          ? "border-primary/0 text-white shadow-md"
                          : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                      style={
                        connectionType === "chat"
                          ? { background: "var(--gradient-hero)", boxShadow: "0 4px 16px var(--glow-primary)" }
                          : {}
                      }
                    >
                      <MessageCircle className="h-5 w-5" />
                      Text Chat
                    </button>
                    <button
                      onClick={() => setConnectionType("voice")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                        connectionType === "voice"
                          ? "border-primary/0 text-white shadow-md"
                          : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                      style={
                        connectionType === "voice"
                          ? { background: "var(--gradient-hero)", boxShadow: "0 4px 16px var(--glow-primary)" }
                          : {}
                      }
                    >
                      <Phone className="h-5 w-5" />
                      Voice Call
                    </button>
                  </div>
                </div>

                {/* Connect Button */}
                <button
                  className="btn-premium w-full h-12 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={startConnection}
                  disabled={
                    !selectedListener?.availability
                      ?.toLowerCase()
                      .includes("available")
                  }
                >
                  {selectedListener?.availability
                    ?.toLowerCase()
                    .includes("available")
                    ? "Connect Now"
                    : "Currently Unavailable"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
