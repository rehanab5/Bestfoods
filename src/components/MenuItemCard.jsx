import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/lib/cartContext.jsx";
import { formatPrice, localized } from "@/lib/menuData";
import { useLang } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function MenuItemCard({ item, index }) {
  const { items, addItem, updateQuantity } = useCart();
  const { lang, t } = useLang();
  const [imageLoaded, setImageLoaded] = useState(false);
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem(item);
    toast.success(`${localized(item, lang, "name")} ${lang === "en" ? "added" : "añadido"}`, { duration: 1500 });
  };

  const handleDecrease = () => {
    updateQuantity(item.id, quantity - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 12) * 0.04, duration: 0.3 }}
      className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base line-clamp-1">{localized(item, lang, "name")}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {localized(item, lang, "description")}
        </p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-extrabold text-primary">{formatPrice(item.price)}</span>

          {quantity === 0 ? (
            <Button
              size="sm"
              className="rounded-full gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4" /> {t("item.add")}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full border-border"
                onClick={handleDecrease}
                aria-label={t("item.reduce")}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="w-6 text-center font-bold text-sm"
              >
                {quantity}
              </motion.span>
              <Button
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={handleAdd}
                aria-label={t("item.addOne")}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}