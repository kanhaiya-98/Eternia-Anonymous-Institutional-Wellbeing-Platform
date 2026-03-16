"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Star, Clock, ChevronRight } from "lucide-react"

interface TherapistCardProps {
  name: string
  specialization: string
  experience: string
  rating: number
  availability: string
  initials: string
  onBook: () => void
}

export function TherapistCard({
  name,
  specialization,
  experience,
  rating,
  availability,
  initials,
  onBook,
}: TherapistCardProps) {
  return (
    <div className="gradient-border portal-hover">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-md">
                <AvatarFallback
                  className="text-xl font-black"
                  style={{ background: "var(--gradient-hero)", color: "white" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">{name}</h3>
                <p className="text-sm font-semibold text-primary mt-0.5">{specialization}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/8 text-primary border border-primary/20 font-semibold text-xs rounded-xl"
                >
                  {experience}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-semibold text-xs rounded-xl flex items-center gap-1"
                >
                  <Star className="w-3 h-3 fill-current" />
                  {rating}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">{availability}</span>
              </div>
            </div>

            {/* Book Button */}
            <div className="flex sm:flex-col justify-end items-end gap-2 shrink-0">
              <button
                onClick={onBook}
                className="btn-premium inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </button>
              <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 font-medium">
                View Profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
