// Authoritative menu prices and delivery rules — server-side source of truth.
// The frontend menu (src/lib/menuData.js) must stay in sync with these values.
// Backend functions import this to recompute totals from item names, so a
// malicious client cannot tamper with prices or totals sent to Stripe.

export const MENU_PRICES = {
  // KEBAB
  "Kebab Normal": 4,
  "Kebab Mixto": 5,
  "Kebab Solo Carne": 5,
  "Kebab con Queso": 5.5,
  "Kebab Falafel": 4,
  // DURUM
  "Durum Normal": 5,
  "Durum Solo Carne": 6,
  "Durum con Patatas": 7,
  "Durum con Queso": 6,
  "Durum Falafel": 5,
  Burrito: 6,
  // LAHMACUN
  "Lahmacun Normal": 6,
  "Lahmacun con Queso": 7,
  "Lahmacun Solo Carne": 7,
  "Lahmacun Falafel": 6,
  // PEDRATA
  "Pedrata Pollo o Carne": 4,
  "Pedrata Grande": 6,
  "Pedrata con Arroz": 5,
  "Pedrata con Arroz Grande": 7,
  // PLATO
  "Plato con Patatas": 6.5,
  "Plato con Arroz": 7,
  "Plato con Arroz y Patatas": 7.5,
  "Solo Carne y Patatas": 8,
  "Plato Vegetariano": 7,
  "Plato con Ensalada y Carne": 6.5,
  "Plato Degustación": 9,
  // COMIDA BOLIVIANA
  "Plato Pollo Broaster": 7,
  "Plato Pollo Broaster Entero": 14,
  "Plato Piquemacho": 7,
  "Plato Salchipapa": 4,
  // POLLO FRITO
  "Pollo Frito 3 Uds": 7,
  "Pollo Frito 6 Uds": 12,
  "Pollo Frito 9 Uds": 17,
  "Pollo Frito 12 Uds": 22,
  "Pollo Frito 16 Uds": 28,
  "Hamburguesa de Pollo": 7.5,
  // RACIONES
  "Patatas Fritas": 3,
  "Patatas Bravas": 3.5,
  "Patatas Gajo": 3.5,
  "Nuggets de Pollo": 4,
  "Alitas de Pollo": 5,
  "Burritos de Pollo": 5,
  Samosa: 3,
  "Pakora Vegetal": 3.5,
  "Aros de Cebolla": 3.5,
  Falafel: 4,
  "Popcorn de Pollo": 4,
  "Arroz Basmati": 3,
  "Ensalada Mixta": 4,
  "Ensalada Turka": 4,
  // DEALS / MENÚS (combo meals — distinct from individual menu items)
  "Doner Kebab": 7,
  "Durum": 8,
  "Lahmacun": 9,
  "Falafel Kebab": 7,
  "Pedrata Normal": 6,
  "Pedrata Grande Menú": 8,
  "Hamburguesa": 7.5,
  "Alitas de Pollo (6 und)": 7,
  "Nuggets de Pollo (6 und)": 7,
};

export const DELIVERY_FEE = 1.5;
export const FREE_DELIVERY_OVER = 15;

// Recompute the cart subtotal from authoritative prices.
// Returns { valid, subtotal, error }.
export function verifyCart(items) {
  if (!items || items.length === 0) {
    return { valid: false, subtotal: 0, error: "Cesta vacía" };
  }
  let subtotal = 0;
  for (const i of items) {
    const name = String(i.name || "").trim();
    const qty = Number(i.quantity);
    if (!name || !qty || qty <= 0) {
      return { valid: false, subtotal: 0, error: "Artículo inválido" };
    }
    const authoritative = MENU_PRICES[name];
    if (authoritative === undefined) {
      return { valid: false, subtotal: 0, error: `Artículo desconocido: ${name}` };
    }
    subtotal += authoritative * qty;
  }
  // Round to 2 decimals to avoid float drift
  subtotal = Math.round(subtotal * 100) / 100;
  return { valid: true, subtotal };
}

// Delivery fee is 0 for pickup; for delivery it's waived above FREE_DELIVERY_OVER.
export function computeDeliveryFee(subtotal, orderType) {
  if (orderType === "pickup") return 0;
  if (subtotal >= FREE_DELIVERY_OVER) return 0;
  return DELIVERY_FEE;
}