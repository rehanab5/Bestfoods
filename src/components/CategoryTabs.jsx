import React from "react";
import { categories } from "@/lib/menuData";
import { useLang } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function CategoryTabs({ activeCategory, onCategoryChange }) {
  const { lang, t } = useLang();
  const labelFor = (cat) => (lang === "en" ? cat.label_en : cat.label);

  return (
    <div className="sticky top-16 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="md:max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex gap-1 overflow-x-auto py-3 no-scrollbar">
          <TabButton
            label={t("menu.all")}
            emoji="✨"
            isActive={activeCategory === "all"}
            onClick={() => onCategoryChange("all")}
          />
          {categories.map((cat) => (
            <TabButton
              key={cat.id}
              label={labelFor(cat)}
              emoji={cat.emoji}
              isActive={activeCategory === cat.id}
              onClick={() => onCategoryChange(cat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, emoji, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
        isActive
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeCategory"
          className="absolute inset-0 bg-primary text-primary-foreground rounded-full shadow-[0_5px_14px_hsl(var(--primary)/24%)]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10">{emoji}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}