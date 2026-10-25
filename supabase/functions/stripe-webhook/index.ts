import { adminClient, json } from "../_shared/common.ts";

async function verifySignature(body: string, header: string, secret: string) {
  const parts: Record<string, string> = {};
  header.split(",").forEach((p) => {
    const [k, v] = p.split("=");
    parts[k] = v;
  });
  const ts = Number(parts["t"] ?? 0);
  const sig = parts["v1"];
  if (!ts || !sig || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${body}`));
  const hex = [...new Uint8Array(expected)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === sig;
}

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!secret) return json({ error: "Webhook secret not configured" }, 500);

    const body = await req.text();
    const valid = await verifySignature(body, req.headers.get("stripe-signature") ?? "", secret);
    if (!valid) return json({ error: "Invalid signature" }, 400);

    const event = JSON.parse(body);
    const intent = event.data?.object;
    const db = adminClient();

    if (event.type === "payment_intent.succeeded") {
      await db.from("orders").update({ payment_status: "paid" })
        .eq("stripe_payment_intent_id", intent.id);
    } else if (event.type === "payment_intent.payment_failed") {
      await db.from("orders").update({ payment_status: "failed" })
        .eq("stripe_payment_intent_id", intent.id).neq("payment_status", "paid");
    }
    return json({ received: true });
  } catch (e) {
    console.error("stripe-webhook error:", (e as Error)?.message ?? e);
    return json({ error: "Webhook error" }, 500);
  }
});
