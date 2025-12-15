import React, { useRef, useState, useEffect } from 'react';
import Croppie, { CroppieOptions } from 'croppie';
import 'croppie/croppie.css';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in bytes
  value?: File | null;
  onChange?: (file: File | null) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  // Image cropping options
  enableCropping?: boolean;
  aspectRatio?: number; // width / height
  cropShape?: 'square' | 'circle';
  // Image resizing options
  enableResizing?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
}

// Utility function to resize images
const resizeImage = (blob: Blob, maxWidth: number, maxHeight: number, quality: number = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
  });
};

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  value,
  onChange,
  onError,
  disabled = false,
  className = '',
  // Image cropping options
  enableCropping = false,
  aspectRatio = 1,
  cropShape = 'square',
  // Image resizing options
  enableResizing = false,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.85,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [recalcSize, setRecalcSize] = useState({ w: 0, h: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const croppieContainerRef = useRef<HTMLDivElement | null>(null);
  const croppieInstanceRef = useRef<Croppie | null>(null);

  // Update preview when value changes
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const validateFile = (file: File): boolean => {
    if (maxSize && file.size > maxSize) {
      onError?.(`File size exceeds ${formatBytes(maxSize)}`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    // Process images with cropping or resizing if enabled
    if ((enableCropping || enableResizing) && isImageFile(file)) {
      if (enableCropping) {
        setProcessingFile(file);
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setSelectedImage(reader.result as string);
            setShowCropModal(true);
          }
        };
        reader.readAsDataURL(file);
        return;
      } else if (enableResizing) {
        processImageWithResize(file);
        return;
      }
    }

    // Handle non-image files or when cropping/resizing not enabled
    onChange?.(file);
  };

  const processImageWithResize = async (file: File) => {
    if (!enableResizing) {
      onChange?.(file);
      return;
    }

    try {
      setLoading(true);
      const resizedBlob = await resizeImage(file, maxWidth, maxHeight, quality);
      const resizedFile = new File([resizedBlob], file.name, { type: file.type });
      onChange?.(resizedFile);
    } catch (err) {
      console.error('Image resizing error:', err);
      onError?.('Failed to resize image');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Croppie related functionality
  const initCroppie = (opts?: Partial<CroppieOptions>) => {
    if (!croppieContainerRef.current) return;

    if (croppieInstanceRef.current) {
      croppieInstanceRef.current.destroy();
      croppieInstanceRef.current = null;
    }

    const containerWidth = croppieContainerRef.current.offsetWidth;
    const boundarySize = Math.min(containerWidth, 350);
    const viewportSize = Math.floor(boundarySize * 0.8);

    croppieInstanceRef.current = new Croppie(croppieContainerRef.current, {
      enableExif: true,
      enableOrientation: true,
      enableZoom: true,
      showZoomer: true,
      boundary: { width: boundarySize, height: boundarySize },
      viewport: {
        width: viewportSize,
        height: cropShape === 'circle' ? viewportSize : viewportSize / aspectRatio,
        type: cropShape === 'circle' ? 'circle' : 'square'
      },
      ...opts
    });
  };

  useEffect(() => {
    if (!showCropModal || !croppieContainerRef.current || !selectedImage) return;
    
    // Small delay to ensure the modal is rendered
    const timer = setTimeout(() => {
      initCroppie();
      croppieInstanceRef.current?.bind({ url: selectedImage });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [showCropModal, selectedImage, recalcSize, aspectRatio, cropShape]);

  useEffect(() => {
    function handleResize() {
      if (showCropModal) {
        setRecalcSize({ w: window.innerWidth, h: window.innerHeight });
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showCropModal]);

  // Cleanup croppie on unmount
  useEffect(() => {
    return () => {
      if (croppieInstanceRef.current) {
        croppieInstanceRef.current.destroy();
        croppieInstanceRef.current = null;
      }
    };
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!croppieInstanceRef.current || !processingFile) return;
    setLoading(true);
    try {
      const blob = await croppieInstanceRef.current.result({
        type: 'blob',
        format: 'png',
        circle: cropShape === 'circle',
        size: {
          width: maxWidth,
          height: maxHeight
        }
      });

      // Apply resizing if needed
      const finalBlob = enableResizing 
        ? await resizeImage(blob, maxWidth, maxHeight, quality)
        : blob;

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `image-${timestamp}-${randomString}.png`;

      const file = new File([finalBlob], filename, { type: 'image/png' });
      onChange?.(file);
      
      setShowCropModal(false);
      setSelectedImage(null);
      setProcessingFile(null);
    } catch (err) {
      console.error('Image processing error:', err);
      onError?.('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCrop = () => {
    if (croppieInstanceRef.current) {
      croppieInstanceRef.current.destroy();
      croppieInstanceRef.current = null;
    }
    setShowCropModal(false);
    setSelectedImage(null);
    setProcessingFile(null);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept.includes('image') ? 'PNG, JPG, GIF up to' : 'File up to'}{' '}
              {formatBytes(maxSize)}
            </p>
            {enableCropping && accept?.includes('image') && (
              <p className="mt-1 text-xs text-blue-500">
                Images will be cropped
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cropping Modal */}
      {showCropModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              handleCancelCrop();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-medium mb-4">Crop Image</h3>
            <div ref={croppieContainerRef} className="w-full min-h-[200px]" />
            <div className="flex justify-end mt-4 gap-2">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleCancelCrop}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleSaveCroppedImage}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
