import { adminClient, corsHeaders, getCaller, json } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getCaller(req);
    if (!user) return json({ error: "No autenticado" }, 401);

    // Orders keep their rows (user_id is set to null) for bookkeeping.
    const { error } = await adminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;
    return json({ success: true });
  } catch (e) {
    console.error("delete-account error:", (e as Error)?.message ?? e);
    return json({ error: "Error al eliminar la cuenta" }, 500);
  }
});
