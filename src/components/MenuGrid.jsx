import React from "react";
import { categories } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useLang } from "@/lib/LanguageContext";
import MenuItemCard from "./MenuItemCard";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function MenuGrid({ activeCategory }) {
  const { t, lang } = useLang();
  const { data, isLoading } = useMenuData();
  const menuItems = data?.items || [];

  const filtered =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const label =
    activeCategory === "all"
      ? t("menu.all")
      : (() => {
          const cat = categories.find((c) => c.id === activeCategory);
          return cat ? (lang === "en" ? cat.label_en : cat.label) : "";
        })();

  return (
    <section className="py-8 px-4 md:px-6">
      <div className="md:max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-3xl tracking-wide">{label.toUpperCase()}</h2>
          <span className="text-sm text-muted-foreground">{t("menu.dishes", filtered.length)}</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((item, i) => (
                <MenuItemCard key={item.id} item={item} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}