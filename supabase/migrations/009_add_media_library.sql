-- Migration: 009_add_media_library
-- Created: 2024
-- Description: Add comprehensive media library system with R2 storage and flexible linking

-- =============================================
-- MEDIA LIBRARY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in R2 bucket
  file_url TEXT NOT NULL, -- Full public URL
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  alt_text TEXT, -- For accessibility
  title TEXT, -- Optional title for the media
  description TEXT, -- Optional description
  is_public BOOLEAN DEFAULT true, -- Whether media is publicly accessible
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_media_library_filename ON media_library(filename);
CREATE INDEX IF NOT EXISTS idx_media_library_mime_type ON media_library(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_library_upload_date ON media_library(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_library_is_public ON media_library(is_public);
CREATE INDEX IF NOT EXISTS idx_media_library_file_extension ON media_library(file_extension);

-- =============================================
-- MEDIA LINKING TABLES (Many-to-Many)
-- =============================================

-- Link media to events
CREATE TABLE IF NOT EXISTS media_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event_details(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, event_id)
);

-- Link media to categories
CREATE TABLE IF NOT EXISTS media_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, category_id)
);

-- Link media to finalists
CREATE TABLE IF NOT EXISTS media_finalists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  finalist_id UUID NOT NULL REFERENCES finalists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, finalist_id)
);

-- Link media to sponsors
CREATE TABLE IF NOT EXISTS media_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, sponsor_id)
);

-- Link media to tags
CREATE TABLE IF NOT EXISTS media_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, tag_id)
);

-- Link media to judges
CREATE TABLE IF NOT EXISTS media_judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, judge_id)
);

-- =============================================
-- INDEXES FOR LINKING TABLES
-- =============================================

-- Media-Events indexes
CREATE INDEX IF NOT EXISTS idx_media_events_media_id ON media_events(media_id);
CREATE INDEX IF NOT EXISTS idx_media_events_event_id ON media_events(event_id);

-- Media-Categories indexes
CREATE INDEX IF NOT EXISTS idx_media_categories_media_id ON media_categories(media_id);
CREATE INDEX IF NOT EXISTS idx_media_categories_category_id ON media_categories(category_id);

-- Media-Finalists indexes
CREATE INDEX IF NOT EXISTS idx_media_finalists_media_id ON media_finalists(media_id);
CREATE INDEX IF NOT EXISTS idx_media_finalists_finalist_id ON media_finalists(finalist_id);

-- Media-Sponsors indexes
CREATE INDEX IF NOT EXISTS idx_media_sponsors_media_id ON media_sponsors(media_id);
CREATE INDEX IF NOT EXISTS idx_media_sponsors_sponsor_id ON media_sponsors(sponsor_id);

-- Media-Tags indexes
CREATE INDEX IF NOT EXISTS idx_media_tags_media_id ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag_id ON media_tags(tag_id);

-- Media-Judges indexes
CREATE INDEX IF NOT EXISTS idx_media_judges_media_id ON media_judges(media_id);
CREATE INDEX IF NOT EXISTS idx_media_judges_judge_id ON media_judges(judge_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all media tables
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_finalists ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_judges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR MEDIA_LIBRARY
-- =============================================

-- Allow public read access to public media
CREATE POLICY "Allow public read access to public media"
  ON media_library
  FOR SELECT
  USING (is_public = true);

-- Allow authenticated users to read all media
CREATE POLICY "Allow authenticated users to read all media"
  ON media_library
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert media
CREATE POLICY "Allow authenticated users to insert media"
  ON media_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update media
CREATE POLICY "Allow authenticated users to update media"
  ON media_library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete media
CREATE POLICY "Allow authenticated users to delete media"
  ON media_library
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES FOR LINKING TABLES
-- =============================================

-- Media-Events policies
CREATE POLICY "Allow public read access to media_events"
  ON media_events
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage media_events"
  ON media_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Media-Categories policies
CREATE POLICY "Allow public read access to media_categories"
  ON media_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage media_categories"
  ON media_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Media-Finalists policies
CREATE POLICY "Allow public read access to media_finalists"
  ON media_finalists
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage media_finalists"
  ON media_finalists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Media-Sponsors policies
CREATE POLICY "Allow public read access to media_sponsors"
  ON media_sponsors
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage media_sponsors"
  ON media_sponsors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Media-Tags policies
CREATE POLICY "Allow public read access to media_tags"
  ON media_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage media_tags"
  ON media_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- RLS POLICIES FOR MEDIA_JUDGES
-- =============================================

-- Allow public read access to media_judges
CREATE POLICY "Allow public read access to media_judges"
  ON media_judges
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage media_judges"
  ON media_judges
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger for media_library
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get media with all its relationships
CREATE OR REPLACE FUNCTION get_media_with_relationships(media_uuid UUID)
RETURNS TABLE (
  media_id UUID,
  filename TEXT,
  original_filename TEXT,
  file_url TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  mime_type TEXT,
  file_size BIGINT,
  upload_date TIMESTAMPTZ,
  events JSONB,
  categories JSONB,
  finalists JSONB,
  sponsors JSONB,
  tags JSONB,
  judges JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id,
    ml.filename,
    ml.original_filename,
    ml.file_url,
    ml.alt_text,
    ml.title,
    ml.description,
    ml.mime_type,
    ml.file_size,
    ml.upload_date,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', ed.id, 'event_year', ed.event_year, 'event_name', ed.event_name))
       FROM media_events me
       JOIN event_details ed ON me.event_id = ed.id
       WHERE me.media_id = ml.id),
      '[]'::jsonb
    ) as events,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
       FROM media_categories mc
       JOIN categories c ON mc.category_id = c.id
       WHERE mc.media_id = ml.id),
      '[]'::jsonb
    ) as categories,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', f.id, 'title', f.title, 'organization', f.organization))
       FROM media_finalists mf
       JOIN finalists f ON mf.finalist_id = f.id
       WHERE mf.media_id = ml.id),
      '[]'::jsonb
    ) as finalists,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'website_url', s.website_url))
       FROM media_sponsors ms
       JOIN sponsors s ON ms.sponsor_id = s.id
       WHERE ms.media_id = ml.id),
      '[]'::jsonb
    ) as sponsors,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
       FROM media_tags mt
       JOIN tags t ON mt.tag_id = t.id
       WHERE mt.media_id = ml.id),
        '[]'::jsonb
      ) as tags,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('id', j.id, 'name', j.name, 'title', j.title))
         FROM media_judges mj
         JOIN judges j ON mj.judge_id = j.id
         WHERE mj.media_id = ml.id),
        '[]'::jsonb
      ) as judges
    FROM media_library ml
    WHERE ml.id = media_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to search media by relationships
CREATE OR REPLACE FUNCTION search_media_by_relationships(
  event_ids UUID[] DEFAULT NULL,
  category_ids UUID[] DEFAULT NULL,
  finalist_ids UUID[] DEFAULT NULL,
  sponsor_ids UUID[] DEFAULT NULL,
  tag_ids UUID[] DEFAULT NULL,
  judge_ids UUID[] DEFAULT NULL,
  mime_types TEXT[] DEFAULT NULL,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  media_id UUID,
  filename TEXT,
  original_filename TEXT,
  file_url TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  mime_type TEXT,
  file_size BIGINT,
  upload_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ml.id,
    ml.filename,
    ml.original_filename,
    ml.file_url,
    ml.alt_text,
    ml.title,
    ml.description,
    ml.mime_type,
    ml.file_size,
    ml.upload_date
  FROM media_library ml
  WHERE 
    (event_ids IS NULL OR ml.id IN (
      SELECT me.media_id FROM media_events me WHERE me.event_id = ANY(event_ids)
    ))
    AND (category_ids IS NULL OR ml.id IN (
      SELECT mc.media_id FROM media_categories mc WHERE mc.category_id = ANY(category_ids)
    ))
    AND (finalist_ids IS NULL OR ml.id IN (
      SELECT mf.media_id FROM media_finalists mf WHERE mf.finalist_id = ANY(finalist_ids)
    ))
    AND (sponsor_ids IS NULL OR ml.id IN (
      SELECT ms.media_id FROM media_sponsors ms WHERE ms.sponsor_id = ANY(sponsor_ids)
    ))
    AND (tag_ids IS NULL OR ml.id IN (
      SELECT mt.media_id FROM media_tags mt WHERE mt.tag_id = ANY(tag_ids)
    ))
    AND (judge_ids IS NULL OR ml.id IN (
      SELECT mj.media_id FROM media_judges mj WHERE mj.judge_id = ANY(judge_ids)
    ))
    AND (mime_types IS NULL OR ml.mime_type = ANY(mime_types))
    AND (search_term IS NULL OR (
      ml.filename ILIKE '%' || search_term || '%' OR
      ml.original_filename ILIKE '%' || search_term || '%' OR
      ml.alt_text ILIKE '%' || search_term || '%' OR
      ml.title ILIKE '%' || search_term || '%' OR
      ml.description ILIKE '%' || search_term || '%'
    ))
    AND ml.is_public = true
  ORDER BY ml.upload_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE media_library IS 'Central media library storing file metadata and R2 paths';
COMMENT ON TABLE media_events IS 'Many-to-many relationship between media and events';
COMMENT ON TABLE media_categories IS 'Many-to-many relationship between media and categories';
COMMENT ON TABLE media_finalists IS 'Many-to-many relationship between media and finalists';
COMMENT ON TABLE media_sponsors IS 'Many-to-many relationship between media and sponsors';
COMMENT ON TABLE media_tags IS 'Many-to-many relationship between media and tags';

COMMENT ON COLUMN media_library.filename IS 'Generated safe filename stored in R2';
COMMENT ON COLUMN media_library.original_filename IS 'Original filename from upload';
COMMENT ON COLUMN media_library.file_path IS 'Path within R2 bucket';
COMMENT ON COLUMN media_library.file_url IS 'Full public URL to access the file';
COMMENT ON COLUMN media_library.alt_text IS 'Alt text for accessibility';
COMMENT ON COLUMN media_library.title IS 'Optional title for the media';
COMMENT ON COLUMN media_library.is_public IS 'Whether media is publicly accessible';

COMMENT ON FUNCTION get_media_with_relationships(UUID) IS 'Get media with all its relationships as JSON';
COMMENT ON FUNCTION search_media_by_relationships IS 'Search media by various relationship criteria';
