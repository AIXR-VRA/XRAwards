/**
 * Finalist Image Generator Utility
 * Generates composite images with finalist photo and overlay frame
 */

export interface FinalistImageConfig {
  finalistImageUrl: string;
  overlayFrameUrl: string;
  size?: number;
}

export interface GeneratedImage {
  blobUrl: string;
  blob: Blob;
}

/**
 * Load an image from URL with CORS support
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    img.src = url;
  });
}

/**
 * Generate a composite finalist share image
 * Combines finalist image with overlay frame
 */
export async function generateFinalistImage(config: FinalistImageConfig): Promise<GeneratedImage> {
  const { finalistImageUrl, overlayFrameUrl, size = 800 } = config;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = size;
  canvas.height = size;

  // Load both images in parallel
  const [finalistImg, overlayImg] = await Promise.all([
    loadImage(finalistImageUrl),
    loadImage(overlayFrameUrl)
  ]);

  // Draw finalist image (background)
  ctx.drawImage(finalistImg, 0, 0, size, size);

  // Draw overlay frame on top
  ctx.drawImage(overlayImg, 0, 0, size, size);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob from canvas'));
      }
    }, 'image/png');
  });

  return {
    blobUrl: URL.createObjectURL(blob),
    blob
  };
}

/**
 * Create a preview image element with download support
 */
export function createPreviewImageElement(
  blobUrl: string, 
  finalistTitle: string,
  onRightClick?: (e: MouseEvent) => void
): HTMLImageElement {
  const img = document.createElement('img');
  img.src = blobUrl;
  img.alt = `${finalistTitle} - Finalist Share Image`;
  img.className = 'w-full h-full object-cover';
  img.style.cursor = 'pointer';
  img.title = 'Right-click to download';

  // Add right-click handler for download
  img.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (onRightClick) {
      onRightClick(e);
    } else {
      downloadImage(blobUrl, finalistTitle);
    }
  });

  return img;
}

/**
 * Download an image with a clean filename
 */
export function downloadImage(blobUrl: string, finalistTitle: string, suffix = 'finalist_share'): void {
  const filename = `${sanitizeFilename(finalistTitle)}_${suffix}.png`;
  
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFilename(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Revoke a blob URL to free memory
 */
export function revokeBlobUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Get proxy URL for cross-origin images
 */
export function getProxyImageUrl(imageUrl: string): string {
  return `/api/proxy-image/?url=${encodeURIComponent(imageUrl)}`;
}

