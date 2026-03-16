"use client"

import { ReactNode } from "react"
import Link from "next/link"

interface PortalCardProps {
  title: string
  description: string
  icon: ReactNode
  href: string
  gradient?: string
  accentColor?: string
}

export function PortalCard({
  title,
  description,
  icon,
  href,
  gradient = "from-primary/10 to-accent/5",
  accentColor = "rgba(120,60,220,0.6)",
}: PortalCardProps) {
  return (
    <Link href={href} className="block group portal-hover gradient-border">
      <div
        className={`
          relative h-full rounded-2xl border border-border/50 overflow-hidden
          bg-gradient-to-br ${gradient}
          glass backdrop-blur-sm
          transition-all duration-300
          group-hover:shadow-2xl group-hover:border-primary/30
        `}
        style={{
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Glow orb inside card */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />

        <div className="relative p-6 flex flex-col items-center text-center gap-4 z-10">
          {/* Icon wrapper */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
            }}
          >
            <span className="[&>svg]:w-8 [&>svg]:h-8">{icon}</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            Explore →
          </div>
        </div>
      </div>
    </Link>
  )
}
