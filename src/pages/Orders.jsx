import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/lib/cartContext.jsx";
import { useLang } from "@/lib/LanguageContext";
import { formatPrice } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { getOrderIds } from "@/lib/orderStorage";
import PullToRefreshWrapper from "@/components/PullToRefreshWrapper";
import { toast } from "sonner";

export default function Orders() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { items: cartItems, addItem, updateQuantity, clearCart, restoreItems } = useCart();
  const { data: menuData } = useMenuData();
  const menuItems = menuData?.items || [];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const ids = getOrderIds();
    if (ids.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const res = await base44.functions.invoke("getOrders", { ids });
      const data = res.data || res;
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleReorder = (order) => {
    const snapshot = cartItems;
    try {
      clearCart();
      (order.items || []).forEach((oi) => {
        const m = menuItems.find((mi) => mi.name === oi.name);
        const id = m?.id || `r-${oi.name}`;
        const item = {
          id,
          name: oi.name,
          price: oi.price,
          image: m?.image || menuItems[0]?.image || "",
        };
        addItem(item);
        updateQuantity(id, oi.quantity);
      });
      toast.success(t("orders.reorderToast"));
      navigate("/checkout");
    } catch (e) {
      restoreItems(snapshot);
      toast.error(t("orders.reorderToast"));
      throw e;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PullToRefreshWrapper onRefresh={fetchOrders} className="md:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <h1 className="font-display text-4xl tracking-wide mb-8">{t("orders.title")}</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{t("orders.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("orders.emptyDesc")}</p>
            </div>
            <Link to="/">
              <Button className="rounded-full gap-2">
                {t("hero.order")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {o.created_date ? new Date(o.created_date).toLocaleDateString() : ""}
                      </p>
                      <p className="font-bold text-base">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("orders.items", (o.items || []).reduce((s, i) => s + i.quantity, 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={o.status === "cancelled" ? "bg-destructive" : "bg-primary"}>
                        {t(`status.${o.status || "received"}`)}
                      </Badge>
                      <p className="font-extrabold text-lg mt-1">{formatPrice(o.total)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex-1"
                      onClick={() => navigate(`/track/${o.id}`)}
                    >
                      {t("orders.track")}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full flex-1"
                      onClick={() => handleReorder(o)}
                    >
                      {t("orders.reorder")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PullToRefreshWrapper>
    </div>
  );
}