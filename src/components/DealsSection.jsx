import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, localized } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useCart } from "@/lib/cartContext.jsx";
import { useLang } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function DealsSection() {
  const { addItem } = useCart();
  const { lang, t } = useLang();
  const { data, isLoading } = useMenuData();
  const deals = data?.deals || [];

  // Store the Spanish `name` (matches server-side price validation) plus the
  // English variant so the cart can display the localized name.
  const handleAddDeal = (deal) => {
    addItem({
      id: deal.id,
      name: deal.name,
      name_en: deal.name_en,
      price: deal.price,
      image: deal.image,
    });
    toast.success(
      `${localized(deal, lang, "name")} ${lang === "en" ? "added to cart" : "añadido a la cesta"}`,
      { duration: 1500 }
    );
  };

  return (
    <section className="py-12 px-4 md:px-6 bg-card border-b border-border">
      <div className="md:max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-7">
          <h2 className="font-display text-3xl md:text-4xl">{t("deals.title")}</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Doner Kebab · Durum · Lahmacun · Falafel
          </p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={deal.image}
                    alt={localized(deal, lang, "name")}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
                    {deal.badge}
                  </Badge>
                </div>
                <div className="p-3 sm:p-3.5">
                  <h3 className="font-bold text-sm leading-tight">{localized(deal, lang, "name")}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {localized(deal, lang, "description")}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-extrabold text-accent text-lg">{formatPrice(deal.price)}</span>
                    <Button
                      size="sm"
                      className="rounded-full text-xs h-10 min-h-[44px] px-3 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddDeal(deal)}
                    >
                      {t("item.add")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}