import { adminClient, json } from "../_shared/common.ts";

// Invoked by a Supabase Database Webhook on public.orders UPDATE.
// Configure the webhook with the HTTP header: x-webhook-secret = WEBHOOK_SECRET.
// Emails are sent through Resend (RESEND_API_KEY, FROM_EMAIL secrets).

const MESSAGES: Record<string, { subject: string; body: (o: any) => string }> = {
  preparing: {
    subject: "Tu pedido está en preparación",
    body: (o) =>
      `¡Gracias por tu pedido en Best Foods!\n\nTu pedido #${o.order_number} está siendo preparado en nuestro local de ${o.location_name}. En cuanto esté listo, te avisaremos.\n\nPuedes seguir tu pedido en tiempo real desde la app.\n\n— El equipo de Best Foods`,
  },
  ready: {
    subject: "Tu pedido está listo",
    body: (o) =>
      `¡Tu pedido #${o.order_number} está listo!\n\n${
        o.order_type === "pickup"
          ? `Puedes pasarte a recogerlo por nuestro local de ${o.location_name}.`
          : "Nuestro repartidor está de camino. ¡Prepárate para recibirlo!"
      }\n\n— El equipo de Best Foods`,
  },
  delivered: {
    subject: "Tu pedido ha sido entregado",
    body: (o) =>
      `Tu pedido #${o.order_number} ha sido entregado. ¡Esperamos que lo disfrutes!\n\n— El equipo de Best Foods`,
  },
};

Deno.serve(async (req) => {
  try {
    if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const payload = await req.json();
    const rec = payload.record;
    const old = payload.old_record;
    if (!rec || rec.status === old?.status) return json({ skipped: true });

    const template = MESSAGES[rec.status];
    if (!template || !rec.customer_email) return json({ skipped: true });

    const notified: string[] = rec.notified_statuses ?? [];
    if (notified.includes(rec.status)) return json({ skipped: true });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Best Foods <${Deno.env.get("FROM_EMAIL")}>`,
        to: [rec.customer_email],
        subject: template.subject,
        text: template.body(rec),
      }),
    });
    if (!res.ok) throw new Error(`Email provider error ${res.status}`);

    await adminClient().from("orders")
      .update({ notified_statuses: [...notified, rec.status] })
      .eq("id", rec.id);
    return json({ sent: true });
  } catch (e) {
    console.error("order-status-notification error:", (e as Error)?.message ?? e);
    return json({ error: "Error sending notification" }, 500);
  }
});
