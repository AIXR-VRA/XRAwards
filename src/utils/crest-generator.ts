/**
 * Crest Generator Utility
 * Generates accolade and winner crests with text overlays
 */

// Tag IDs for category-based crest selection
export const EU_TAG_ID = 'bf2511f3-267e-4acb-ba79-a6003f715fe3';
export const CROSS_TAG_ID = '348b57c4-66af-4601-a424-499f7497f53f';

export interface CrestConfig {
  baseImageBlack: string;
  baseImageWhite: string;
}

export interface AllCrestConfigs {
  default: CrestConfig;
  eu: CrestConfig;
  shared: CrestConfig;
}

export interface AccoladeData {
  id?: string;
  name: string;
  code?: string;
}

/**
 * Get the correct crest config based on tag IDs
 * @param tagIds - Array of tag IDs from the category
 * @param configs - All crest configs with resolved URLs
 */
export function getCrestConfigForTags(tagIds: string[] = [], configs: AllCrestConfigs): CrestConfig {
  const hasEuTag = tagIds.includes(EU_TAG_ID);
  const hasCrossTag = tagIds.includes(CROSS_TAG_ID);
  
  if (hasCrossTag) {
    return configs.shared;
  } else if (hasEuTag) {
    return configs.eu;
  }
  return configs.default;
}

/**
 * Wrap text to fit within a maximum width
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
 * Ensure Jura font is loaded before rendering
 */
async function ensureFontLoaded(): Promise<void> {
  try {
    await document.fonts.load('bold 72px Jura');
  } catch (e) {
    console.warn('Could not preload Jura font:', e);
  }
}

/**
 * Generate an accolade crest image
 */
export async function generateAccoladeCrest(
  accolade: AccoladeData,
  projectName: string,
  year: string,
  variant: 'black' | 'white',
  config: CrestConfig
): Promise<string> {
  await ensureFontLoaded();

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const size = 800;
    canvas.width = size;
    canvas.height = size;

    // Determine base image URL based on variant
    const baseImageUrl = variant === 'white' ? config.baseImageWhite : config.baseImageBlack;

    // Load base image
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    
    baseImg.onerror = () => {
      reject(new Error('Failed to load base image'));
    };

    baseImg.onload = () => {
      // Use actual image dimensions instead of forcing square
      const imgWidth = baseImg.width;
      const imgHeight = baseImg.height;
      canvas.width = imgWidth;
      canvas.height = imgHeight;

      // Draw the base image at its natural size
      ctx.drawImage(baseImg, 0, 0, imgWidth, imgHeight);

      // Set text color based on variant
      const textColor = variant === 'black' ? '#000000' : '#FFFFFF';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      // Scale font sizes based on image dimensions
      const scaleFactor = imgWidth / 800;

      // "XR ACCOLADE" text at top
      ctx.font = `bold ${32 * scaleFactor}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('XR ACCOLADE', imgWidth * 0.5, imgHeight * 0.05);

      // Accolade name (centered, can wrap)
      ctx.font = `bold ${36 * scaleFactor}px sans-serif`;
      ctx.textBaseline = 'top';
      const accoladeName = (accolade.name || '').toUpperCase();
      const accoladeLines = wrapText(ctx, accoladeName, imgWidth * 0.75);
      accoladeLines.forEach((line, index) => {
        ctx.fillText(line, imgWidth * 0.5, imgHeight * 0.50 + (index * 40 * scaleFactor));
      });

      // Project name (below accolade name)
      const projectNameUpper = projectName.toUpperCase();
      const projectFontSize = projectNameUpper.length > 33 ? 20 : 24;
      ctx.font = `${projectFontSize * scaleFactor}px sans-serif`;
      const projectLines = wrapText(ctx, projectNameUpper, imgWidth * 0.8);
      const accoladeHeight = accoladeLines.length * 40 * scaleFactor;
      const projectLineHeight = projectNameUpper.length > 33 ? 24 : 28;
      projectLines.forEach((line, index) => {
        ctx.fillText(line, imgWidth * 0.5, imgHeight * 0.50 + accoladeHeight + (15 * scaleFactor) + (index * projectLineHeight * scaleFactor));
      });

      // Year at bottom (using Jura font)
      ctx.font = `bold ${72 * scaleFactor}px Jura, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(year, imgWidth * 0.5, imgHeight * 0.86);

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    // Use proxy for base image to handle CORS
    const proxyUrl = `/api/proxy-image/?url=${encodeURIComponent(baseImageUrl)}`;
    baseImg.src = proxyUrl;
  });
}

/**
 * Generate a finalist crest image
 */
export async function generateFinalistCrest(
  categoryName: string,
  projectName: string,
  year: string,
  variant: 'black' | 'white',
  config: CrestConfig
): Promise<string> {
  await ensureFontLoaded();

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const size = 800;
    canvas.width = size;
    canvas.height = size;

    // Determine base image URL based on variant
    const baseImageUrl = variant === 'white' ? config.baseImageWhite : config.baseImageBlack;

    // Load base image
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    
    baseImg.onerror = () => {
      reject(new Error('Failed to load base image'));
    };

    baseImg.onload = () => {
      // Use actual image dimensions instead of forcing square
      const imgWidth = baseImg.width;
      const imgHeight = baseImg.height;
      canvas.width = imgWidth;
      canvas.height = imgHeight;

      // Draw the base image at its natural size
      ctx.drawImage(baseImg, 0, 0, imgWidth, imgHeight);

      // Set text color based on variant
      const textColor = variant === 'black' ? '#000000' : '#FFFFFF';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      // Scale font sizes based on image dimensions
      const scaleFactor = imgWidth / 800;

      // "FINALIST" text at top
      ctx.font = `bold ${32 * scaleFactor}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('FINALIST', imgWidth * 0.5, imgHeight * 0.05);

      // Category name (centered, can wrap)
      ctx.font = `bold ${36 * scaleFactor}px sans-serif`;
      ctx.textBaseline = 'top';
      const categoryUpper = (categoryName || '').toUpperCase();
      const categoryLines = wrapText(ctx, categoryUpper, imgWidth * 0.75);
      categoryLines.forEach((line, index) => {
        ctx.fillText(line, imgWidth * 0.5, imgHeight * 0.50 + (index * 40 * scaleFactor));
      });

      // Project name (below category name)
      const projectNameUpper = projectName.toUpperCase();
      const projectFontSize = projectNameUpper.length > 33 ? 20 : 24;
      ctx.font = `${projectFontSize * scaleFactor}px sans-serif`;
      const projectLines = wrapText(ctx, projectNameUpper, imgWidth * 0.8);
      const categoryHeight = categoryLines.length * 40 * scaleFactor;
      const projectLineHeight = projectNameUpper.length > 33 ? 24 : 28;
      projectLines.forEach((line, index) => {
        ctx.fillText(line, imgWidth * 0.5, imgHeight * 0.50 + categoryHeight + (15 * scaleFactor) + (index * projectLineHeight * scaleFactor));
      });

      // Year at bottom (using Jura font)
      ctx.font = `bold ${72 * scaleFactor}px Jura, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(year, imgWidth * 0.5, imgHeight * 0.86);

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    // Use proxy for base image to handle CORS
    const proxyUrl = `/api/proxy-image/?url=${encodeURIComponent(baseImageUrl)}`;
    baseImg.src = proxyUrl;
  });
}

/**
 * Generate a winner crest image
 */
export async function generateWinnerCrest(
  categoryName: string,
  projectName: string,
  year: string,
  variant: 'black' | 'white',
  config: CrestConfig
): Promise<string> {
  await ensureFontLoaded();

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const size = 800;
    canvas.width = size;
    canvas.height = size;

    // Determine base image URL based on variant
    const baseImageUrl = variant === 'white' ? config.baseImageWhite : config.baseImageBlack;

    // Load base image
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    
    baseImg.onerror = () => {
      reject(new Error('Failed to load base image'));
    };

    baseImg.onload = () => {
      // Use actual image dimensions instead of forcing square
      const imgWidth = baseImg.width;
      const imgHeight = baseImg.height;
      canvas.width = imgWidth;
      canvas.height = imgHeight;

      // Draw the base image at its natural size
      ctx.drawImage(baseImg, 0, 0, imgWidth, imgHeight);

      // Set text color based on variant
      const textColor = variant === 'black' ? '#000000' : '#FFFFFF';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      // Scale font sizes based on image dimensions
      const scaleFactor = imgWidth / 800;

      // "WINNER" text at top
      ctx.font = `bold ${32 * scaleFactor}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('WINNER', imgWidth * 0.5, imgHeight * 0.05);

      // Category name (centered, can wrap)
      ctx.font = `bold ${36 * scaleFactor}px sans-serif`;
      ctx.textBaseline = 'top';
      const categoryUpper = (categoryName || '').toUpperCase();
      const categoryLines = wrapText(ctx, categoryUpper, imgWidth * 0.75);
      categoryLines.forEach((line, index) => {
        ctx.fillText(line, imgWidth * 0.5, imgHeight * 0.50 + (index * 40 * scaleFactor));
      });

      // Project name (below category name)
      const projectNameUpper = projectName.toUpperCase();
      const projectFontSize = projectNameUpper.length > 33 ? 20 : 24;
      ctx.font = `${projectFontSize * scaleFactor}px sans-serif`;
      const projectLines = wrapText(ctx, projectNameUpper, imgWidth * 0.8);
      const categoryHeight = categoryLines.length * 40 * scaleFactor;
      const projectLineHeight = projectNameUpper.length > 33 ? 24 : 28;
      projectLines.forEach((line, index) => {
        ctx.fillText(line, imgWidth * 0.5, imgHeight * 0.50 + categoryHeight + (15 * scaleFactor) + (index * projectLineHeight * scaleFactor));
      });

      // Year at bottom (using Jura font)
      ctx.font = `bold ${72 * scaleFactor}px Jura, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(year, imgWidth * 0.5, imgHeight * 0.86);

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };

    // Use proxy for base image to handle CORS
    const proxyUrl = `/api/proxy-image/?url=${encodeURIComponent(baseImageUrl)}`;
    baseImg.src = proxyUrl;
  });
}

/**
 * Generate both black and white versions of an accolade crest
 */
export async function generateAccoladeCrests(
  accolade: AccoladeData,
  projectName: string,
  year: string,
  config: CrestConfig
): Promise<{ black: string; white: string }> {
  const [black, white] = await Promise.all([
    generateAccoladeCrest(accolade, projectName, year, 'black', config),
    generateAccoladeCrest(accolade, projectName, year, 'white', config)
  ]);
  return { black, white };
}

/**
 * Generate both black and white versions of a finalist crest
 */
export async function generateFinalistCrests(
  categoryName: string,
  projectName: string,
  year: string,
  config: CrestConfig
): Promise<{ black: string; white: string }> {
  const [black, white] = await Promise.all([
    generateFinalistCrest(categoryName, projectName, year, 'black', config),
    generateFinalistCrest(categoryName, projectName, year, 'white', config)
  ]);
  return { black, white };
}

/**
 * Generate both black and white versions of a winner crest
 */
export async function generateWinnerCrests(
  categoryName: string,
  projectName: string,
  year: string,
  config: CrestConfig
): Promise<{ black: string; white: string }> {
  const [black, white] = await Promise.all([
    generateWinnerCrest(categoryName, projectName, year, 'black', config),
    generateWinnerCrest(categoryName, projectName, year, 'white', config)
  ]);
  return { black, white };
}

/**
 * Clean up blob URLs to prevent memory leaks
 */
export function cleanupBlobUrls(container: HTMLElement | null): void {
  if (!container) return;
  container.querySelectorAll('img').forEach(img => {
    if (img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
  });
}

