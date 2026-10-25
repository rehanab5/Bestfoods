import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { ids } = body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ orders: [] });
    }
    const res = await base44.asServiceRole.entities.Order.filter(
      { id: { $in: ids } },
      { sort: '-created_date', limit: 100 }
    );
    // Strip customer PII — this endpoint is anonymous; only tracking-safe
    // fields are returned for the requested order ids.
    const stripPii = ({ customer_name, customer_phone, customer_email, address, notes, ...safe }) => safe;
    return Response.json({ orders: (res.items || []).map(stripPii) });
  } catch (error) {
    console.error('getOrders error:', error?.message || error);
    return Response.json({ error: error?.message || 'Error fetching orders' }, { status: 500 });
  }
}