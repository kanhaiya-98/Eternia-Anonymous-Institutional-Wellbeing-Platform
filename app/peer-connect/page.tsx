"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Peer Connect
          </h1>
          <p className="text-muted-foreground">
            Connect with trained peer listeners who understand what you&apos;re
            going through
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 rounded-xl bg-primary/5 p-4 border border-primary/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Safe & Confidential
              </h3>
              <p className="text-sm text-muted-foreground">
                Our peer listeners are trained students who understand what
                you&apos;re going through. All conversations are anonymous and
                confidential.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-input/50 border-border"
            />
          </div>
          <Button variant="outline" className="h-12 border-border">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Listener Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListeners.map((listener) => (
              <Card
                key={listener.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                onClick={() => handleConnect(listener)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-accent/20">
                      <AvatarFallback className="bg-accent/10 text-lg font-semibold text-accent-foreground">
                        {listener.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {listener.name}
                      </h3>

                      {/* Good Listener Tag */}
                      {listener.is_good_listener && (
                        <div className="mt-1 flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                          <span className="text-xs font-medium text-pink-600">
                            Good Listener
                          </span>
                        </div>
                      )}

                      <p className="mt-1 text-sm text-muted-foreground">
                        {listener.specialization}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {listener.rating}
                          </span>
                        </div>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {listener.sessions_completed} sessions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge
                      variant={
                        listener.availability === "Available"
                          ? "default"
                          : "secondary"
                      }
                      className="rounded-full"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {listener.availability}
                    </Badge>
                    <Button size="sm" className="rounded-full">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredListeners.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No listeners found matching your search.
            </p>
          </div>
        )}
      </main>

      {/* Connection Dialog */}
      <Dialog open={!!selectedListener} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          {connectionStep === "connecting" ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 animate-ping rounded-full bg-primary/20 absolute inset-0" />
                <Avatar className="relative h-20 w-20 border-4 border-primary">
                  <AvatarFallback className="bg-primary/10 text-xl text-primary">
                    {selectedListener?.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <DialogTitle className="text-xl">Connecting...</DialogTitle>
              <DialogDescription className="mt-2">
                Please wait while we connect you with {selectedListener?.name}
              </DialogDescription>
            </div>
          ) : connectionStep === "connected" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl">Connected!</DialogTitle>
              <DialogDescription className="mt-2">
                You are now connected with {selectedListener?.name}. Remember,
                this is a safe space.
              </DialogDescription>
              <Button className="mt-6 w-full" onClick={closeDialog}>
                Start Conversation
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-accent/10 text-accent-foreground">
                      {selectedListener?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedListener?.name}
                      {selectedListener?.is_good_listener && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                          Good Listener
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedListener?.specialization}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Bio */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedListener?.bio}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {selectedListener?.rating}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="font-semibold">
                      {selectedListener?.sessions_completed}
                    </div>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>

                {/* Connection Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    How would you like to connect?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        connectionType === "chat" ? "default" : "outline"
                      }
                      className="flex-col gap-1 py-4"
                      onClick={() => setConnectionType("chat")}
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-xs">Text Chat</span>
                    </Button>
                    <Button
                      variant={
                        connectionType === "voice" ? "default" : "outline"
                      }
                      className="flex-col gap-1 py-4"
                      onClick={() => setConnectionType("voice")}
                    >
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Voice Call</span>
                    </Button>
                  </div>
                </div>

                {/* Connect Button */}
                <Button
                  className="w-full"
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
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
