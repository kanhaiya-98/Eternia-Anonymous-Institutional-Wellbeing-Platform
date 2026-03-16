"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles, Feather } from "lucide-react"

interface JournalBoxProps {
  onSubmit: (text: string) => void
  isLoading?: boolean
}

export function JournalBox({ onSubmit, isLoading = false }: JournalBoxProps) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text)
      setText("")
    }
  }

  const prompts = [
    "How are you feeling right now?",
    "What's been on your mind lately?",
    "What made you smile today?",
    "What are you grateful for?",
  ]

  return (
    <div
      className="relative rounded-2xl border border-border/50 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(120,60,220,0.04) 0%, rgba(40,200,220,0.03) 100%)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Subtle glow orb */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(120,60,220,0.12), transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div className="relative p-6 space-y-5 z-10">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Feather className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Journal Entry</h3>
            <p className="text-xs text-muted-foreground">Your safe, private space</p>
          </div>
        </div>

        {/* Writing prompts */}
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setText(prompt + " ")}
              className="text-xs px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/6 text-primary hover:bg-primary/14 hover:border-primary/35 font-medium transition-all duration-150"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your thoughts here. This is your safe space. No one else will see this unless you choose to share..."
          className="min-h-[180px] bg-background/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground/60 focus:border-primary rounded-xl text-sm leading-relaxed transition-all duration-200"
        />

        {/* Footer row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>AI will provide supportive insights</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="btn-premium inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
