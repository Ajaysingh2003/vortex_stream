import React, { useState, useRef } from "react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useVideoContext } from "../context/VideoContext";

interface CustomImageUploadProps {
  value?: string | File | null;
  onChange?: (file: File | null) => void;
  className?: string;
}

function CustomImage() {
  const { customImagePreview, setCustomImagePreview } = useVideoContext()!;
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setCustomImagePreview(objectUrl);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  // Drag and Drop Handlers
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the container click
    if (customImagePreview) URL.revokeObjectURL(customImagePreview); // Clean up memory
    setCustomImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // if (onChange) onChange(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Hidden Native Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Main Upload Dropzone Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group aspect-video w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 bg-white
          ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"
          }
        `}
      >
        {customImagePreview ? (
          /* Preview State */
          <>
            <Image
              height={100}
              width={100}
              unoptimized
              src={customImagePreview}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <button
                type="button"
                onClick={clearImage}
                className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md transform scale-90 group-hover:scale-100 transition-all duration-200"
                title="Remove image"
              >
                <X size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 group-hover:text-gray-500 group-hover:scale-110 transition-all duration-200 mb-3">
              <UploadCloud size={22} />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG or WEBP (Max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomImage;
