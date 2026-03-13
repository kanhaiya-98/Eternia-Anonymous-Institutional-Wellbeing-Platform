"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { AudioPlayer } from "@/components/audio-player"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Headphones, Brain, Moon, Trees, Sparkles } from "lucide-react"

interface Track {
  id: number
  title: string
  artist: string
  duration: string
  category: string
}

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "focus", label: "Focus", icon: Brain },
  { id: "calm", label: "Calm", icon: Headphones },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "nature", label: "Nature", icon: Trees },
]

const tracks: Track[] = [
  { id: 1, title: "Deep Focus Waves", artist: "Mind Flow", duration: "10:00", category: "focus" },
  { id: 2, title: "Peaceful Morning", artist: "Serenity Sounds", duration: "8:30", category: "calm" },
  { id: 3, title: "Ocean Dreams", artist: "Sleep Haven", duration: "15:00", category: "sleep" },
  { id: 4, title: "Forest Rain", artist: "Nature Escape", duration: "12:00", category: "nature" },
  { id: 5, title: "Study Session", artist: "Brain Boost", duration: "25:00", category: "focus" },
  { id: 6, title: "Gentle Breathing", artist: "Calm Space", duration: "5:00", category: "calm" },
  { id: 7, title: "Starlit Night", artist: "Dream Walker", duration: "20:00", category: "sleep" },
  { id: 8, title: "Mountain Stream", artist: "Nature Escape", duration: "10:00", category: "nature" },
  { id: 9, title: "Mindful Minutes", artist: "Inner Peace", duration: "7:00", category: "calm" },
  { id: 10, title: "Concentration Flow", artist: "Focus Lab", duration: "30:00", category: "focus" },
  { id: 11, title: "Twilight Lullaby", artist: "Sleep Haven", duration: "18:00", category: "sleep" },
  { id: 12, title: "Birdsong Morning", artist: "Nature Escape", duration: "8:00", category: "nature" },
]

const featuredPlaylists = [
  {
    title: "Morning Calm",
    description: "Start your day with peace",
    tracks: 8,
    duration: "45 min",
    gradient: "from-primary/20 to-secondary/30",
  },
  {
    title: "Deep Sleep",
    description: "Drift into restful sleep",
    tracks: 6,
    duration: "2 hr",
    gradient: "from-indigo-500/20 to-primary/10",
  },
  {
    title: "Study Focus",
    description: "Enhance concentration",
    tracks: 10,
    duration: "3 hr",
    gradient: "from-blue-500/20 to-secondary/30",
  },
]

export default function SoundTherapyPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeTrack, setActiveTrack] = useState<number | null>(null)

  const filteredTracks = activeCategory === "all"
    ? tracks
    : tracks.filter((t) => t.category === activeCategory)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Self Help Tools
          </h1>
          <p className="text-muted-foreground">
            Guided meditations, calming sounds, and exercises for your wellbeing
          </p>
        </div>

        {/* Featured Playlists */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Featured Playlists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPlaylists.map((playlist) => (
              <Card
                key={playlist.title}
                className={`border-border/50 bg-gradient-to-br ${playlist.gradient} hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1`}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{playlist.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{playlist.tracks} tracks</span>
                    <span>·</span>
                    <span>{playlist.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                className={`${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "border-border hover:bg-secondary/50"
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            )
          })}
        </div>

        {/* Tracks List */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {activeCategory === "all" ? "All Sounds" : `${categories.find((c) => c.id === activeCategory)?.label} Sounds`}
          </h2>
          <div className="grid gap-3">
            {filteredTracks.map((track) => (
              <AudioPlayer
                key={track.id}
                title={track.title}
                artist={track.artist}
                duration={track.duration}
                category={track.category}
                isActive={activeTrack === track.id}
                onPlay={() => setActiveTrack(track.id)}
              />
            ))}
          </div>
        </section>

        {/* Quick Tips */}
        <section className="mt-12">
          <Card className="border-border/50 bg-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Tips for Sound Therapy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Use headphones for the best immersive experience
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Find a quiet, comfortable space
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Set a consistent time for daily practice
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Start with shorter sessions and gradually increase
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
