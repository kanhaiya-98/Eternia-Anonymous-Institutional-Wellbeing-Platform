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
  Calendar,
  Clock,
  CheckCircle,
  Star,
  Video,
  Phone,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface Expert {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  availability: string;
  initials: string;
  bio: string;
}

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export default function ExpertPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<"video" | "audio" | "chat">(
    "video",
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    async function fetchExperts() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (error) {
        setFetchError(
          "Could not load therapists. Please refresh the page and try again.",
        );
      } else if (data) {
        setExperts(data);
      }
      setLoading(false);
    }
    fetchExperts();
  }, []);

  const filteredExperts = experts.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specialization.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleBook = (expert: Expert) => {
    setSelectedExpert(expert);
    setBookingConfirmed(false);
    setSelectedDate("");
    setSelectedTime("");
    setIsBooking(false);
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedExpert) return;
    setIsBooking(true);
    // Phase 1: Simulated booking flow.
    // Phase 2+: POST /v1/appointments — deduct ECC, create appointment row,
    //           send push notification to student + expert.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsBooking(false);
    setBookingConfirmed(true);
  };

  const closeDialog = () => {
    setSelectedExpert(null);
    setBookingConfirmed(false);
    setIsBooking(false);
  };

  // Generate the next 7 days for date selection
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split("T")[0],
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : date.toLocaleDateString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Expert Connect
          </h1>
          <p className="text-muted-foreground">
            Book sessions with certified mental health professionals for
            personalised support
          </p>
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{fetchError}</p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialization..."
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

        {/* Expert Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-3 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExperts.map((expert) => (
              <Card
                key={expert.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                onClick={() => handleBook(expert)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                        {expert.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {expert.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {expert.specialization}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {expert.rating}
                          </span>
                        </div>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {expert.experience}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge
                      variant={
                        expert.availability.toLowerCase().includes("today") ||
                        expert.availability.toLowerCase().includes("now")
                          ? "default"
                          : "secondary"
                      }
                      className="rounded-full"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {expert.availability}
                    </Badge>
                    <Button size="sm" className="rounded-full">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredExperts.length === 0 && !loading && !fetchError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No therapists found matching your search.
            </p>
          </div>
        )}
      </main>

      {/* Booking Dialog */}
      <Dialog open={!!selectedExpert} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          {!bookingConfirmed ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {selectedExpert?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate">
                      {selectedExpert?.name}
                    </DialogTitle>
                    <DialogDescription className="truncate">
                      {selectedExpert?.specialization}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Bio */}
                {selectedExpert?.bio && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedExpert.bio}
                    </p>
                  </div>
                )}

                {/* Session Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Session Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: "video" as const, icon: Video, label: "Video" },
                      { type: "audio" as const, icon: Phone, label: "Audio" },
                      {
                        type: "chat" as const,
                        icon: MessageSquare,
                        label: "Chat",
                      },
                    ].map(({ type, icon: Icon, label }) => (
                      <Button
                        key={type}
                        variant={sessionType === type ? "default" : "outline"}
                        className="flex-col gap-1 py-4"
                        onClick={() => setSessionType(type)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Select Date
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {dates.map((date) => (
                      <Button
                        key={date.value}
                        variant={
                          selectedDate === date.value ? "default" : "outline"
                        }
                        className="text-xs"
                        onClick={() => {
                          setSelectedDate(date.value);
                          setSelectedTime("");
                        }}
                      >
                        {date.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map((time) => (
                        <Button
                          key={time}
                          variant={
                            selectedTime === time ? "default" : "outline"
                          }
                          className="text-xs"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={confirmBooking}
                  disabled={!selectedDate || !selectedTime || isBooking}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isBooking ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Your appointment with{" "}
                <span className="font-medium text-foreground">
                  {selectedExpert?.name}
                </span>{" "}
                has been scheduled.
              </p>
              <Card className="bg-secondary/30 border-border/50 text-left mb-6">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground font-medium">
                      {dates.find((d) => d.value === selectedDate)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground font-medium">
                      {selectedTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {sessionType === "video" ? (
                      <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : sessionType === "audio" ? (
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-foreground font-medium capitalize">
                      {sessionType} Session
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Button
                onClick={closeDialog}
                variant="outline"
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
