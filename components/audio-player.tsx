"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  title: string
  artist: string
  duration: string
  category: string
  isActive: boolean
  onPlay: () => void
}

const categoryConfig: Record<string, { bg: string; text: string; dot: string }> = {
  focus: {
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  calm: {
    bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/40",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  sleep: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-800/40",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  nature: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/40",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
}

export function AudioPlayer({ title, artist, duration, category, isActive, onPlay }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(false)
      setProgress(0)
    }
  }, [isActive])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && isActive) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.5
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isActive])

  const togglePlay = () => {
    if (!isActive) {
      onPlay()
    }
    setIsPlaying(!isPlaying)
  }

  const config = categoryConfig[category] || categoryConfig.calm

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        isActive
          ? "border-primary/40 shadow-lg"
          : "border-border/50 hover:border-primary/25 hover:shadow-md"
      }`}
      style={{
        background: isActive
          ? "linear-gradient(135deg, rgba(120,60,220,0.06), rgba(40,200,220,0.04))"
          : "rgba(255,255,255,0.6)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Active glow pulse */}
      {isActive && isPlaying && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "inset 0 0 30px rgba(120,60,220,0.08)",
            animation: "card-glow-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      <div className="relative p-4 flex items-center gap-4 z-10">
        {/* Play Button */}
        <button
          className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
            isActive && isPlaying
              ? "text-white shadow-lg hover:scale-105"
              : "border-2 border-border/60 hover:border-primary/40 hover:bg-primary/8 text-foreground"
          }`}
          style={
            isActive && isPlaying
              ? { background: "var(--gradient-hero)", boxShadow: "0 4px 20px var(--glow-primary)" }
              : {}
          }
          onClick={togglePlay}
        >
          {isPlaying && isActive ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate text-sm">{title}</h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium shrink-0 ${config.bg} ${config.text}`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`}
                style={{ verticalAlign: "middle" }}
              />
              {category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">{artist}</p>

          {/* Progress Bar */}
          {isActive && (
            <div className="mt-2.5">
              <Slider
                value={[progress]}
                max={100}
                step={1}
                className="cursor-pointer"
                onValueChange={(value) => setProgress(value[0])}
              />
            </div>
          )}
        </div>

        {/* Duration & Volume */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{duration}</span>
          {isActive && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                className="w-20"
                onValueChange={(value) => {
                  setVolume(value[0])
                  setIsMuted(value[0] === 0)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
