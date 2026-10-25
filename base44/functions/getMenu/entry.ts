import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public menu lookup — no auth required. The menu is public content, so we
// read with the service role to bypass RLS and return items, deals, locations.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const [itemsPage, dealsPage, locationsPage] = await Promise.all([
      base44.asServiceRole.entities.MenuItem.filter(
        { is_deal: { $ne: true } },
        { sort: 'sort_order', limit: 200 }
      ),
      base44.asServiceRole.entities.MenuItem.filter(
        { is_deal: true },
        { sort: 'sort_order', limit: 100 }
      ),
      base44.asServiceRole.entities.Location.list({ sort: 'sort_order', limit: 50 }),
    ]);

    return Response.json({
      items: itemsPage.items || [],
      deals: dealsPage.items || [],
      locations: locationsPage.items || [],
    });
  } catch (error) {
    console.error('getMenu error:', error?.message || error);
    return Response.json(
      { error: error?.message || 'Error al cargar el menú' },
      { status: 500 }
    );
  }
}