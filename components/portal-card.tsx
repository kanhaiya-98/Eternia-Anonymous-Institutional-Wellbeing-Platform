"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface PortalCardProps {
  title: string
  description: string
  icon: ReactNode
  href: string
  gradient?: string
}

export function PortalCard({ title, description, icon, href, gradient = "from-primary/10 to-secondary/30" }: PortalCardProps) {
  return (
    <Link href={href} className="block group">
      <Card className={`h-full border-border/50 bg-gradient-to-br ${gradient} hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1`}>
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
