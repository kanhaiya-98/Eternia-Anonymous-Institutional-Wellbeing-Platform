"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { AudioPlayer } from "@/components/audio-player"
import { Headphones, Brain, Moon, Trees, Sparkles, Play, Clock, Music2 } from "lucide-react"

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
    gradient: "from-violet-500/15 via-purple-400/8 to-fuchsia-500/10",
    iconBg: "from-violet-500 to-purple-600",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Deep Sleep",
    description: "Drift into restful sleep",
    tracks: 6,
    duration: "2 hr",
    gradient: "from-indigo-500/15 via-blue-400/8 to-cyan-500/10",
    iconBg: "from-indigo-500 to-blue-600",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Study Focus",
    description: "Enhance concentration",
    tracks: 10,
    duration: "3 hr",
    gradient: "from-cyan-500/15 via-sky-400/8 to-blue-500/10",
    iconBg: "from-cyan-500 to-sky-600",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
]

export default function SoundTherapyPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeTrack, setActiveTrack] = useState<number | null>(null)

  const filteredTracks = activeCategory === "all"
    ? tracks
    : tracks.filter((t) => t.category === activeCategory)

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Page hero */}
      <div className="relative overflow-hidden noise-bg border-b border-border/40">
        <div className="orb orb-1 w-72 h-72 -top-16 -left-16 opacity-40" />
        <div className="orb orb-2 w-56 h-56 top-0 right-0 opacity-30" />
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Sound Therapy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Self Help <span className="gradient-text">Tools</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed">
            Guided meditations, calming sounds, and exercises for your wellbeing
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-10 space-y-12">
        {/* Featured Playlists */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Featured Playlists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPlaylists.map((playlist) => (
              <div
                key={playlist.title}
                className={`gradient-border portal-hover rounded-2xl border border-border/50 bg-gradient-to-br ${playlist.gradient} p-6 cursor-pointer backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${playlist.iconBg}`}
                >
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-1 text-base">{playlist.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{playlist.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Music2 className="w-3 h-3" />
                      {playlist.tracks} tracks
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {playlist.duration}
                    </span>
                  </div>
                  <div className={`text-xs font-semibold ${playlist.textColor} flex items-center gap-1`}>
                    <Play className="w-3 h-3 fill-current" />
                    Play all
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isActive
                    ? "text-white border-primary/0 shadow-md"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
                style={isActive ? { background: "var(--gradient-hero)", boxShadow: "0 4px 16px var(--glow-primary)" } : {}}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            )
          })}
        </div>

        {/* Tracks List */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-5">
            {activeCategory === "all"
              ? "All Sounds"
              : `${categories.find((c) => c.id === activeCategory)?.label} Sounds`}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredTracks.length} tracks)
            </span>
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
        <section>
          <div
            className="rounded-2xl border border-primary/15 p-6 md:p-8"
            style={{
              background: "linear-gradient(135deg, rgba(120,60,220,0.05), rgba(40,200,220,0.04))",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tips for Sound Therapy
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {[
                "Use headphones for the best immersive experience",
                "Find a quiet, comfortable space",
                "Set a consistent time for daily practice",
                "Start with shorter sessions and gradually increase",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "var(--gradient-hero)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
