// Best Foods — shared menu helpers + static config.
// Menu items, deals, and locations live in the database and are served by the
// `getMenu` backend function (see src/lib/useMenuData.js).

export const formatPrice = (p) =>
  Number.isInteger(p) ? `${p}€` : `${p.toFixed(2).replace(".", ",")}€`;

// Pick the localized field for an item or deal (falls back to Spanish).
export const localized = (obj, lang, field) => obj[`${field}_${lang}`] || obj[field];

export const categories = [
  { id: "kebab", label: "Kebab", label_en: "Kebab", emoji: "🥙" },
  { id: "durum", label: "Durum", label_en: "Durum", emoji: "🌯" },
  { id: "lahmacun", label: "Lahmacun", label_en: "Lahmacun", emoji: "🫓" },
  { id: "pedrata", label: "Pedrata", label_en: "Pedrata", emoji: "🍲" },
  { id: "plato", label: "Plato", label_en: "Plates", emoji: "🍽️" },
  { id: "boliviana", label: "Comida Boliviana", label_en: "Bolivian Food", emoji: "🇧🇴" },
  { id: "pollo", label: "Pollo Frito", label_en: "Fried Chicken", emoji: "🍗" },
  { id: "raciones", label: "Raciones", label_en: "Sides", emoji: "🍟" },
];

export const restaurantInfo = {
  name: "Best Foods",
  phone: "946 290 937",
  hoursLunch: "12:30 – 16:30",
  hoursDinner: "19:00 – 00:30",
  deliveryMin: 12,
  freeDeliveryOver: 15,
  deliveryFee: 1.5,
};