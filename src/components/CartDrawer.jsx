import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cartContext.jsx";
import { formatPrice, restaurantInfo, localized } from "@/lib/menuData";
import { useLang } from "@/lib/LanguageContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    subtotal,
    deliveryFee,
    total,
    totalItems,
  } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {t("cart.title")}
            {totalItems > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {t("cart.items", totalItems)}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{t("cart.empty")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("cart.emptyDesc")}</p>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setIsCartOpen(false)}
            >
              {t("cart.viewMenu")}
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="py-4 border-b border-border/50 last:border-0"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm truncate">{localized(item, lang, "name")}</h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label={t("cart.remove")}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-11 w-11 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label={t("cart.minus")}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-5 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              className="h-11 w-11 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label={t("item.addOne")}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="font-bold text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>

            <div className="border-t border-border/60 bg-secondary/30 px-6 py-5 space-y-3 safe-bottom">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.delivery")}</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? (
                    <span className="text-primary">{t("cart.free")}</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-bold">{t("cart.total")}</span>
                <span className="font-extrabold text-lg">{formatPrice(total)}</span>
              </div>
              <Button
                className="w-full rounded-full text-base font-semibold gap-2 h-12 shadow-lg shadow-primary/25"
                onClick={handleCheckout}
              >
                {t("cart.checkout")} <ArrowRight className="w-4 h-4" />
              </Button>
              {deliveryFee > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {t("cart.freeDeliveryMsg", formatPrice(restaurantInfo.freeDeliveryOver - subtotal))}
                </p>
              )}
              <p className="text-xs text-center text-muted-foreground">
                {t("cart.taxNote", restaurantInfo.deliveryMin)}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}