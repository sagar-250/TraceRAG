"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { FileText, Upload, Loader2, CheckCircle } from "lucide-react";

interface FileUploaderProps {
  onUploadSuccess?: (response: any) => void; // Callback when upload is successful
}

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        uploadFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setIsSuccess(false); // Reset success state

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:9000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      onUploadSuccess?.(result); // Trigger success callback if provided
      setIsSuccess(true); // Set success state
      setTimeout(() => setIsSuccess(false), 3000); // Hide success message after 3 sec
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isSuccess ? (
        <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
      ) : (
        <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
      )}

      <p className="text-sm text-muted-foreground text-center mb-2">
        {isSuccess ? "Upload Successful!" : "Upload a PDF to start a new conversation"}
      </p>

      <Button onClick={handleButtonClick} disabled={isUploading} variant="outline" size="sm">
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Done!
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Select PDF
          </>
        )}
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
  