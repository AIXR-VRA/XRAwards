# Cloudflare R2 Setup for Image Storage

This project uses Cloudflare R2 for image storage. Follow these steps to set it up.

## 1. Create R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name your bucket (e.g., `xr-awards-images`)
5. Click **Create bucket**

## 2. Configure Public Access

You have two options for serving images:

### Option A: R2.dev Subdomain (Easiest)
1. In your bucket settings, go to **Settings**
2. Under **Public access**, click **Allow Access**
3. Copy the public bucket URL (e.g., `https://your-bucket.r2.dev`)

### Option B: Custom Domain (Recommended for production)
1. In your bucket settings, go to **Settings**
2. Under **Custom Domains**, click **Connect Domain**
3. Enter your custom domain (e.g., `images.yoursite.com`)
4. Add the provided DNS records to your domain
5. Wait for DNS propagation

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `PUBLIC_R2_PUBLIC_URL` in `.env`:
   ```
   PUBLIC_R2_PUBLIC_URL=https://your-bucket.r2.dev
   # Or with custom domain:
   PUBLIC_R2_PUBLIC_URL=https://images.yoursite.com
   ```

3. Add the same variable to your GitHub Secrets for CI/CD:
   - Go to your repository **Settings** → **Secrets and variables** → **Actions**
   - Add `PUBLIC_R2_PUBLIC_URL` with your R2 URL

## 4. Upload Images to R2

### Using Cloudflare Dashboard
1. Go to your R2 bucket
2. Click **Upload**
3. Drag and drop your images
4. Organize them in folders (e.g., `2024_Photos/`, `logos/`)

### Using Wrangler CLI (Advanced)
```bash
# Install wrangler if not already installed
npm install -g wrangler

# Upload a file
wrangler r2 object put xr-awards-images/2024_Photos/event.jpg --file ./local-image.jpg

# Upload a folder
wrangler r2 object put xr-awards-images/logos/ --file ./logos/* --recursive
```

## 5. Using R2 Images in Your Code

### Using the R2Image Component

```astro
---
import R2Image from '../components/R2Image.astro';
---

<!-- Simple usage -->
<R2Image
  src="2024_Photos/event.jpg"
  alt="Event photo"
/>

<!-- With custom sizing -->
<R2Image
  src="logos/company-logo.png"
  alt="Company Logo"
  width={200}
  height={100}
  class="mx-auto"
/>

<!-- Eager loading for above-the-fold images -->
<R2Image
  src="2024_Photos/hero.jpg"
  alt="Hero image"
  loading="eager"
/>
```

### Using the Helper Functions Directly

```typescript
import { getR2ImageUrl, getOptimizedR2Image, getR2ImageSrcSet } from '../utils/r2';

// Get simple URL
const imageUrl = getR2ImageUrl('2024_Photos/event.jpg');

// Get optimized URL (requires Cloudflare Image Resizing)
const optimizedUrl = getOptimizedR2Image('2024_Photos/event.jpg', {
  width: 800,
  quality: 85,
  format: 'webp'
});

// Get responsive srcset
const srcSet = getR2ImageSrcSet('2024_Photos/event.jpg');
```

## 6. Migrating Existing Images

To migrate images from `public/` to R2:

1. Upload your existing images from `public/2023_photos/`, `public/2024_Photos/`, etc. to R2
2. Keep the same folder structure in R2
3. Update your code to use `<R2Image>` component or R2 helper functions
4. Test thoroughly before removing files from `public/`

## 7. Enable Cloudflare Image Resizing (Optional)

For automatic image optimization and resizing:

1. Go to your Cloudflare dashboard
2. Navigate to **Speed** → **Optimization** → **Image Resizing**
3. Enable Image Resizing
4. The `getOptimizedR2Image()` function will now work with transformations

## Notes

- R2 storage is free for the first 10 GB
- Bandwidth is charged at $0.36/GB
- Consider using a custom domain for better branding and control
- Images are served via CDN for fast global delivery