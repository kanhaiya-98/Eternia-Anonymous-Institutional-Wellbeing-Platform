import { cn } from "@/lib/utils"

interface ChatBubbleProps {
  message: string
  sender: string
  time: string
  isOwn: boolean
}

export function ChatBubble({ message, sender, time, isOwn }: ChatBubbleProps) {
  return (
    <div className={cn("flex flex-col max-w-[80%]", isOwn ? "ml-auto items-end" : "mr-auto items-start")}>
      {!isOwn && (
        <span className="text-xs text-primary font-medium mb-1 px-1">{sender}</span>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 break-words",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-secondary text-secondary-foreground rounded-bl-sm"
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      <span className="text-xs text-muted-foreground mt-1 px-1">{time}</span>
    </div>
  )
}
