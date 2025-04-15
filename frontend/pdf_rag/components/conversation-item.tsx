import { Button } from "./ui/button"
import { MessageSquare, Trash2 } from "lucide-react"
import type { Conversation } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

export function ConversationItem({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) {
  const preview = conversation.messages[0]?.content || "New Conversation"
  const timeAgo = formatDistanceToNow(conversation.createdAt, { addSuffix: true })

  return (
    <div
      className={`group relative rounded-lg border p-3 hover:bg-accent transition-colors ${
        isActive ? "bg-accent" : ""
      }`}
    >
      <button className="w-full text-left" onClick={onSelect}>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{preview}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

