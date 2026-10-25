const KEY = "bf_order_ids";

export function getOrderIds() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addOrderId(id) {
  if (!id) return;
  try {
    const ids = getOrderIds();
    if (!ids.includes(id)) {
      ids.unshift(id);
      localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 50)));
    }
  } catch {
    /* ignore */
  }
}

export function clearOrderIds() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}