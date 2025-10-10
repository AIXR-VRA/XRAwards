/**
 * Categories API Endpoint
 * GET /api/categories - List all categories
 * POST /api/categories - Create a category
 * PUT /api/categories - Update a category
 * DELETE /api/categories - Delete a category
 */

import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

// Helper to initialize Supabase client
function getSupabaseClient(cookies: any) {
  return createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: any) {
          cookies.set(key, value, options);
        },
        remove(key: string, options: any) {
          cookies.delete(key, options);
        },
      },
    }
  );
}

// Helper to check authentication
async function checkAuth(cookies: any) {
  const supabase = getSupabaseClient(cookies);
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { authenticated: false, supabase, session: null };
  }
  
  return { authenticated: true, supabase, session };
}

// GET - List all categories
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch categories with their tags
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform the data to include tags array
    const categoriesWithTags = data?.map(cat => ({
      ...cat,
      tags: cat.category_tags?.map((ct: any) => ct.tags) || []
    }));

    return new Response(
      JSON.stringify({ categories: categoriesWithTags }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch categories' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create a category
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name, slug, description, is_visible, sort_order, additional_info, tag_ids } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, description, is_visible, sort_order, additional_info })
      .select()
      .single();

    if (error) throw error;

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id: string) => ({
        category_id: data.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from('category_tags')
        .insert(tagInserts);

      if (tagError) console.error('Error adding tags:', tagError);
    }

    return new Response(
      JSON.stringify({ category: data, message: 'Category created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a category
export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { id, name, slug, description, is_visible, sort_order, additional_info, tag_ids } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug, description, is_visible, sort_order, additional_info })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tags
      await supabase
        .from('category_tags')
        .delete()
        .eq('category_id', id);

      // Add new tags
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map((tag_id: string) => ({
          category_id: id,
          tag_id,
        }));

        const { error: tagError } = await supabase
          .from('category_tags')
          .insert(tagInserts);

        if (tagError) console.error('Error updating tags:', tagError);
      }
    }

    return new Response(
      JSON.stringify({ category: data, message: 'Category updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a category
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const { authenticated, supabase } = await checkAuth(cookies);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Category deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE categories error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

