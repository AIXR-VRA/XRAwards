/**
 * Accolades API Endpoint
 * GET /api/accolades - List all accolades (with hierarchy)
 * POST /api/accolades - Create an accolade
 * PUT /api/accolades - Update an accolade
 * DELETE /api/accolades - Delete an accolade
 */

import type { APIRoute } from 'astro';
import { requireApiAuth, createSecureSupabaseClient } from '../../utils/supabase';

// GET - List accolades with hierarchy
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const supabase = createSecureSupabaseClient(cookies);
    const searchParams = url.searchParams;
    const parentId = searchParams.get('parent_id');
    const level = searchParams.get('level'); // 1, 2, or 3
    const categoryId = searchParams.get('category_id'); // Filter by category's available accolade types
    const flat = searchParams.get('flat') === 'true'; // Return flat list instead of hierarchy
    const includeCategories = searchParams.get('include_categories') === 'true'; // Include category mappings

    let query = supabase
      .from('accolades')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });

    // Filter by parent
    if (parentId === 'null') {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // If flat list requested, return as-is
    if (flat) {
      return new Response(
        JSON.stringify({ accolades: data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch category mappings if requested
    let accoladeCategories: Record<string, any[]> = {};
    let categories: any[] = [];
    
    if (includeCategories) {
      // Get all category_accolades mappings with category details
      const { data: categoryAccolades } = await supabase
        .from('category_accolades')
        .select(`
          accolade_id,
          categories (
            id,
            name,
            slug
          )
        `);
      
      // Build a map of accolade_id -> categories
      if (categoryAccolades) {
        for (const ca of categoryAccolades) {
          if (!accoladeCategories[ca.accolade_id]) {
            accoladeCategories[ca.accolade_id] = [];
          }
          if (ca.categories) {
            accoladeCategories[ca.accolade_id].push(ca.categories);
          }
        }
      }
      
      // Also fetch all categories for grouping
      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name', { ascending: true });
      
      categories = allCategories || [];
    }

    // Build hierarchy with category info
    const buildHierarchy = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          categories: accoladeCategories[item.id] || [],
          children: buildHierarchy(items, item.id)
        }));
    };

    const hierarchy = buildHierarchy(data || []);

    // If filtering by category, get the available accolade types for that category
    let availableAccoladeIds: string[] = [];
    if (categoryId) {
      const { data: categoryAccolades } = await supabase
        .from('category_accolades')
        .select('accolade_id')
        .eq('category_id', categoryId);
      
      availableAccoladeIds = categoryAccolades?.map(ca => ca.accolade_id) || [];
    }

    return new Response(
      JSON.stringify({ 
        accolades: data,
        hierarchy,
        availableAccoladeIds,
        categories: includeCategories ? categories : undefined,
        accoladeCategories: includeCategories ? accoladeCategories : undefined
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET accolades error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch accolades' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Create an accolade
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const authResult = await requireApiAuth(cookies, request);
    
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = authResult.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { parent_id, code, name, description, sort_order, is_active, category_id } = body;

    if (!code || !name) {
      return new Response(
        JSON.stringify({ error: 'Code and name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Only level 1 accolades (parent_id is null) can have category associations
    const isLevel1 = !parent_id;
    if (isLevel1 && category_id && typeof category_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'category_id must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('accolades')
      .insert({ 
        parent_id: parent_id || null, 
        code, 
        name, 
        description: description || null, 
        sort_order: sort_order || 0,
        is_active: is_active !== false
      })
      .select()
      .single();

    if (error) throw error;

    // Update category association for level 1 accolades
    if (isLevel1 && category_id !== undefined) {
      // Delete existing associations
      await supabase
        .from('category_accolades')
        .delete()
        .eq('accolade_id', data.id);

      // Add new association if category_id is provided
      if (category_id) {
        const { error: categoryError } = await supabase
          .from('category_accolades')
          .insert({
            category_id,
            accolade_id: data.id,
          });

        if (categoryError) console.error('Error adding category association:', categoryError);
      }
    }

    return new Response(
      JSON.stringify({ accolade: data, message: 'Accolade created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST accolades error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create accolade' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update an accolade
export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const authResult = await requireApiAuth(cookies, request);
    
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = authResult.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { id, parent_id, code, name, description, sort_order, is_active, category_id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Only level 1 accolades (parent_id is null) can have category associations
    const isLevel1 = !parent_id;
    if (isLevel1 && category_id !== undefined && category_id !== null && typeof category_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'category_id must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('accolades')
      .update({ 
        parent_id: parent_id || null,
        code, 
        name, 
        description, 
        sort_order,
        is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update category association for level 1 accolades
    if (isLevel1 && category_id !== undefined) {
      // Delete existing associations
      await supabase
        .from('category_accolades')
        .delete()
        .eq('accolade_id', id);

      // Add new association if category_id is provided
      if (category_id) {
        const { error: categoryError } = await supabase
          .from('category_accolades')
          .insert({
            category_id,
            accolade_id: id,
          });

        if (categoryError) console.error('Error updating category association:', categoryError);
      }
    }

    return new Response(
      JSON.stringify({ accolade: data, message: 'Accolade updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT accolades error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update accolade' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete an accolade
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const authResult = await requireApiAuth(cookies, request);
    
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = authResult.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
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

    // Note: CASCADE delete will remove children automatically
    const { error } = await supabase
      .from('accolades')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'Accolade deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE accolades error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete accolade' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

