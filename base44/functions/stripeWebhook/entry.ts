import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

async function verifySignature(body, signatureHeader, secret) {
  const parts = {};
  signatureHeader.split(',').forEach((p) => {
    const [k, v] = p.split('=');
    parts[k] = v;
  });
  const timestamp = parts['t'];
  const sig = parts['v1'];
  if (!timestamp || !sig) return false;
  const payload = `${timestamp}.${body}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const expectedHex = [...new Uint8Array(expected)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expectedHex === sig;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const valid = await verifySignature(body, signature, secret);
    if (!valid) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Replay protection: reject events with timestamps older than 5 minutes.
    const tsPart = {};
    signature.split(',').forEach((p) => {
      const [k, v] = p.split('=');
      tsPart[k] = v;
    });
    const ts = Number(tsPart['t'] || 0);
    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
      return Response.json({ error: 'Stale event' }, { status: 400 });
    }

    const event = JSON.parse(body);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Only mark paid when Stripe confirms the payment actually settled.
      if (session.payment_status === 'paid') {
        const sessionId = session.id;
        const orders = await base44.asServiceRole.entities.Order.filter({
          stripe_session_id: sessionId,
        });
        if (orders.items && orders.items.length > 0) {
          await base44.asServiceRole.entities.Order.update(orders.items[0].id, {
            payment_status: 'paid',
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error?.message || error);
    return Response.json({ error: error?.message || 'Webhook error' }, { status: 500 });
  }
}