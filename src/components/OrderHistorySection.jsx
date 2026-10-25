import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, RotateCw, Loader2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/lib/cartContext.jsx";
import { useLang } from "@/lib/LanguageContext";
import { formatPrice } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { getOrderIds } from "@/lib/orderStorage";
import { toast } from "sonner";

export default function OrderHistorySection() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { items: cartItems, addItem, updateQuantity, clearCart, restoreItems } = useCart();
  const { data: menuData } = useMenuData();
  const menuItems = menuData?.items || [];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getOrderIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await base44.functions.invoke("getOrders", { ids });
        const data = res.data || res;
        setOrders((data.orders || []).slice(0, 3));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReorder = (order) => {
    const snapshot = cartItems;
    try {
      clearCart();
      (order.items || []).forEach((oi) => {
        const m = menuItems.find((mi) => mi.name === oi.name);
        const id = m?.id || `r-${oi.name}`;
        addItem({ id, name: oi.name, price: oi.price, image: m?.image || menuItems[0]?.image || "" });
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
      <Card>
        <CardContent className="p-5 flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <p className="font-bold text-base">{t("orders.title")}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary gap-1"
            onClick={() => navigate("/orders")}
          >
            {t("orders.viewAll")} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-3">
          {orders.map((o) => {
            const itemCount = (o.items || []).reduce((s, i) => s + i.quantity, 0);
            return (
              <div key={o.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {o.created_date ? new Date(o.created_date).toLocaleDateString() : ""}
                    </p>
                    <p className="font-semibold text-sm">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("orders.items", itemCount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={o.status === "cancelled" ? "bg-destructive" : "bg-primary"}>
                      {t(`status.${o.status || "received"}`)}
                    </Badge>
                    <p className="font-extrabold text-sm mt-1">{formatPrice(o.total)}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full w-full gap-1.5 mt-1"
                  onClick={() => handleReorder(o)}
                >
                  <RotateCw className="w-3.5 h-3.5" /> {t("orders.reorder")}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}