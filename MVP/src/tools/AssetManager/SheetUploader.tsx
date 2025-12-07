import React, { useCallback, useState } from 'react';

interface SheetUploaderProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export const SheetUploader: React.FC<SheetUploaderProps> = ({ onUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUpload(file);
      }
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  }, [onUpload]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
        ${isDragging
          ? 'border-yellow-500 bg-yellow-500/10'
          : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading sprite sheet...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">
            {isDragging ? '📥' : '🖼️'}
          </div>
          <p className="text-lg font-medium text-gray-200">
            {isDragging ? 'Drop your sprite sheet here!' : 'Upload Sprite Sheet'}
          </p>
          <p className="text-sm text-gray-400">
            Drag & drop or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supports PNG, JPG • Default grid: 6x5 (30 sprites)
          </p>
        </div>
      )}
    </div>
  );
};

export default SheetUploader;
