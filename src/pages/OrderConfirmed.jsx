import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, MapPin, Clock, Phone, MapPinned } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { restaurantInfo } from "@/lib/menuData";
import { useLang } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";

export default function OrderConfirmed() {
  const { t } = useLang();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("order_id");
  const orderNumber =
    params.get("on") || `BF-${Math.floor(100000 + Math.random() * 900000)}`;
  const [status, setStatus] = useState("received");

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#e67e22", "#e63946", "#f59e0b"],
    });
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const fetchOrder = async () => {
      try {
        const res = await base44.functions.invoke("getOrder", { order_id: orderId });
        const data = res.data || res;
        if (active && data.order?.status) setStatus(data.order.status);
      } catch {
        /* ignore */
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="font-display text-4xl tracking-wide">{t("confirmed.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("confirmed.thanks")}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-5">
              <p className="text-sm text-muted-foreground">{t("confirmed.orderNumber")}</p>
              <p className="text-2xl font-extrabold tracking-wider mt-1">{orderNumber}</p>
              <Badge className="mt-3 bg-primary">{t(`status.${status}`)}</Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("confirmed.estimatedTime")}</p>
                  <p className="text-xs text-muted-foreground">{t("confirmed.mins")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("confirmed.preparingAt")}</p>
                  <p className="text-xs text-muted-foreground">{t("confirmed.preparingAtVal")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("confirmed.help")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("confirmed.helpDesc", restaurantInfo.phone)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {orderId && (
            <Link to={`/track/${orderId}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-full h-12 text-base font-semibold gap-2">
                <MapPinned className="w-4 h-4" /> {t("confirmed.trackOrder")}
              </Button>
            </Link>
          )}
          <Link to="/" className={orderId ? "flex-1" : "w-full"}>
            <Button className="w-full rounded-full h-12 text-base font-semibold gap-2">
              {t("confirmed.orderAgain")} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}