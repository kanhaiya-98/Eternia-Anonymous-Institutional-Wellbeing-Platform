"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Star, Clock } from "lucide-react"

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
    <Card className="border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar */}
          <Avatar className="w-20 h-20 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-primary font-medium">{specialization}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {experience}
              </Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {rating}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{availability}</span>
            </div>
          </div>

          {/* Book Button */}
          <div className="flex sm:flex-col justify-end gap-2">
            <Button onClick={onBook} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
