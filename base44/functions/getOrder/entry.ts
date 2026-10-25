import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id } = body || {};
    if (!order_id) {
      return Response.json({ error: 'order_id required' }, { status: 400 });
    }
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    // Strip customer PII — this endpoint is called anonymously from the public
    // order-tracking page, so only tracking-safe fields are returned.
    const { customer_name, customer_phone, customer_email, address, notes, ...safe } = order;
    return Response.json({ order: safe });
  } catch (error) {
    console.error('getOrder error:', error?.message || error);
    return Response.json({ error: error?.message || 'Order not found' }, { status: 404 });
  }
}