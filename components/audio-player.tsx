"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  title: string
  artist: string
  duration: string
  category: string
  isActive: boolean
  onPlay: () => void
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

  const categoryColors: Record<string, string> = {
    focus: "bg-blue-500/10 text-blue-600",
    calm: "bg-primary/10 text-primary",
    sleep: "bg-indigo-500/10 text-indigo-600",
    nature: "bg-green-500/10 text-green-600",
  }

  return (
    <Card className={`border-border/50 transition-all duration-300 ${isActive ? "border-primary/50 shadow-lg" : "hover:border-primary/30"}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Play Button */}
          <Button
            size="icon"
            variant="outline"
            className={`w-12 h-12 rounded-full flex-shrink-0 ${isActive && isPlaying ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border"}`}
            onClick={togglePlay}
          >
            {isPlaying && isActive ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">{title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[category] || categoryColors.calm}`}>
                {category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{artist}</p>
            
            {/* Progress Bar */}
            {isActive && (
              <div className="mt-2">
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground">{duration}</span>
            {isActive && (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
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
      </CardContent>
    </Card>
  )
}
