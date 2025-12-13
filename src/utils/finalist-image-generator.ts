/**
 * Finalist Image Generator Utility
 * Generates social share images with finalist/winner branding
 */

export interface FinalistImageConfig {
  finalistImageUrl: string;
  logoUrl: string;
  secondLogoUrl?: string; // For cross-category (both logos side by side)
  isEuOnly?: boolean; // For EU-only display (bigger logo)
  title: string;
  organization: string;
  category: string;
  isWinner: boolean;
  year: string;
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
 * Ensure fonts are loaded before rendering
 */
async function ensureFontsLoaded(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('bold 56px Jura'),
      document.fonts.load('500 24px Jura'),
      document.fonts.load('600 18px "IBM Plex Mono"')
    ]);
  } catch (e) {
    console.warn('Could not preload fonts:', e);
  }
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Generate a social share image for finalist/winner
 * Creates a branded image with full-bleed background image and text overlays
 */
export async function generateFinalistImage(config: FinalistImageConfig): Promise<GeneratedImage> {
  const { 
    finalistImageUrl, 
    logoUrl,
    secondLogoUrl,
    isEuOnly = false,
    title, 
    organization, 
    category, 
    isWinner,
    year,
    size = 800 
  } = config;

  await ensureFontsLoaded();

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = size;
  canvas.height = size;

  // Load images in parallel
  const imagePromises: Promise<HTMLImageElement>[] = [
    loadImage(finalistImageUrl),
    loadImage(logoUrl)
  ];
  if (secondLogoUrl) {
    imagePromises.push(loadImage(secondLogoUrl));
  }
  const [finalistImg, logoImg, secondLogoImg] = await Promise.all(imagePromises);

  // === DRAW FULL BACKGROUND IMAGE ===
  // Calculate how to cover the entire canvas while maintaining aspect ratio
  const imgAspect = finalistImg.width / finalistImg.height;
  const canvasAspect = 1; // Square canvas
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imgAspect > canvasAspect) {
    // Image is wider - fit height, crop width
    drawHeight = size;
    drawWidth = size * imgAspect;
    drawX = (size - drawWidth) / 2;
    drawY = 0;
  } else {
    // Image is taller - fit width, crop height
    drawWidth = size;
    drawHeight = size / imgAspect;
    drawX = 0;
    drawY = (size - drawHeight) / 2;
  }
  
  // Draw the background image to cover entire canvas
  ctx.drawImage(finalistImg, drawX, drawY, drawWidth, drawHeight);

  // === DARK OVERLAY GRADIENT ===
  // Add stronger gradient overlay to make text readable
  const overlay = ctx.createLinearGradient(0, 0, 0, size);
  overlay.addColorStop(0, 'rgba(14, 16, 34, 0.9)');
  overlay.addColorStop(0.3, 'rgba(14, 16, 34, 0.65)');
  overlay.addColorStop(0.5, 'rgba(14, 16, 34, 0.6)');
  overlay.addColorStop(0.7, 'rgba(14, 16, 34, 0.65)');
  overlay.addColorStop(1, 'rgba(14, 16, 34, 0.92)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, size, size);

  // === CATEGORY NAME (big, at top - matching bottom logo padding of 50px) ===
  const categoryOnly = category.toUpperCase();
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 32px Jura, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(categoryOnly, size / 2, 50);

  // === STATUS + YEAR (below category, IBM Plex Mono regular, same size as category) ===
  const statusText = isWinner ? 'WINNER' : 'FINALIST';
  const statusWithYear = `${year} ${statusText}`;
  
  ctx.font = '400 32px "IBM Plex Mono", monospace';
  ctx.fillStyle = isWinner ? '#E91E8C' : '#00D4D8';
  ctx.fillText(statusWithYear, size / 2, 92);

  // === DECORATIVE DOTS (below the text group) ===
  const dotY = 145;
  const dotSpacing = 12;
  const dotRadius = 3;
  ctx.fillStyle = '#00D4D8';
  
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(size / 2 + (i * dotSpacing), dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // === PROJECT TITLE (CENTERED) - Using Jura font, bigger and bold ===
  ctx.fillStyle = '#ffffff';
  
  // Use larger Jura for project name
  const titleFontSize = title.length > 35 ? 40 : (title.length > 25 ? 48 : 56);
  ctx.font = `bold ${titleFontSize}px Jura, Helvetica, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  
  // Wrap title if needed
  const titleLines = wrapText(ctx, title, size * 0.85);
  const titleLineHeight = titleFontSize * 1.25;
  
  // Calculate total height of title block + organization
  // Account for potential wrapping of long org names (wrap at 50 chars)
  const orgText = organization ? `by ${organization}` : '';
  const orgLineCount = orgText.length > 50 ? Math.ceil(orgText.length / 50) : 1;
  const orgHeight = organization ? (30 + (orgLineCount * 30)) : 0;
  const titleBlockHeight = (titleLines.length * titleLineHeight) + orgHeight;
  
  // Center the title block vertically in the canvas
  const titleStartY = (size / 2) - (titleBlockHeight / 2) + (titleLineHeight / 2);
  
  titleLines.forEach((line, index) => {
    ctx.fillText(line, size / 2, titleStartY + (index * titleLineHeight));
  });

  // === ORGANIZATION - Using Jura ===
  if (organization) {
    const orgY = titleStartY + (titleLines.length * titleLineHeight) + 30;
    ctx.font = '500 24px Jura, Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#c8d4e4';
    ctx.textBaseline = 'middle';
    
    const orgTextStr = `by ${organization}`;
    
    // Wrap after 50 characters
    if (orgTextStr.length > 50) {
      const orgLines: string[] = [];
      let remaining = orgTextStr;
      while (remaining.length > 50) {
        // Find last space before 50 chars
        let breakPoint = remaining.lastIndexOf(' ', 50);
        if (breakPoint === -1) breakPoint = 50;
        orgLines.push(remaining.substring(0, breakPoint));
        remaining = remaining.substring(breakPoint).trim();
      }
      if (remaining) orgLines.push(remaining);
      
      const orgLineHeight = 30;
      orgLines.forEach((line, index) => {
        ctx.fillText(line, size / 2, orgY + (index * orgLineHeight));
      });
    } else {
      ctx.fillText(orgTextStr, size / 2, orgY);
    }
  }

  // === LOGO AT BOTTOM ===
  const logoMaxHeight = 65;
  const logoBottomPadding = 50;
  
  if (secondLogoImg) {
    // Two logos side by side
    const logo1MaxWidth = size * 0.45; // XR Awards logo slightly bigger
    const logo2MaxWidth = size * 0.38; // EU logo slightly smaller
    const logoGap = 50; // More space between logos
    
    // Calculate first logo size (XR Awards - bigger)
    const logo1Aspect = logoImg.width / logoImg.height;
    let logo1W, logo1H;
    if (logo1Aspect > (logo1MaxWidth / logoMaxHeight)) {
      logo1W = logo1MaxWidth;
      logo1H = logo1MaxWidth / logo1Aspect;
    } else {
      logo1H = logoMaxHeight;
      logo1W = logoMaxHeight * logo1Aspect;
    }
    
    // Calculate second logo size (EU logo)
    const logo2Aspect = secondLogoImg.width / secondLogoImg.height;
    let logo2W, logo2H;
    if (logo2Aspect > (logo2MaxWidth / logoMaxHeight)) {
      logo2W = logo2MaxWidth;
      logo2H = logo2MaxWidth / logo2Aspect;
    } else {
      logo2H = logoMaxHeight;
      logo2W = logoMaxHeight * logo2Aspect;
    }
    
    // Position logos side by side, centered
    const totalWidth = logo1W + logoGap + logo2W;
    const startX = (size - totalWidth) / 2;
    const logo1Y = size - Math.max(logo1H, logo2H) - logoBottomPadding + (Math.max(logo1H, logo2H) - logo1H) / 2;
    const logo2Y = size - Math.max(logo1H, logo2H) - logoBottomPadding + (Math.max(logo1H, logo2H) - logo2H) / 2;
    
    ctx.drawImage(logoImg, startX, logo1Y, logo1W, logo1H);
    ctx.drawImage(secondLogoImg, startX + logo1W + logoGap, logo2Y, logo2W, logo2H);
  } else {
    // Single logo centered
    // EU logo gets bigger display
    const logoMaxWidth = isEuOnly ? size * 0.8 : size * 0.7;
    const singleLogoMaxHeight = isEuOnly ? 85 : 65;
    const logoAspect = logoImg.width / logoImg.height;
    
    let logoW, logoH;
    if (logoAspect > (logoMaxWidth / singleLogoMaxHeight)) {
      logoW = logoMaxWidth;
      logoH = logoMaxWidth / logoAspect;
    } else {
      logoH = singleLogoMaxHeight;
      logoW = singleLogoMaxHeight * logoAspect;
    }
    
    const logoX = (size - logoW) / 2;
    const logoY = size - logoH - logoBottomPadding;
    
    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
  }

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
