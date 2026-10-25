import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, CreditCard, Receipt, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/LanguageContext";
import { formatPrice } from "@/lib/menuData";
import PullToRefreshWrapper from "@/components/PullToRefreshWrapper";

const STATUS_STEPS = ["received", "preparing", "ready", "delivered"];

export default function OrderTracking() {
  const { orderId } = useParams();
  const { t } = useLang();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const fetchOrder = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await base44.functions.invoke("getOrder", { order_id: orderId });
      const data = res.data || res;
      setOrder(data.order || null);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    timerRef.current = setInterval(() => fetchOrder(true), 5000);

    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (!timerRef.current) {
        timerRef.current = setInterval(() => fetchOrder(true), 5000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold">{t("track.notFound")}</p>
        <Link to="/orders">
          <Button variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> {t("track.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const status = order.status || "received";
  const stepIndex = STATUS_STEPS.indexOf(status);
  const isCancelled = status === "cancelled";

  return (
    <div className="min-h-screen bg-background">
      <PullToRefreshWrapper onRefresh={() => fetchOrder(true)} className="md:max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl tracking-wide">{t("track.title")}</h1>
          {refreshing && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3 animate-spin" /> {t("track.refresh")}
            </span>
          )}
        </div>

        <Card className="mb-5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("track.orderNumber")}</p>
                <p className="text-xl font-extrabold tracking-wider">{order.order_number}</p>
              </div>
              <Badge className={isCancelled ? "bg-destructive" : "bg-primary"}>
                {t(`status.${status}`)}
              </Badge>
            </div>
            {order.created_date && (
              <p className="text-xs text-muted-foreground">
                {t("track.placed")}: {new Date(order.created_date).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-5">
          <CardContent className="p-5">
            <div className="flex items-start">
              {STATUS_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-2 w-14">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        i <= stepIndex && !isCancelled
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs font-medium text-center leading-tight ${
                        i <= stepIndex && !isCancelled ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {t(`status.${s}`)}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mt-5 rounded-full ${
                        i < stepIndex && !isCancelled ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-5">
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> {t("track.items")}
            </h3>
            <div className="space-y-2">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {it.quantity}× {it.name}
                  </span>
                  <span className="font-medium">{formatPrice(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-border/60 text-base">
              <span className="font-bold">{t("track.total")}</span>
              <span className="font-extrabold">{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("track.location")}</p>
                <p className="text-sm font-medium">{order.location_name || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("track.payment")}</p>
                <p className="text-sm font-medium">{t(`pay.${order.payment_status || "pending"}`)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Link to="/orders" className="block">
          <Button variant="outline" className="w-full rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> {t("track.back")}
          </Button>
        </Link>
      </PullToRefreshWrapper>
    </div>
  );
}