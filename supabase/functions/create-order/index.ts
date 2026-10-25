import { adminClient, computeDeliveryFee, corsHeaders, getCaller, json, round2 } from "../_shared/common.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getCaller(req);
    if (!user) return json({ error: "No autenticado" }, 401);

    const body = await req.json();
    const items: { id: string; quantity: number }[] = body?.items ?? [];
    if (!Array.isArray(items) || items.length === 0) return json({ error: "Cesta vacía" }, 400);

    const orderType = body.order_type === "pickup" ? "pickup" : "delivery";
    const paymentMethod = body.payment_method === "cash" ? "cash" : "card";

    const db = adminClient();
    const ids = items.map((i) => i.id);
    const { data: menu, error: menuErr } = await db
      .from("menu_items")
      .select("id, name, price")
      .in("id", ids);
    if (menuErr) throw menuErr;
    const byId = new Map(menu!.map((m) => [m.id, m]));

    // Prices always come from the database; client-sent prices are ignored.
    let subtotal = 0;
    const orderItems = [];
    for (const i of items) {
      const m = byId.get(i.id);
      const qty = Number(i.quantity);
      if (!m || !Number.isInteger(qty) || qty <= 0 || qty > 99) {
        return json({ error: "Artículo inválido" }, 400);
      }
      subtotal += Number(m.price) * qty;
      orderItems.push({ name: m.name, price: Number(m.price), quantity: qty });
    }
    subtotal = round2(subtotal);
    const deliveryFee = computeDeliveryFee(subtotal, orderType);
    const total = round2(subtotal + deliveryFee);

    const orderNumber = `BF-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        order_type: orderType,
        location_name: body.location_name ?? "",
        customer_name: body.customer_name ?? "",
        customer_phone: body.customer_phone ?? "",
        customer_email: body.customer_email ?? "",
        address: body.address ?? "",
        notes: body.notes ?? "",
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cash" ? "unpaid" : "pending",
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    if (paymentMethod === "cash") {
      return json({ order_id: order.id, order_number: orderNumber });
    }

    const params = new URLSearchParams({
      amount: String(Math.round(total * 100)),
      currency: "eur",
      "automatic_payment_methods[enabled]": "true",
      "metadata[order_id]": order.id,
      "metadata[order_number]": orderNumber,
    });
    if (body.customer_email) params.append("receipt_email", body.customer_email);

    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: params.toString(),
    });
    const intent = await res.json();
    if (!res.ok) {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return json({ error: intent?.error?.message ?? "Error al crear el pago" }, 500);
    }
    await db.from("orders").update({ stripe_payment_intent_id: intent.id }).eq("id", order.id);

    return json({
      order_id: order.id,
      order_number: orderNumber,
      client_secret: intent.client_secret,
    });
  } catch (e) {
    console.error("create-order error:", (e as Error)?.message ?? e);
    return json({ error: "Error al procesar el pedido" }, 500);
  }
});
