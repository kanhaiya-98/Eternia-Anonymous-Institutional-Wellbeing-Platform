"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles } from "lucide-react"

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
    <Card className="border-border/50 bg-gradient-to-br from-card via-card to-secondary/10">
      <CardContent className="p-6 space-y-4">
        {/* Writing prompts */}
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setText(prompt + " ")}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
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
          className="min-h-[200px] bg-background/50 border-border resize-none text-foreground placeholder:text-muted-foreground focus:border-primary"
        />

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI will provide supportive insights
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Reflection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
