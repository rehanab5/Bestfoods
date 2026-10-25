import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  MapPin,
  Clock,
  Truck,
  Store,
  ShieldCheck,
  Loader2,
  Navigation,
} from "lucide-react";
import { useCart } from "@/lib/cartContext.jsx";
import { formatPrice, restaurantInfo, localized } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useLang } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { addOrderId } from "@/lib/orderStorage";
import { getUserLocation, haversineDistance, estimateDriveTime } from "@/lib/geo";
import { getProfile } from "@/lib/profileStorage";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal, deliveryFee, total, clearCart, addItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { data } = useMenuData();
  const locations = data?.locations || [];
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [form, setForm] = useState(() => {
    const p = getProfile();
    return {
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      street: p.street || "",
      floor: p.floor || "",
      area: p.area || "",
      zip: p.zip || "",
      location: p.location || locations[0]?.name || "",
    };
  });
  const [distances, setDistances] = useState({});
  const [locating, setLocating] = useState(false);

  // Once locations load from the server, default the picker to the first one
  // when the profile has no saved preference.
  useEffect(() => {
    if (locations.length > 0 && !form.location) {
      setForm((f) => ({ ...f, location: locations[0].name }));
    }
  }, [locations]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleUseLocation = async () => {
    setLocating(true);
    try {
      const pos = await getUserLocation();
      const withDist = locations.map((l) => ({
        name: l.name,
        km: haversineDistance(pos.lat, pos.lng, l.lat, l.lng),
      }));
      const nearest = withDist.reduce((a, b) => (a.km < b.km ? a : b));
      const map = {};
      withDist.forEach((d, idx) => {
        map[locations[idx].id] = { km: d.km, min: estimateDriveTime(d.km) };
      });
      setDistances(map);
      setForm((f) => ({ ...f, location: nearest.name }));
      toast.success(`${t("location.nearest")}: ${nearest.name}`);
    } catch {
      toast.error(t("location.denied"));
    } finally {
      setLocating(false);
    }
  };

  const actualDeliveryFee = orderType === "pickup" ? 0 : deliveryFee;
  const actualTotal = subtotal + actualDeliveryFee;
  const estimatedTime =
    orderType === "delivery" ? t("checkout.deliveryTime") : t("checkout.pickupTime");

  const buildPayload = () => ({
    items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
    delivery_fee: actualDeliveryFee,
    total: actualTotal,
    order_type: orderType,
    location_name: form.location,
    customer_name: form.name,
    customer_phone: form.phone,
    customer_email: form.email,
    address:
      orderType === "delivery"
        ? [form.street, form.floor, form.area, form.zip].filter(Boolean).join(", ")
        : "",
    notes: "",
    payment_method: paymentMethod,
    base_url: window.location.origin,
  });

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone) {
      toast.error(orderType === "delivery" ? "Nombre y teléfono requeridos" : "Name and phone required");
      return;
    }
    setIsProcessing(true);
    // Optimistic UI: snapshot cart and clear immediately so the screen feels instant.
    const cartSnapshot = items;
    clearCart();
    try {
      const res = await base44.functions.invoke("createCheckoutSession", buildPayload());
      const data = res.data || res;
      if (data.order_id) addOrderId(data.order_id);
      if (paymentMethod === "cash" || !data.redirect) {
        navigate(`/order-confirmed?order_id=${data.order_id}&on=${data.order_number}`);
        return;
      }
      // Card: redirect to Stripe Checkout (handle iframe preview)
      const isFramed = window.self !== window.top;
      const checkoutTab = isFramed ? window.open("", "_blank") : null;
      if (isFramed && !checkoutTab) {
        toast.error(t("checkout.popupError"));
        setIsProcessing(false);
        return;
      }
      if (checkoutTab) checkoutTab.opener = null;
      try {
        if (checkoutTab) checkoutTab.location.replace(data.url);
        else window.location.assign(data.url);
      } catch (e) {
        checkoutTab?.close();
        throw e;
      }
    } catch (e) {
      // Restore cart items so the user can retry without rebuilding the order.
      cartSnapshot.forEach((item) => {
        addItem(item);
        updateQuantity(item.id, item.quantity);
      });
      const msg = e?.response?.data?.error || e?.message || "Error";
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold">{t("checkout.empty")}</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> {t("checkout.back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="md:max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <h1 className="font-display text-4xl tracking-wide mb-8">{t("checkout.title")}</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-base mb-4">{t("checkout.type")}</h3>
                <RadioGroup
                  value={orderType}
                  onValueChange={setOrderType}
                  role="radiogroup"
                  aria-label={t("checkout.type")}
                  className="grid grid-cols-2 gap-3"
                >
                  <label
                    aria-label={t("checkout.delivery")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${
                      orderType === "delivery"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value="delivery" className="sr-only" />
                    <Truck className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">{t("checkout.delivery")}</p>
                      <p className="text-xs text-muted-foreground">{t("checkout.deliveryTime")}</p>
                    </div>
                  </label>
                  <label
                    aria-label={t("checkout.pickup")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${
                      orderType === "pickup"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value="pickup" className="sr-only" />
                    <Store className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">{t("checkout.pickup")}</p>
                      <p className="text-xs text-muted-foreground">{t("checkout.pickupTime")}</p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-base">{t("checkout.location")}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2"
                    onClick={handleUseLocation}
                    disabled={locating}
                  >
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    {t("location.useMyLocation")}
                  </Button>
                </div>
                <div
                  role="radiogroup"
                  aria-label={t("checkout.location")}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {locations.map((loc) => {
                    const d = distances[loc.id];
                    return (
                      <label
                        key={loc.id}
                        aria-label={loc.name}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${
                          form.location === loc.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="location"
                          value={loc.name}
                          checked={form.location === loc.name}
                          onChange={set("location")}
                          className="sr-only"
                        />
                        <MapPin className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{loc.name}</span>
                          {d && (
                            <span className="text-xs text-muted-foreground">
                              {d.km.toFixed(1)} km · {d.min} min
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {orderType === "delivery" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> {t("checkout.address")}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("checkout.street")}</Label>
                        <Input value={form.street} onChange={set("street")} placeholder="C/Askao 4" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("checkout.floor")}</Label>
                        <Input value={form.floor} onChange={set("floor")} placeholder="3º B" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("checkout.area")}</Label>
                        <Input value={form.area} onChange={set("area")} placeholder="Casco Viejo" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("checkout.zip")}</Label>
                        <Input value={form.zip} onChange={set("zip")} placeholder="48005" className="h-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-base">{t("checkout.contact")}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("checkout.name")}</Label>
                    <Input value={form.name} onChange={set("name")} placeholder="Nombre Apellidos" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("checkout.phone")}</Label>
                    <Input value={form.phone} onChange={set("phone")} placeholder="612 345 678" className="h-10" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">{t("checkout.email")}</Label>
                    <Input type="email" value={form.email} onChange={set("email")} placeholder="email@ejemplo.com" className="h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-base mb-4">{t("checkout.payment")}</h3>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  role="radiogroup"
                  aria-label={t("checkout.payment")}
                  className="space-y-3"
                >
                  <label
                    aria-label={t("checkout.card")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value="card" className="sr-only" />
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{t("checkout.card")}</p>
                      <p className="text-xs text-muted-foreground">{t("checkout.cardDesc")}</p>
                    </div>
                  </label>
                  <label
                    aria-label={t("checkout.cash")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value="cash" className="sr-only" />
                    <Banknote className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{t("checkout.cash")}</p>
                      <p className="text-xs text-muted-foreground">{t("checkout.cashDesc")}</p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-bold text-base mb-4">{t("checkout.summary")}</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{localized(item, lang, "name")}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("cart.delivery")}</span>
                      <span>
                        {actualDeliveryFee === 0 ? (
                          <span className="text-primary font-medium">{t("cart.free")}</span>
                        ) : (
                          formatPrice(actualDeliveryFee)
                        )}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{t("cart.total")}</span>
                    <span className="font-extrabold text-xl">{formatPrice(actualTotal)}</span>
                  </div>

                  <Button
                    className="w-full mt-5 rounded-full h-12 text-base font-semibold gap-2 shadow-lg shadow-primary/25"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {t("checkout.processing")}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> {t("checkout.confirm")}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" />
                    {t("checkout.secure")}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 mt-4 p-3 bg-primary/5 rounded-xl text-sm text-primary border border-primary/20">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {t("checkout.estimated")} <strong>{estimatedTime}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isProcessing && paymentMethod === "card" && (
        <div className="fixed inset-0 z-[60] safe-top safe-x bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium">{t("checkout.processing")}</p>
        </div>
      )}
    </div>
  );
}