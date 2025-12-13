/**
 * Finalist Image Generator Utility
 * Generates social share images with finalist/winner branding
 */

export type AspectRatio = 'square' | 'landscape' | 'portrait';

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
  aspectRatio?: AspectRatio; // 'square' (1:1), 'landscape' (16:9), 'portrait' (9:16)
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
 * Get canvas dimensions based on aspect ratio
 */
function getCanvasDimensions(size: number, aspectRatio: AspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case 'landscape':
      return { width: size, height: Math.round(size * 9 / 16) }; // 16:9
    case 'portrait':
      return { width: size, height: Math.round(size * 16 / 9) }; // 9:16
    case 'square':
    default:
      return { width: size, height: size }; // 1:1
  }
}

/**
 * Apply blur to a canvas
 */
function applyBlur(ctx: CanvasRenderingContext2D, width: number, height: number, radius: number): void {
  ctx.filter = `blur(${radius}px)`;
  // Draw the current content back with blur
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
  ctx.filter = 'none';
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
    size = 800,
    aspectRatio = 'square'
  } = config;

  await ensureFontsLoaded();

  // Get canvas dimensions based on aspect ratio
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(size, aspectRatio);

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Load images in parallel
  const imagePromises: Promise<HTMLImageElement>[] = [
    loadImage(finalistImageUrl),
    loadImage(logoUrl)
  ];
  if (secondLogoUrl) {
    imagePromises.push(loadImage(secondLogoUrl));
  }
  const [finalistImg, logoImg, secondLogoImg] = await Promise.all(imagePromises);

  // For non-square ratios, draw blurred background first
  if (aspectRatio !== 'square') {
    // Draw blurred full-bleed background
    const bgImgAspect = finalistImg.width / finalistImg.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let bgWidth, bgHeight, bgX, bgY;
    
    if (bgImgAspect > canvasAspect) {
      bgHeight = canvasHeight;
      bgWidth = canvasHeight * bgImgAspect;
      bgX = (canvasWidth - bgWidth) / 2;
      bgY = 0;
    } else {
      bgWidth = canvasWidth;
      bgHeight = canvasWidth / bgImgAspect;
      bgX = 0;
      bgY = (canvasHeight - bgHeight) / 2;
    }
    
    // Draw with blur filter
    ctx.filter = 'blur(25px)';
    ctx.drawImage(finalistImg, bgX - 30, bgY - 30, bgWidth + 60, bgHeight + 60);
    ctx.filter = 'none';
    
    // Add dark overlay for blurred background
    ctx.fillStyle = 'rgba(14, 16, 34, 0.75)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // === DRAW MAIN IMAGE ===
  // For square: full canvas. For landscape: left side. For portrait: centered square overlay
  let mainImgSize: number;
  let mainImgX: number;
  let mainImgY: number;
  
  if (aspectRatio === 'square') {
    mainImgSize = size;
    mainImgX = 0;
    mainImgY = 0;
  } else if (aspectRatio === 'landscape') {
    // Square image on the LEFT side of landscape canvas (smaller to leave room for centered logo)
    const padding = Math.round(canvasHeight * 0.12);
    mainImgSize = Math.round(canvasHeight * 0.6);
    mainImgX = padding;
    mainImgY = padding;
  } else {
    // Portrait: square image in upper portion
    mainImgSize = Math.round(canvasWidth * 0.85);
    mainImgX = (canvasWidth - mainImgSize) / 2;
    mainImgY = canvasHeight * 0.08;
  }

  // Calculate how to cover the main image area while maintaining aspect ratio
  const imgAspect = finalistImg.width / finalistImg.height;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imgAspect > 1) {
    // Image is wider - fit height, crop width
    drawHeight = mainImgSize;
    drawWidth = mainImgSize * imgAspect;
    drawX = mainImgX + (mainImgSize - drawWidth) / 2;
    drawY = mainImgY;
  } else {
    // Image is taller - fit width, crop height
    drawWidth = mainImgSize;
    drawHeight = mainImgSize / imgAspect;
    drawX = mainImgX;
    drawY = mainImgY + (mainImgSize - drawHeight) / 2;
  }

  // For non-square, clip to rounded rectangle
  if (aspectRatio !== 'square') {
    ctx.save();
    const radius = 16;
    ctx.beginPath();
    ctx.moveTo(mainImgX + radius, mainImgY);
    ctx.lineTo(mainImgX + mainImgSize - radius, mainImgY);
    ctx.quadraticCurveTo(mainImgX + mainImgSize, mainImgY, mainImgX + mainImgSize, mainImgY + radius);
    ctx.lineTo(mainImgX + mainImgSize, mainImgY + mainImgSize - radius);
    ctx.quadraticCurveTo(mainImgX + mainImgSize, mainImgY + mainImgSize, mainImgX + mainImgSize - radius, mainImgY + mainImgSize);
    ctx.lineTo(mainImgX + radius, mainImgY + mainImgSize);
    ctx.quadraticCurveTo(mainImgX, mainImgY + mainImgSize, mainImgX, mainImgY + mainImgSize - radius);
    ctx.lineTo(mainImgX, mainImgY + radius);
    ctx.quadraticCurveTo(mainImgX, mainImgY, mainImgX + radius, mainImgY);
    ctx.closePath();
    ctx.clip();
  }
  
  // Draw the main image
  ctx.drawImage(finalistImg, drawX, drawY, drawWidth, drawHeight);
  
  if (aspectRatio !== 'square') {
    ctx.restore();
  }

  // === DARK OVERLAY GRADIENT (for square only - non-square already has overlay) ===
  if (aspectRatio === 'square') {
    const overlay = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    overlay.addColorStop(0, 'rgba(14, 16, 34, 0.9)');
    overlay.addColorStop(0.3, 'rgba(14, 16, 34, 0.65)');
    overlay.addColorStop(0.5, 'rgba(14, 16, 34, 0.6)');
    overlay.addColorStop(0.7, 'rgba(14, 16, 34, 0.65)');
    overlay.addColorStop(1, 'rgba(14, 16, 34, 0.92)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else if (aspectRatio === 'portrait') {
    // Add subtle gradient overlay on the main image for text readability (portrait only)
    ctx.save();
    const radius = 16;
    ctx.beginPath();
    ctx.moveTo(mainImgX + radius, mainImgY);
    ctx.lineTo(mainImgX + mainImgSize - radius, mainImgY);
    ctx.quadraticCurveTo(mainImgX + mainImgSize, mainImgY, mainImgX + mainImgSize, mainImgY + radius);
    ctx.lineTo(mainImgX + mainImgSize, mainImgY + mainImgSize - radius);
    ctx.quadraticCurveTo(mainImgX + mainImgSize, mainImgY + mainImgSize, mainImgX + mainImgSize - radius, mainImgY + mainImgSize);
    ctx.lineTo(mainImgX + radius, mainImgY + mainImgSize);
    ctx.quadraticCurveTo(mainImgX, mainImgY + mainImgSize, mainImgX, mainImgY + mainImgSize - radius);
    ctx.lineTo(mainImgX, mainImgY + radius);
    ctx.quadraticCurveTo(mainImgX, mainImgY, mainImgX + radius, mainImgY);
    ctx.closePath();
    ctx.clip();
    const imgOverlay = ctx.createLinearGradient(mainImgX, mainImgY, mainImgX, mainImgY + mainImgSize);
    imgOverlay.addColorStop(0, 'rgba(14, 16, 34, 0.85)');
    imgOverlay.addColorStop(0.25, 'rgba(14, 16, 34, 0.5)');
    imgOverlay.addColorStop(0.5, 'rgba(14, 16, 34, 0.4)');
    imgOverlay.addColorStop(0.75, 'rgba(14, 16, 34, 0.5)');
    imgOverlay.addColorStop(1, 'rgba(14, 16, 34, 0.85)');
    ctx.fillStyle = imgOverlay;
    ctx.fillRect(mainImgX, mainImgY, mainImgSize, mainImgSize);
    ctx.restore();
  }
  // Landscape: no overlay on image - text is on the right side

  // Calculate text positioning based on aspect ratio
  let textCenterX: number;
  let textAreaTop: number;
  let textAreaCenter: number;
  let textMaxWidth: number;
  let textScale: number;
  let textAlign: CanvasTextAlign = 'center';
  
  if (aspectRatio === 'square') {
    textCenterX = canvasWidth / 2;
    textAreaTop = 50;
    textAreaCenter = canvasHeight / 2;
    textMaxWidth = canvasWidth * 0.85;
    textScale = 1;
  } else if (aspectRatio === 'landscape') {
    // Text on the RIGHT side of the image
    const textAreaLeft = mainImgX + mainImgSize + 25;
    const textAreaRight = canvasWidth - 25;
    textCenterX = textAreaLeft + (textAreaRight - textAreaLeft) / 2;
    textAreaTop = mainImgY;
    textAreaCenter = mainImgY + mainImgSize / 2;
    textMaxWidth = textAreaRight - textAreaLeft - 10;
    textScale = 0.65; // Adjusted text scale for landscape side panel
  } else {
    // Portrait
    textCenterX = mainImgX + mainImgSize / 2;
    textAreaTop = mainImgY + 35;
    textAreaCenter = mainImgY + mainImgSize / 2;
    textMaxWidth = mainImgSize * 0.85;
    textScale = (mainImgSize / size) * 1.1;
  }

  // === CATEGORY NAME (big, at top) ===
  const categoryOnly = category.toUpperCase();
  
  // Use larger scale for category/status in landscape mode
  const headerScale = aspectRatio === 'landscape' ? textScale * 1.2 : textScale;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `bold ${Math.round(32 * headerScale)}px Jura, Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(categoryOnly, textCenterX, textAreaTop);

  // === STATUS + YEAR (below category, IBM Plex Mono regular) ===
  const statusText = isWinner ? 'WINNER' : 'FINALIST';
  const statusWithYear = `${year} ${statusText}`;
  
  ctx.font = `400 ${Math.round(32 * headerScale)}px "IBM Plex Mono", monospace`;
  ctx.fillStyle = isWinner ? '#E91E8C' : '#00D4D8';
  ctx.fillText(statusWithYear, textCenterX, textAreaTop + Math.round(42 * headerScale));

  // === DECORATIVE DOTS (below the text group) ===
  const dotY = textAreaTop + Math.round(95 * headerScale);
  const dotSpacing = Math.round(12 * headerScale);
  const dotRadius = Math.round(3 * headerScale);
  ctx.fillStyle = '#00D4D8';
  
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(textCenterX + (i * dotSpacing), dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // === PROJECT TITLE (CENTERED) - Using Jura font, bigger and bold ===
  ctx.fillStyle = '#ffffff';
  
  // Use larger Jura for project name
  const baseTitleFontSize = title.length > 35 ? 40 : (title.length > 25 ? 48 : 56);
  const titleFontSize = Math.round(baseTitleFontSize * textScale);
  ctx.font = `bold ${titleFontSize}px Jura, Helvetica, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  
  // Wrap title if needed
  const titleLines = wrapText(ctx, title, textMaxWidth);
  const titleLineHeight = titleFontSize * 1.25;
  
  // Calculate total height of title block + organization
  const orgText = organization ? `by ${organization}` : '';
  const orgLineCount = orgText.length > 50 ? Math.ceil(orgText.length / 50) : 1;
  const orgHeight = organization ? (Math.round(30 * textScale) + (orgLineCount * Math.round(30 * textScale))) : 0;
  const titleBlockHeight = (titleLines.length * titleLineHeight) + orgHeight;
  
  // Center the title block vertically
  const titleStartY = textAreaCenter - (titleBlockHeight / 2) + (titleLineHeight / 2);
  
  titleLines.forEach((line, index) => {
    ctx.fillText(line, textCenterX, titleStartY + (index * titleLineHeight));
  });

  // === ORGANIZATION - Using Jura ===
  if (organization) {
    // Use larger scale for organization in landscape mode
    const orgScale = aspectRatio === 'landscape' ? textScale * 1.15 : textScale;
    const orgY = titleStartY + (titleLines.length * titleLineHeight) + Math.round(30 * textScale);
    ctx.font = `500 ${Math.round(24 * orgScale)}px Jura, Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#c8d4e4';
    ctx.textBaseline = 'middle';
    
    const orgTextStr = `by ${organization}`;
    
    // Wrap after adjusted character count
    const maxChars = aspectRatio === 'landscape' ? 30 : Math.round(50 * textScale);
    if (orgTextStr.length > maxChars) {
      const orgLines: string[] = [];
      let remaining = orgTextStr;
      while (remaining.length > maxChars) {
        let breakPoint = remaining.lastIndexOf(' ', maxChars);
        if (breakPoint === -1) breakPoint = maxChars;
        orgLines.push(remaining.substring(0, breakPoint));
        remaining = remaining.substring(breakPoint).trim();
      }
      if (remaining) orgLines.push(remaining);
      
      const orgLineHeight = Math.round(30 * orgScale);
      orgLines.forEach((line, index) => {
        ctx.fillText(line, textCenterX, orgY + (index * orgLineHeight));
      });
    } else {
      ctx.fillText(orgTextStr, textCenterX, orgY);
    }
  }

  // === LOGO ===
  // For portrait: logo goes below the image. For landscape: on the right side. For square: at bottom
  const logoMaxHeight = aspectRatio === 'landscape' ? 45 : Math.round(65 * textScale);
  const logoBottomPadding = aspectRatio === 'square' ? 50 : (aspectRatio === 'landscape' ? 25 : Math.round(35 * textScale));
  const logoAreaBottom = aspectRatio === 'portrait' ? canvasHeight - 40 : (aspectRatio === 'square' ? canvasHeight : canvasHeight - 10);
  
  // Calculate logo area width based on aspect ratio
  let logoAreaWidth: number;
  let logoAreaCenterX: number;
  
  if (aspectRatio === 'square') {
    logoAreaWidth = canvasWidth;
    logoAreaCenterX = canvasWidth / 2;
  } else if (aspectRatio === 'landscape') {
    // Logo centered on the whole canvas
    logoAreaWidth = canvasWidth * 0.5;
    logoAreaCenterX = canvasWidth / 2;
  } else {
    // Portrait
    logoAreaWidth = mainImgSize;
    logoAreaCenterX = mainImgX + mainImgSize / 2;
  }
  
  if (secondLogoImg) {
    // Two logos side by side
    const logo1MaxWidth = logoAreaWidth * 0.45;
    const logo2MaxWidth = logoAreaWidth * 0.38;
    const logoGap = Math.round(50 * textScale);
    
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
    const startX = logoAreaCenterX - totalWidth / 2;
    const logo1Y = logoAreaBottom - Math.max(logo1H, logo2H) - logoBottomPadding + (Math.max(logo1H, logo2H) - logo1H) / 2;
    const logo2Y = logoAreaBottom - Math.max(logo1H, logo2H) - logoBottomPadding + (Math.max(logo1H, logo2H) - logo2H) / 2;
    
    ctx.drawImage(logoImg, startX, logo1Y, logo1W, logo1H);
    ctx.drawImage(secondLogoImg, startX + logo1W + logoGap, logo2Y, logo2W, logo2H);
  } else {
    // Single logo centered
    const singleLogoMaxWidth = isEuOnly ? logoAreaWidth * 0.8 : logoAreaWidth * 0.7;
    const singleLogoMaxHeight = isEuOnly ? Math.round(85 * textScale) : logoMaxHeight;
    const logoAspect = logoImg.width / logoImg.height;
    
    let logoW, logoH;
    if (logoAspect > (singleLogoMaxWidth / singleLogoMaxHeight)) {
      logoW = singleLogoMaxWidth;
      logoH = singleLogoMaxWidth / logoAspect;
    } else {
      logoH = singleLogoMaxHeight;
      logoW = singleLogoMaxHeight * logoAspect;
    }
    
    const logoX = logoAreaCenterX - logoW / 2;
    const logoY = logoAreaBottom - logoH - logoBottomPadding;
    
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
export function downloadImage(blobUrl: string, finalistTitle: string, suffix = 'finalist_share', aspectRatio: AspectRatio = 'square'): void {
  const aspectSuffix = aspectRatio === 'square' ? '1x1' : (aspectRatio === 'landscape' ? '16x9' : '9x16');
  const filename = `${sanitizeFilename(finalistTitle)}_${suffix}_${aspectSuffix}.png`;
  
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
