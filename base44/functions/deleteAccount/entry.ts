import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authenticated = await base44.auth.isAuthenticated();
    if (!authenticated) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Remove the user's app account. Service-role elevation is required to
    // delete a User record; only the authenticated user's own id is removed.
    await base44.asServiceRole.entities.User.delete(user.id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error?.message || error);
    return Response.json({ error: error?.message || 'Error al eliminar la cuenta' }, { status: 500 });
  }
}