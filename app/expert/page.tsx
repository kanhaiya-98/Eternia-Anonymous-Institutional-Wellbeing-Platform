"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  Video,
  Phone,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface Expert {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  availability: string;
  initials: string;
  bio: string;
  sessions: number;
  tags: string[];
}

const MOCK_EXPERTS: Expert[] = [
  {
    id: "1",
    name: "Dr. Priya Sharma",
    specialization: "Anxiety & Stress Management",
    experience: "10+ years",
    rating: 4.9,
    availability: "Available Today",
    initials: "PS",
    bio: "Specialized in helping students cope with academic pressure and anxiety disorders using evidence-based CBT techniques.",
    sessions: 1240,
    tags: ["CBT", "Anxiety", "Student Wellness"],
  },
  {
    id: "2",
    name: "Dr. Rahul Mehta",
    specialization: "Depression & Mood Disorders",
    experience: "8 years",
    rating: 4.8,
    availability: "Available Tomorrow",
    initials: "RM",
    bio: "Expert in cognitive behavioral therapy for mood disorders and depression, with focus on long-term recovery.",
    sessions: 980,
    tags: ["Depression", "Mood", "CBT"],
  },
  {
    id: "3",
    name: "Dr. Ananya Patel",
    specialization: "Student Counseling",
    experience: "6 years",
    rating: 4.7,
    availability: "Available Today",
    initials: "AP",
    bio: "Dedicated to supporting students through their academic journey with compassionate, solution-focused therapy.",
    sessions: 760,
    tags: ["Academic Stress", "Counseling", "Career"],
  },
  {
    id: "4",
    name: "Dr. Vikram Singh",
    specialization: "Trauma & PTSD",
    experience: "12 years",
    rating: 4.9,
    availability: "Next Week",
    initials: "VS",
    bio: "Specialized in trauma-informed care and EMDR therapy for PTSD and complex trauma recovery.",
    sessions: 1560,
    tags: ["EMDR", "Trauma", "PTSD"],
  },
  {
    id: "5",
    name: "Dr. Sneha Gupta",
    specialization: "Relationship Counseling",
    experience: "7 years",
    rating: 4.6,
    availability: "Available Today",
    initials: "SG",
    bio: "Helping individuals navigate personal and social relationships with empathy and evidence-based strategies.",
    sessions: 820,
    tags: ["Relationships", "Social Anxiety", "Self-Esteem"],
  },
  {
    id: "6",
    name: "Dr. Arjun Nair",
    specialization: "Career & Academic Stress",
    experience: "5 years",
    rating: 4.8,
    availability: "Available Tomorrow",
    initials: "AN",
    bio: "Focused on career guidance and academic stress management for students navigating pivotal life decisions.",
    sessions: 610,
    tags: ["Career", "Academic", "Life Transitions"],
  },
];

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM",
];

type SessionType = "video" | "audio" | "chat";
type Step = "type" | "date" | "time" | "confirm" | "done";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExpertPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [step, setStep] = useState<Step>("type");
  const [sessionType, setSessionType] = useState<SessionType>("video");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : d.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
      dayNum: d.getDate(),
      dayName: i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      monthDay: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  });

  const filtered = MOCK_EXPERTS.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const openBooking = (expert: Expert) => {
    setSelectedExpert(expert);
    setStep("type");
    setSessionType("video");
    setSelectedDate("");
    setSelectedTime("");
  };

  const closeDialog = () => {
    setSelectedExpert(null);
    setStep("type");
  };

  const confirmBooking = async () => {
    setIsBooking(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsBooking(false);
    setStep("done");
  };

  const stepIndex = { type: 1, date: 2, time: 3, confirm: 4, done: 4 };
  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Page Hero */}
      <div className="relative overflow-hidden noise-bg border-b border-border/40">
        <div className="orb orb-1 w-72 h-72 -top-16 -left-16 opacity-40" />
        <div className="orb orb-2 w-56 h-56 top-0 right-0 opacity-30" />
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10 max-w-6xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Verified Mental Health Professionals
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Expert <span className="gradient-text">Connect</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed">
            Book private, anonymous sessions with certified therapists and counsellors — paid via your ECC balance.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-10 max-w-6xl space-y-8">
        {/* ── Search ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, specialization or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-background/60 border-border/60 rounded-xl focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Expert Grid ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((expert, idx) => {
            const gradients = [
              "from-violet-500 to-purple-600",
              "from-cyan-500 to-blue-600",
              "from-fuchsia-500 to-pink-600",
              "from-indigo-500 to-violet-600",
              "from-emerald-500 to-teal-600",
              "from-orange-500 to-amber-600",
            ];
            const isAvailableToday = expert.availability.toLowerCase().includes("today") || expert.availability.toLowerCase().includes("now");
            return (
              <div
                key={expert.id}
                className="gradient-border portal-hover rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:border-primary/30"
                onClick={() => openBooking(expert)}
              >
                {/* Top gradient line */}
                <div
                  className="h-1 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "var(--gradient-hero)" }}
                />
                <div className="p-5">
                  {/* Avatar + Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14 border-2 border-white/30 shadow-md">
                        <AvatarFallback className={`bg-gradient-to-br ${gradients[idx % gradients.length]} text-white font-black text-sm`}>
                          {expert.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm leading-tight tracking-tight">
                        {expert.name}
                      </h3>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {expert.specialization}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-foreground">
                            {expert.rating}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {expert.experience}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                    {expert.bio}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {expert.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold bg-primary/8 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-border/40">
                    <Badge
                      variant="outline"
                      className={`text-[10px] rounded-xl px-2.5 py-1 font-semibold flex items-center gap-1 ${
                        isAvailableToday
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40"
                          : "bg-muted text-muted-foreground border-border/50"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isAvailableToday ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
                      {expert.availability}
                    </Badge>
                    <button
                      className="btn-premium inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        openBooking(expert);
                      }}
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.1), rgba(40,200,220,0.08))" }}
            >
              <Sparkles className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground font-medium">No experts match your search.</p>
          </div>
        )}
      </main>

      {/* ───────────── BOOKING DIALOG ───────────── */}
      <Dialog open={!!selectedExpert} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/60 glass rounded-2xl shadow-2xl">

          {step !== "done" && (
            <>
              {/* Dialog Header */}
              <div className="border-b border-border/50 px-6 py-4" style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.08), rgba(40,200,220,0.05))" }}>
                <div className="flex items-center gap-4">
                  {step !== "type" && (
                    <button
                      onClick={() => {
                        if (step === "date") setStep("type");
                        else if (step === "time") setStep("date");
                        else if (step === "confirm") setStep("time");
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="font-black text-sm" style={{ background: "var(--gradient-hero)", color: "white" }}>
                      {selectedExpert?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {selectedExpert?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedExpert?.specialization}
                    </p>
                  </div>
                  {/* Step Dots */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i + 1 <= stepIndex[step]
                            ? "bg-primary w-4"
                            : "bg-border w-1.5"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* ── STEP 1: Session Type ── */}
                {step === "type" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-0.5">
                        Choose Session Type
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Select how you&apos;d like to connect
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { type: "video" as const, icon: Video, label: "Video Call", desc: "Face-to-face via camera" },
                        { type: "audio" as const, icon: Phone, label: "Audio Call", desc: "Voice only, no camera" },
                        { type: "chat" as const, icon: MessageSquare, label: "Chat", desc: "Text-based session" },
                      ].map(({ type, icon: Icon, label, desc }) => (
                        <button
                          key={type}
                          onClick={() => setSessionType(type)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center font-semibold ${
                            sessionType === type
                              ? "border-primary/0 text-white shadow-md"
                              : "border-border hover:border-primary/40 hover:bg-secondary/50 text-muted-foreground"
                          }`}
                          style={sessionType === type ? { background: "var(--gradient-hero)", boxShadow: "0 4px 16px var(--glow-primary)" } : {}}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-semibold">{label}</span>
                          <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Expert bio snippet */}
                    <div className="rounded-xl bg-secondary/40 p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedExpert?.bio}
                      </p>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/40">
                        <span className="text-xs text-foreground font-medium">
                          ⭐ {selectedExpert?.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedExpert?.experience}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedExpert?.sessions.toLocaleString()} sessions
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep("date")}
                      className="btn-premium w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ── STEP 2: Date ── */}
                {step === "date" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-0.5">
                        Pick a Date
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Choose a day for your {sessionType} session
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {dates.map((date) => (
                        <button
                          key={date.value}
                          onClick={() => {
                            setSelectedDate(date.value);
                            setSelectedTime("");
                          }}
                          className={`flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl border-2 transition-all duration-200 ${
                            selectedDate === date.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/40 hover:bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          <span className="text-[10px] font-medium opacity-70">
                            {date.dayName}
                          </span>
                          <span className="text-lg font-bold leading-tight">
                            {date.dayNum}
                          </span>
                          <span className="text-[9px] opacity-60">
                            {new Date(date.value).toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("type")}
                        className="flex-1 h-11 rounded-xl border-border/60"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <button
                        onClick={() => setStep("time")}
                        disabled={!selectedDate}
                        className="btn-premium flex-1 h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Time ── */}
                {step === "time" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-0.5">
                        Select a Time Slot
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Available slots for{" "}
                        <span className="text-foreground font-medium">
                          {dates.find((d) => d.value === selectedDate)?.label}
                        </span>
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_SLOTS.map((time, i) => {
                        const isBooked = i === 2 || i === 5; // fake booked slots
                        return (
                          <button
                            key={time}
                            onClick={() => !isBooked && setSelectedTime(time)}
                            disabled={isBooked}
                            className={`py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all duration-200 ${
                              isBooked
                                ? "border-border/40 text-muted-foreground/40 cursor-not-allowed bg-muted/20 line-through"
                                : selectedTime === time
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/40 hover:bg-secondary/50 text-muted-foreground"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      <span className="line-through mr-1">Strikethrough</span> = already booked
                    </p>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("date")}
                        className="flex-1 h-11 rounded-xl border-border/60"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <button
                        onClick={() => setStep("confirm")}
                        disabled={!selectedTime}
                        className="btn-premium flex-1 h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Review Booking <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Confirm ── */}
                {step === "confirm" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-0.5">
                        Confirm Your Booking
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Review your session details before confirming
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {selectedExpert?.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{selectedExpert?.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedExpert?.specialization}</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {sessionType === "video" ? <Video className="w-4 h-4" /> : sessionType === "audio" ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                            <span className="text-xs">Session Type</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground capitalize">{sessionType} Call</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs">Date</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {dates.find((d) => d.value === selectedDate)?.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">Time</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">{selectedTime}</span>
                        </div>
                        <div className="border-t border-border/40 pt-2.5 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">ECC Cost</span>
                          <span className="text-sm font-bold text-primary">50 ECC</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Your identity remains fully anonymous. The expert will only see a randomised session ID.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("time")}
                        className="flex-1 h-11 rounded-xl border-border/60"
                        disabled={isBooking}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <button
                        onClick={confirmBooking}
                        disabled={isBooking}
                        className="btn-premium flex-1 h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isBooking ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Booking...
                          </span>
                        ) : (
                          <>
                            Confirm Booking
                            <CheckCircle className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div className="text-center py-10 px-6 animate-in fade-in zoom-in duration-500">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/30">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                Booking Confirmed! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your session with{" "}
                <span className="font-semibold text-foreground">
                  {selectedExpert?.name}
                </span>{" "}
                is all set.
              </p>

              {/* Booking summary */}
              <div className="rounded-xl border border-border/60 bg-secondary/20 text-left px-4 py-3 space-y-2.5 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-xs font-semibold text-foreground">
                    {dates.find((d) => d.value === selectedDate)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Time</span>
                  <span className="text-xs font-semibold text-foreground">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {sessionType} Session
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/40 pt-2.5">
                  <span className="text-xs text-muted-foreground">ECC Deducted</span>
                  <span className="text-sm font-bold text-primary">- 50 ECC</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  className="flex-1 h-11 rounded-xl border-border/60"
                >
                  Back to Experts
                </Button>
                <button
                  onClick={closeDialog}
                  className="flex-1 h-11 rounded-xl font-semibold text-white btn-premium flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}
