# Media Library System Setup

This document explains how to set up and use the new media library system that integrates Supabase with Cloudflare R2 storage.

## Overview

The media library system provides:
- **Centralized media management** with metadata storage in Supabase
- **Cloudflare R2 storage** for cost-effective file storage
- **Flexible relationships** linking media to events, categories, finalists, sponsors, and tags
- **Edge Functions** for secure uploads only (retrieval via direct database queries)
- **React components** for easy integration

## Database Schema

### Core Tables

1. **`media_library`** - Main media table storing file metadata
2. **`media_events`** - Links media to events
3. **`media_categories`** - Links media to categories  
4. **`media_finalists`** - Links media to finalists
5. **`media_sponsors`** - Links media to sponsors
6. **`media_tags`** - Links media to tags

### Key Features

- **File metadata**: filename, original filename, file path, URL, size, MIME type
- **Accessibility**: alt text support
- **Organization**: title and description fields
- **Privacy**: public/private visibility control
- **Relationships**: flexible many-to-many linking to other entities
- **Search**: full-text search across metadata

## Environment Variables

Add these to your `.env` file:

```env
# R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
PUBLIC_R2_PUBLIC_URL=https://your-bucket.your-domain.com

# Supabase Configuration (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Setup Steps

### 1. Run Database Migration

```bash
# Apply the media library migration
supabase db push
```

### 2. Deploy Edge Functions

```bash
# Deploy the upload-media function
supabase functions deploy upload-media
```

### 3. Set Edge Function Secrets

```bash
# Set R2 credentials for the upload-media edge function only
supabase secrets set R2_ACCOUNT_ID=your_account_id
supabase secrets set R2_ACCESS_KEY_ID=your_access_key
supabase secrets set R2_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set R2_BUCKET_NAME=your_bucket_name
supabase secrets set PUBLIC_R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

**Note**: These secrets are only needed for the `upload-media` edge function. Media retrieval uses direct database queries and doesn't require these credentials.

## Usage

### Frontend Integration

```tsx
import { MediaLibrary } from '../components/MediaLibrary';
import { uploadMedia, getMedia } from '../utils/media-library';

// Use the MediaLibrary component
<MediaLibrary
  onMediaSelect={(media) => console.log('Selected:', media)}
  allowUpload={true}
  allowEdit={true}
  allowDelete={true}
  filterBy={{ categoryIds: ['category-id'] }}
  mimeTypes={['image/jpeg', 'image/png']}
/>
```

### Programmatic Usage

```typescript
import { uploadMedia, getMedia, searchMedia } from '../utils/media-library';

// Upload a file
const result = await uploadMedia({
  file: fileObject,
  altText: 'Description of the image',
  title: 'My Image',
  description: 'Optional description',
  isPublic: true,
  categoryIds: ['category-id'],
  tagIds: ['tag-id']
});

// Get media by category
const media = await getMediaByCategory('category-id');

// Search media
const results = await searchMedia({
  searchTerm: 'keyword',
  mimeTypes: ['image/jpeg'],
  limit: 20
});
```

## API Reference

### Upload Media

**Endpoint**: `POST /functions/v1/upload-media`

**Request Body**:
```json
{
  "file": "base64_encoded_file",
  "filename": "original_filename.jpg",
  "mimeType": "image/jpeg",
  "altText": "Alt text for accessibility",
  "title": "Optional title",
  "description": "Optional description",
  "isPublic": true,
  "eventIds": ["event-id-1", "event-id-2"],
  "categoryIds": ["category-id-1"],
  "finalistIds": ["finalist-id-1"],
  "sponsorIds": ["sponsor-id-1"],
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

**Response**:
```json
{
  "success": true,
  "mediaId": "uuid",
  "fileUrl": "https://your-bucket.domain.com/path/to/file.jpg"
}
```

### Get Media

**Endpoint**: `POST /functions/v1/get-media`

**Request Body**:
```json
{
  "mediaId": "uuid", // Optional: get specific media
  "eventIds": ["event-id"],
  "categoryIds": ["category-id"],
  "finalistIds": ["finalist-id"],
  "sponsorIds": ["sponsor-id"],
  "tagIds": ["tag-id"],
  "mimeTypes": ["image/jpeg", "image/png"],
  "searchTerm": "keyword",
  "limit": 50,
  "offset": 0
}
```

**Response**:
```json
{
  "success": true,
  "media": [
    {
      "id": "uuid",
      "filename": "safe_filename.jpg",
      "original_filename": "Original Name.jpg",
      "file_url": "https://your-bucket.domain.com/path/to/file.jpg",
      "alt_text": "Alt text",
      "title": "Title",
      "description": "Description",
      "mime_type": "image/jpeg",
      "file_size": 123456,
      "upload_date": "2024-01-01T00:00:00Z",
      "events": [...],
      "categories": [...],
      "finalists": [...],
      "sponsors": [...],
      "tags": [...]
    }
  ],
  "totalCount": 100
}
```

## File Organization

Files are automatically organized in R2 by type:
- `images/` - Image files (JPEG, PNG, WebP, GIF, SVG)
- `videos/` - Video files (MP4, WebM, MOV, AVI)
- `audio/` - Audio files (MP3, WAV, OGG)
- `documents/` - PDF and other documents
- `media/` - Other file types

## Security

- **Row Level Security (RLS)** is enabled on all tables
- **Public read access** for public media
- **Authenticated users** can manage all media
- **Edge Functions** handle secure uploads with proper validation
- **File type validation** prevents malicious uploads

## Performance

- **Indexed queries** for fast searches
- **Pagination** support for large media libraries
- **Relationship queries** are optimized with proper indexes
- **CDN delivery** through Cloudflare R2

## Migration from Old System

If you have existing media in R2, you can:

1. **Bulk import** existing files using a migration script
2. **Update references** in your code to use the new media library
3. **Gradually migrate** as you add new media

## Troubleshooting

### Common Issues

1. **Upload fails**: Check R2 credentials and bucket permissions
2. **Edge function errors**: Verify all secrets are set correctly
3. **Database errors**: Ensure migration was applied successfully
4. **CORS issues**: Check that CORS is configured for your domain

### Debugging

- Check Supabase logs for edge function errors
- Verify R2 bucket has public read access
- Ensure all environment variables are set correctly
- Test with small files first

## Future Enhancements

- **Image optimization** with Cloudflare Image Resizing
- **Bulk operations** for managing multiple files
- **Version control** for media updates
- **Usage analytics** and reporting
- **Advanced search** with filters and sorting
