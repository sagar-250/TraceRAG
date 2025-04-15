"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { FileUploader } from "./file-uploader"
import { ConversationItem } from "./conversation-item"
import type { Conversation } from "@/lib/types"
import { MessageSquarePlus } from "lucide-react"

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onNewConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function ConversationList({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // Simulate file upload to backend
      // In real implementation, this would be an actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create new conversation after successful upload
      onNewConversation()
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-lg w-72">
      <div className="p-4 border-b">
        <Button className="w-full" onClick={onNewConversation} disabled={isUploading}>
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversationId}
              onSelect={() => onSelectConversation(conversation.id)}
              onDelete={() => onDeleteConversation(conversation.id)}
            />
          ))}
          {conversations.length === 0 && (
            <div className="text-center text-muted-foreground py-8">No conversations yet</div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <FileUploader onFileUpload={handleFileUpload} isUploading={isUploading} />
      </div>
    </div>
  )
}

