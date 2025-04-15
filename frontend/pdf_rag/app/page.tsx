import { PdfRagInterface } from "@/components/pdf-rag-interface"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">PDF Knowledge Assistant</h1>
          <p className="text-muted-foreground">Chat with your PDFs using AI</p>
        </div>
      </header>
      <div className="container mx-auto flex-1 py-8">
        <PdfRagInterface />
      </div>
    </main>
  )
}

