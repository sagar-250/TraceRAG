"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Send, Loader2, ArrowDown, FileText, X } from "lucide-react"
import type { Conversation, Message } from "@/lib/types"
import { PdfViewer } from "./pdf-viewer"
import { cn } from "@/lib/utils"

interface SourceMetadata {
  bbox: string;
  content: string;
  file_url: string;
  page_num?: number;
  type: string;
}

interface ChatViewProps {
  conversation: Conversation | undefined
  pdfUrl: string | null
  onSendMessage: (content: string) => void
}

export function ChatView({ conversation, pdfUrl, onSendMessage }: ChatViewProps) {
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isPdfOpen, setIsPdfOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<SourceMetadata | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      const { scrollHeight, clientHeight } = scrollViewportRef.current
      scrollViewportRef.current.scrollTop = scrollHeight - clientHeight
    }
    setIsAtBottom(true)
  }, [])

  // Check if scroll is at bottom
  const checkIfAtBottom = useCallback(() => {
    if (!scrollViewportRef.current) return true
    
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current
    // Consider "at bottom" if within 20px of the bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 20
    setIsAtBottom(atBottom)
    return atBottom
  }, [])

  // Monitor scroll position to detect when user has scrolled away from bottom
  const handleScroll = useCallback(() => {
    checkIfAtBottom()
  }, [checkIfAtBottom])

  // Auto-scroll to bottom when messages change, but only if already at bottom
  useEffect(() => {
    if (conversation?.messages.length && isAtBottom) {
      setTimeout(() => {
        scrollToBottom()
      }, 100) // Increased delay to ensure content is fully rendered
    }
  }, [conversation?.messages.length, isAtBottom, scrollToBottom])

  // Initial scroll to bottom when conversation changes
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]) // Only run when conversation ID changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSendMessage(input.trim())
      setInput("")
      
      // Always scroll to bottom after sending a message
      setIsAtBottom(true)
      // Small delay to ensure the new message is rendered
      setTimeout(scrollToBottom, 100)

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleViewSource = (source: SourceMetadata) => {
    console.log(source.file_url)
    setSelectedSource(source)
    setIsPdfOpen(true)
  }

  const closePdf = () => {
    setIsPdfOpen(false)
    setSelectedSource(null)
  }

  // Check if there are any AI responses
  const hasAiResponses = conversation?.messages.some(message => message.role !== "user") || false

  if (!conversation) {
    return (
      <div className="flex flex-col h-full border rounded-lg items-center justify-center text-center p-4">
        <p className="text-muted-foreground">Select a conversation or start a new one</p>
      </div>
    )
  }

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      {/* Chat section - width adjusted based on PDF visibility */}
      <div className={cn(
        "flex flex-col h-full transition-all duration-300",
        isPdfOpen ? "w-96" : "w-full"
      )}>
        <div className="flex flex-col relative flex-1">
          <div className="flex-1 relative overflow-hidden">
            <div 
              className="absolute inset-0 overflow-y-auto p-4"
              ref={scrollViewportRef}
              onScroll={handleScroll}
            >
              <div className="space-y-4">
                {conversation.messages.map((message) => {
                  // Parse sources from message metadata if available
                  let sources: SourceMetadata[] = [];
                  if (message.role === "assistant" && message.metadata) {
                    try {
                      sources = Array.isArray(message.metadata) ? message.metadata : [message.metadata];                      
                    } catch (error) {
                      console.error("Error parsing sources:", error);
                    }
                  }

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg p-4",
                        message.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-muted mr-8",
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      
                      {/* Source buttons for each reference */}
                      {message.role === "assistant" && sources.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {sources.map((source, idx) => (
                              <Button 
                                key={`source-${idx}`}
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1 text-xs"
                                onClick={() => handleViewSource(source)}
                              >
                                <FileText className="h-3 w-3" />
                                <span>Source {idx + 1}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {message.source && <p className="text-xs opacity-75">Source: {message.source}</p>}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Scroll to bottom button - only visible when not at bottom */}
          {!isAtBottom && (
            <Button
              onClick={scrollToBottom}
              size="sm"
              variant="secondary"
              className="absolute bottom-20 right-4 rounded-full shadow-md z-10"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              <span className="text-xs">New messages</span>
            </Button>
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={isSubmitting}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* PDF Viewer section - only visible when a source is selected */}
      {isPdfOpen && (
        <div className="border-l h-full flex-1 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b">
            <h3 className="text-sm font-medium">
              {selectedSource ? `Source ${selectedSource.page_num ? `(Page ${selectedSource.page_num})` : ''}` : 'PDF Viewer'}
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={closePdf}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedSource ? (
              <PdfViewer 
                pdfUrl={selectedSource.file_url} 
                bbox={selectedSource.bbox}
                pageNum={selectedSource.page_num || 0}
              />
            ) : pdfUrl ? (
              <PdfViewer pdfUrl={pdfUrl} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No PDF available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}