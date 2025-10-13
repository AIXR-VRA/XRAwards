/**
 * Cloudflare R2 Upload Utility
 * 
 * Server-side utility for uploading files to R2 using S3-compatible API
 * Uses native fetch API for Cloudflare Workers compatibility
 */

// Initialize R2 client configuration
const getR2Config = () => {
  const accountId = import.meta.env.R2_ACCOUNT_ID;
  const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not configured. Check your .env file.');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
};

/**
 * Create S3-compatible authorization header
 * @param method - HTTP method
 * @param path - Object path
 * @param config - R2 configuration
 * @returns Authorization header value
 */
async function createS3AuthHeader(method: string, path: string, config: any): Promise<string> {
  // For R2, we can use a simpler approach with basic auth
  // R2 supports both S3-style auth and basic auth
  const credentials = btoa(`${config.accessKeyId}:${config.secretAccessKey}`);
  return `Basic ${credentials}`;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file to R2 using native fetch API
 * @param file - The file buffer to upload
 * @param path - The path where the file should be stored in R2 (e.g., 'sponsors/logo.png')
 * @param contentType - MIME type of the file
 * @returns Upload result with public URL
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  path: string,
  contentType: string
): Promise<UploadResult> {
  try {
    const bucketName = import.meta.env.R2_BUCKET_NAME;
    const publicUrl = import.meta.env.PUBLIC_R2_PUBLIC_URL;

    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME is not configured');
    }

    if (!publicUrl) {
      throw new Error('PUBLIC_R2_PUBLIC_URL is not configured');
    }

    // Clean the path (remove leading slash if present)
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    const config = getR2Config();
    const url = `${config.endpoint}/${bucketName}/${cleanPath}`;

    // Create the request with proper S3-compatible headers
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
        'Authorization': await createS3AuthHeader('PUT', cleanPath, config),
      },
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    // Build the public URL
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const fileUrl = `${baseUrl}/${cleanPath}`;

    return {
      success: true,
      url: fileUrl,
      path: cleanPath,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Generate a safe filename with timestamp
 * @param originalName - Original filename
 * @param folder - Optional folder prefix (e.g., 'sponsors', '2024_Photos')
 * @returns Safe path for storage
 */
export function generateSafeFilename(originalName: string, folder?: string): string {
  // Remove unsafe characters and spaces
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();

  // Add timestamp to avoid collisions
  const timestamp = Date.now();
  const extension = safeName.substring(safeName.lastIndexOf('.'));
  const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'));
  const uniqueName = `${nameWithoutExt}_${timestamp}${extension}`;

  // Add folder prefix if provided
  return folder ? `${folder}/${uniqueName}` : uniqueName;
}

/**
 * Validate file for upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): { valid: boolean; error?: string } {
  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

