/**
 * Cloudflare R2 Image Helper
 *
 * This module provides utility functions for working with images stored in Cloudflare R2.
 * Images should be uploaded to your R2 bucket via the Cloudflare dashboard or API.
 */

const R2_PUBLIC_URL = import.meta.env.PUBLIC_R2_PUBLIC_URL || '';

/**
 * Get the full URL for an image stored in R2
 * @param path - The path to the image in your R2 bucket (e.g., '2024_Photos/event.jpg')
 * @returns The full public URL to the image
 */
export function getR2ImageUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Ensure R2_PUBLIC_URL doesn't end with slash
  const baseUrl = R2_PUBLIC_URL.endsWith('/')
    ? R2_PUBLIC_URL.slice(0, -1)
    : R2_PUBLIC_URL;

  return `${baseUrl}/${cleanPath}`;
}

/**
 * Get an optimized image URL with transformations (if using Cloudflare Images)
 * @param path - The path to the image in your R2 bucket
 * @param options - Transformation options
 * @returns The transformed image URL
 */
export function getOptimizedR2Image(
  path: string,
  options?: {
    width?: number;
    height?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    quality?: number;
  }
): string {
  const baseUrl = getR2ImageUrl(path);

  // If using Cloudflare Image Resizing, append transformation parameters
  // Note: This requires Cloudflare Image Resizing to be enabled
  if (options && Object.keys(options).length > 0) {
    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.format) params.append('format', options.format);
    if (options.quality) params.append('quality', options.quality.toString());

    // For Cloudflare Image Resizing, use /cdn-cgi/image/ prefix
    // This assumes you have it configured
    return `/cdn-cgi/image/${params.toString()}/${baseUrl}`;
  }

  return baseUrl;
}

/**
 * Helper to get responsive image srcset for R2 images
 * @param path - The path to the image in your R2 bucket
 * @param widths - Array of widths to generate
 * @returns srcset string for responsive images
 */
export function getR2ImageSrcSet(path: string, widths: number[] = [320, 640, 960, 1280, 1920]): string {
  return widths
    .map(width => `${getOptimizedR2Image(path, { width })} ${width}w`)
    .join(', ');
}
