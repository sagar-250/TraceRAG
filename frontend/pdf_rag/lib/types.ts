export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  source?: string
  metadata?: any  // For storing source information
}

export interface Conversation {
  id: string
  messages: Message[]
  createdAt: Date
}