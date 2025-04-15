"use client";
import { useState, useEffect, useRef } from "react";
import { Viewer, Worker, SpecialZoomLevel, DocumentLoadEvent } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PdfViewerProps {
  pdfUrl: string;
  bbox?: string;
  pageNum?: number;
}

export function PdfViewer({ pdfUrl, bbox, pageNum = 1 }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(0.8); // Default zoom at 80%
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageLayerRef = useRef<HTMLDivElement | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const applyHighlight = () => {
    if (!bbox || !documentLoaded) return;

    try {
      const bboxCoords = JSON.parse(bbox.replace(/'/g, '"'));
      const [x1, y1, x2, y2] = bboxCoords;

      const pagesContainer = document.querySelector(".rpv-core__viewer");
      if (!pagesContainer) {
        console.error("PDF Viewer container not found");
        return;
      }

      const pageLayers = pagesContainer.querySelectorAll(".rpv-core__page-layer");
      const page = pageLayers[pageNum]; // Ensure correct page indexing
      if (!page) {
        console.error("Page not found");
        return;
      }

      pageLayerRef.current = page as HTMLDivElement;

      // Wait for the page to render before applying highlight
      setTimeout(() => {
        const { width: pageWidth, height: pageHeight } = page.getBoundingClientRect();

        // Remove existing highlights
        const existingHighlight = page.querySelector(".highlight-box");
        if (existingHighlight) existingHighlight.remove();

        // Create a new highlight box
        const highlightDiv = document.createElement("div");
        highlightDiv.className = "highlight-box";
        page.appendChild(highlightDiv);

        highlightDiv.style.position = "absolute";
        highlightDiv.style.left = `${x1 * scaleFactor}px`;
        highlightDiv.style.top = `${y1 * scaleFactor}px`;
        highlightDiv.style.width = `${(x2 - x1) * scaleFactor}px`;
        highlightDiv.style.height = `${(y2 - y1) * scaleFactor}px`;
        highlightDiv.style.backgroundColor = "rgba(255, 255, 0, 0.4)";
        highlightDiv.style.border = "2px solid rgba(255, 200, 0, 1)";
        highlightDiv.style.boxShadow = "0 0 8px rgba(255, 200, 0, 0.6)";
        highlightDiv.style.pointerEvents = "none";
        highlightDiv.style.zIndex = "100";

        // Scroll to the highlighted region
        highlightDiv.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);

    } catch (error) {
      console.error("Error applying highlight:", error, bbox);
    }
  };

  useEffect(() => {
    applyHighlight();
  }, [bbox, pageNum, documentLoaded, scaleFactor]);

  const handleDocumentLoad = (e: DocumentLoadEvent) => {
    setNumPages(e.doc.numPages);
    setDocumentLoaded(true);
  };

  useEffect(() => {
    // Reset highlight when switching PDFs
    setDocumentLoaded(false);

    // Reapply highlight after new PDF loads
    if (pdfUrl) {
      setTimeout(() => applyHighlight(), 500);
    }
  }, [pdfUrl]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }} ref={containerRef}>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <Viewer
          fileUrl={pdfUrl}
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={0.8}
          onDocumentLoad={handleDocumentLoad}
        />
      </Worker>
    </div>
  );
}
