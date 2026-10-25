import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { verifyCart, computeDeliveryFee, MENU_PRICES } from '../../shared/menuPrices.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      items,
      order_type,
      location_name,
      customer_name,
      customer_phone,
      customer_email,
      address,
      notes,
      payment_method,
    } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Cesta vacía' }, { status: 400 });
    }
    // Derive the post-payment redirect origin from a server-side constant so an
    // anonymous caller cannot point the Stripe success_url at an attacker-controlled
    // site (open redirect / post-payment phishing). The caller-supplied base_url is
    // intentionally ignored — only this app's own published host is ever used.
    const origin = 'https://bestfoods.base44.app';

    // Recompute prices server-side from the authoritative menu — the client-sent
    // prices and total are never trusted for the charge amount.
    const cart = verifyCart(items);
    if (!cart.valid) {
      return Response.json({ error: cart.error || 'Cesta inválida' }, { status: 400 });
    }
    const subtotal = cart.subtotal;
    const deliveryFee = computeDeliveryFee(subtotal, order_type);
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const orderNumber = `BF-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await base44.asServiceRole.entities.Order.create({
      order_number: orderNumber,
      items: items.map((i) => ({
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity),
      })),
      subtotal,
      delivery_fee: deliveryFee,
      total,
      order_type: order_type || 'delivery',
      location_name: location_name || '',
      customer_name: customer_name || '',
      customer_phone: customer_phone || '',
      customer_email: customer_email || '',
      address: address || '',
      notes: notes || '',
      payment_method: payment_method || 'card',
      payment_status: payment_method === 'cash' ? 'unpaid' : 'pending',
      status: 'received',
    });

    // Cash: no Stripe session needed, go straight to confirmation.
    if (payment_method === 'cash') {
      return Response.json({
        redirect: false,
        order_id: order.id,
        order_number: orderNumber,
      });
    }

    // Card: build Stripe Checkout Session with inline price_data, using the
    // server-verified authoritative prices (not the client-sent ones).
    const lineItems = items.map((i) => ({
      currency: 'eur',
      unit_amount: Math.round((MENU_PRICES[String(i.name).trim()] || 0) * 100),
      name: i.name,
      quantity: Number(i.quantity),
    }));
    if (deliveryFee > 0) {
      lineItems.push({
        currency: 'eur',
        unit_amount: Math.round(deliveryFee * 100),
        name: 'Domicilio',
        quantity: 1,
      });
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append(
      'success_url',
      `${origin}/order-confirmed?order_id=${order.id}&on=${orderNumber}`
    );
    params.append('cancel_url', `${origin}/checkout`);
    lineItems.forEach((li, idx) => {
      params.append(`line_items[${idx}][price_data][currency]`, li.currency);
      params.append(`line_items[${idx}][price_data][unit_amount]`, String(li.unit_amount));
      params.append(`line_items[${idx}][price_data][product_data][name]`, li.name);
      params.append(`line_items[${idx}][quantity]`, String(li.quantity));
    });
    if (customer_email) params.append('customer_email', customer_email);
    const appId = secrets.get('BASE44_APP_ID') || '';
    params.append('metadata[base44_app_id]', appId);
    params.append('metadata[order_id]', order.id);
    params.append('metadata[order_number]', orderNumber);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Stripe session error:', data?.error?.message);
      return Response.json(
        { error: data?.error?.message || 'Error al crear la sesión de pago' },
        { status: 500 }
      );
    }

    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: data.id,
    });

    return Response.json({
      redirect: true,
      url: data.url,
      order_id: order.id,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error('createCheckoutSession error:', error?.message || error);
    return Response.json(
      { error: error?.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}