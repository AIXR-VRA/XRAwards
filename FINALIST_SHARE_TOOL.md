# Finalist Share Tool

## Overview
The Finalist Share Tool allows users to create shareable images for XR Awards finalists by combining their finalist image with a branded overlay frame.

## Features
- **Compact Design**: Single-page tool with dropdown selection
- **Smart Search**: Type to filter finalists in the dropdown
- **Real-time Preview**: See the combined image with overlay frame instantly
- **Easy Download**: Right-click to save or use the download button
- **Mobile Friendly**: Responsive design that works on all devices

## How to Use

### 1. Access the Tool
Navigate to `/finalist-share` on the website.

### 2. Select a Finalist
- Use the dropdown to choose from 100+ finalists
- Type in the search box to quickly find specific finalists
- Selected finalist info appears below the dropdown

### 3. Preview & Download
- See the combined image with overlay frame on the right
- Right-click the preview to save the image
- Or use the "Download Image" button for automatic download

### 4. Share
- Use the downloaded image on social media
- Tag @AIXR and use relevant hashtags like #XRAwards, #XR, #Finalist

## Technical Details

### Image Processing
- Finalist images are combined with the overlay frame using HTML5 Canvas
- Images are processed client-side for privacy
- Output format: PNG with high quality
- Canvas size: 800x800 pixels

### Overlay Frame
The overlay frame is located at:
```
/images/2025/10/xr_awards_gala_2025_finalist_frame_2024_1760450572001.png
```

### Browser Compatibility
- Modern browsers with Canvas support
- Cross-origin image loading enabled
- Mobile-friendly touch interactions

## File Structure
```
src/pages/finalist-share.astro    # Main page component
```

## Dependencies
- Astro framework
- Supabase for data fetching
- HTML5 Canvas API for image processing
- Tailwind CSS for styling

## Customization
To modify the overlay frame or styling:
1. Update the `overlayFrame` variable in the Astro component
2. Adjust the CSS classes for the preview container
3. Modify the canvas size in the JavaScript section

## Troubleshooting
- **Images not loading**: Check that finalist images are accessible and CORS-enabled
- **Download not working**: Ensure browser allows downloads and popup blockers are disabled
- **Search not working**: Verify JavaScript is enabled in the browser
