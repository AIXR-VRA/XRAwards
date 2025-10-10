# Migration 002: Tags and Category Additional Info

## Overview

This migration adds a powerful tagging system and additional category information capabilities to help organize and filter finalists and categories.

## What's New

### 1. **Tags Table**
A reusable tag system that allows you to create tags once and apply them to multiple items.

**Fields:**
- `id` - Unique identifier
- `name` - Tag name (e.g., "2024", "VR", "Gaming")
- `slug` - URL-friendly version (auto-generated)
- `description` - Optional description
- `created_at`, `updated_at` - Timestamps

**Features:**
- ✅ Auto-generates URL-friendly slugs
- ✅ Prevents duplicate tag names
- ✅ 14 common tags pre-seeded

### 2. **Category Tags** (Many-to-Many)
Link multiple tags to categories for better organization.

**Use Cases:**
- Tag categories by year (2024, 2025)
- Tag by technology (VR, AR, MR)
- Tag by industry (Gaming, Enterprise, Healthcare)
- Filter and group categories dynamically

### 3. **Finalist Tags** (Many-to-Many)
Link multiple tags to finalists for advanced filtering.

**Use Cases:**
- Tag finalists by year
- Tag by platform (Mobile, Standalone, PC)
- Tag by technology stack
- Create dynamic filters on frontend
- Generate "related" finalist suggestions

### 4. **Additional Info on Categories**
New `additional_info` text field on categories.

**Use Cases:**
- Store JSON data for forms
- Add custom fields per category
- Store entry requirements
- Include judging criteria
- Add submission guidelines

## Pre-Seeded Tags

The following tags are automatically created:

**Years:**
- 2024, 2025

**Technologies:**
- VR, AR, MR

**Industries:**
- Gaming, Enterprise, Education, Healthcare

**Features:**
- Innovation, Social, Training, Mobile, Standalone

## API Updates

### Categories API (`/api/categories`)
Now supports:
- `additional_info` (string) - Custom information field
- `tag_ids` (array) - Array of tag IDs to associate

**Example:**
```json
{
  "name": "Best VR Experience",
  "description": "...",
  "additional_info": "Entry fee: $100. Requires video demo.",
  "tag_ids": ["tag-id-1", "tag-id-2"]
}
```

### Finalists API (`/api/finalists`)
Now supports:
- `tag_ids` (array) - Array of tag IDs to associate

**Example:**
```json
{
  "title": "Amazing VR Game",
  "organization": "GameStudio",
  "tag_ids": ["vr-tag-id", "gaming-tag-id", "2024-tag-id"]
}
```

### New Tags API (`/api/tags`)
Manage tags with full CRUD operations:
- `GET` - List all tags
- `POST` - Create new tag
- `PUT` - Update tag
- `DELETE` - Delete tag

## Usage Examples

### Creating a Tag
```javascript
const response = await fetch('/api/tags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Innovative',
    description: 'Cutting-edge technology'
  })
});
```

### Adding Tags to a Category
```javascript
const response = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Best AR Application',
    description: '...',
    tag_ids: ['ar-tag-id', '2024-tag-id']
  })
});
```

### Querying with Tags
Categories and finalists now return tags in their responses:

```javascript
{
  "id": "...",
  "name": "Best VR Experience",
  "tags": [
    { "id": "...", "name": "VR", "slug": "vr" },
    { "id": "...", "name": "2024", "slug": "2024" }
  ]
}
```

## Future Possibilities

With tags in place, you can:

1. **Filter finalists** by tag (e.g., show all VR projects from 2024)
2. **Create tag pages** (e.g., `/tags/vr` shows all VR-related items)
3. **Generate statistics** (e.g., "50% of entries are VR")
4. **Build tag clouds** for visualization
5. **Create "Related Items"** suggestions based on shared tags
6. **Archive old years** while keeping data organized
7. **Multi-dimensional filtering** (Year + Technology + Industry)

## Database Relationships

```
tags (1) ←→ (many) category_tags (many) ←→ (1) categories
tags (1) ←→ (many) finalist_tags (many) ←→ (1) finalists
```

## Migration Steps

1. Run `002_add_tags_and_category_info.sql` in Supabase SQL Editor
2. 14 common tags will be automatically created
3. APIs are already updated to handle tags
4. Admin UI updates (if needed) can access tags via `/api/tags`

## Notes

- Tags are **soft-deleted** by default (can be enhanced with `deleted_at` if needed)
- Slugs are **automatically generated** from tag names
- Tags have **public read access** but require auth to modify
- Deleting a tag **cascades** to remove all associations
- Multiple tags can be applied to same item
- Same tag can be used on multiple items

## Next Steps

1. ✅ Run the migration
2. ✅ Test creating tags via `/api/tags`
3. ✅ Test adding tags to categories
4. ✅ Test adding tags to finalists
5. 🔲 Update admin UI to show tag selector (optional)
6. 🔲 Add tag filtering to public pages (optional)

