"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { ConversationList } from "./conversation-list";
import { ChatView } from "./chat-view";
import type { Conversation, Message } from "@/lib/types";
import { Menu } from "lucide-react";

export function PdfRagInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(window.innerWidth >= 1024);

    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setActivePdfUrl(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, userMessage] } : conv
      )
    );

    try {
      const response = await axios.post("http://127.0.0.1:9000/query", {
        query: content,
      });

      const { response: answer, metadata } = response.data;

      let sourceMetadata = [];
      if (metadata && Array.isArray(metadata)) {
        sourceMetadata = metadata;
      } else if (metadata) {
        sourceMetadata = [metadata];
      }

      if (sourceMetadata.length > 0 && sourceMetadata[0].file_url) {
        console.log(sourceMetadata[0].file_url);
        setActivePdfUrl(sourceMetadata[0].file_url);
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: answer || "No response from the AI.",
        createdAt: new Date(),
        source: sourceMetadata.length > 0 ? sourceMetadata[0].content?.substring(0, 50) + "..." : "Unknown source",
        metadata: sourceMetadata,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, aiMessage] } : conv
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I encountered an error while processing your request. Please try again.",
        createdAt: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, errorMessage] } : conv
        )
      );
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setActivePdfUrl(null);
    }
  };

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId);

  return (
    <div className="flex h-[calc(100vh-100px)]">
      {/* Sidebar - Collapsible */}
      <div className={`border-r transition-all fixed lg:relative bg-white h-full ${isSidebarOpen ? "w-72" : "w-0 overflow-hidden"} lg:w-72 flex-shrink-0`}>
        <div className="flex justify-between items-center p-4 border-b lg:hidden">
          <span className="font-semibold">Conversations</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-600">✖</button>
        </div>
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Chat View - Takes Full Width */}
      <div className="flex-1 w-full">
        {!isSidebarOpen && (
          <button 
            className="absolute top-50 left-7 p-2 bg-gray-800 text-white rounded-lg lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <ChatView 
          conversation={currentConversation} 
          pdfUrl={activePdfUrl} 
          onSendMessage={handleSendMessage} 
        />
      </div>
    </div>
  );
}
