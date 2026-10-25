import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const STATUS_MESSAGES = {
  preparing: {
    subject: "Tu pedido está en preparación",
    body: (orderNumber, location) =>
      `¡Gracias por tu pedido en Best Foods!\n\nTu pedido #${orderNumber} está siendo preparado en nuestro local de ${location}. En cuanto esté listo, te avisaremos para que sepas cuándo esperarlo.\n\nPuedes seguir tu pedido en tiempo real desde la app.\n\n— El equipo de Best Foods`,
  },
  ready: {
    subject: "Tu pedido está listo",
    body: (orderNumber, location, orderType) =>
      `¡Tu pedido #${orderNumber} está listo!\n\n${orderType === "pickup"
        ? `Puedes pasarte a recogerlo por nuestro local de ${location}.`
        : `Nuestro repartidor está de camino. ¡Prepárate para recibirlo!`}\n\n— El equipo de Best Foods`,
  },
  delivered: {
    subject: "Tu pedido ha sido entregado",
    body: (orderNumber) =>
      `Tu pedido #${orderNumber} ha sido entregado. ¡Esperamos que lo disfrutes!\n\nSi tienes cualquier consulta, no dudes en contactarnos. ¡Hasta pronto!\n\n— El equipo de Best Foods`,
  },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return Response.json({ error: "order_id and status required" }, { status: 400 });
    }

    const template = STATUS_MESSAGES[status];
    if (!template) {
      return Response.json({ skipped: true, reason: `no message for status: ${status}` });
    }

    // Derive the recipient and all email content server-side from the stored
    // order record, so an anonymous caller cannot choose the recipient or
    // inject body text. Only the order's real customer is emailed, with the
    // order's real details.
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ skipped: true, reason: "order not found" });
    }
    // Tie the email to a real state: only send when the requested status
    // matches the order's current status.
    if (order.status !== status) {
      return Response.json({ skipped: true, reason: "status mismatch" });
    }
    // Send-once per status: order ids are exposed in tracking links and the
    // post-payment redirect, so an anonymous caller can reach this endpoint.
    // Block re-firing the same status notification to prevent spam/abuse.
    const notified = Array.isArray(order.notified_statuses) ? order.notified_statuses : [];
    if (notified.includes(status)) {
      return Response.json({ skipped: true, reason: "already notified for this status" });
    }
    if (!order.customer_email) {
      return Response.json({ skipped: true, reason: "no customer email" });
    }

    const subject = template.subject;
    const bodyText = template.body(order.order_number, order.location_name, order.order_type);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject,
      body: bodyText,
      from_name: "Best Foods",
    });

    // Mark this status as notified so it cannot be re-fired. This updates only
    // notified_statuses (not status), so it does not re-trigger the workflow.
    await base44.asServiceRole.entities.Order.update(order_id, {
      notified_statuses: [...notified, status],
    });

    return Response.json({ sent: true, status, to: order.customer_email });
  } catch (error) {
    console.error("sendOrderStatusNotification error:", error?.message || error);
    return Response.json({ error: error?.message || "Error sending notification" }, { status: 500 });
  }
}