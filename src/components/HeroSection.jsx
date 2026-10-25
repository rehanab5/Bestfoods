import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Clock, Bike } from "lucide-react";
import { motion } from "framer-motion";
import { restaurantInfo } from "@/lib/menuData";
import { useLang } from "@/lib/LanguageContext";
import Logo from "./Logo";

export default function HeroSection({ onOrderNow }) {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden bg-secondary border-b border-border">
      <div className="absolute right-[8%] top-6 w-[28rem] h-[28rem] rounded-full bg-primary/10 pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-[24rem] h-[24rem] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      <div className="relative md:max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.75, 0.25, 1] }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Logo size={52} />
              <div>
                <h1 className="font-display text-4xl sm:text-5xl leading-none">
                  Best <span className="text-primary">Foods</span>
                </h1>
                <p className="text-xs uppercase tracking-[0.18em] text-primary font-bold mt-1.5">
                  {t("hero.tagline")}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Bike className="w-4 h-4 text-primary" />
              {t("hero.deliveryFrom", restaurantInfo.deliveryMin)}
            </div>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              {t("hero.desc")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25"
                onClick={onOrderNow}
              >
                {t("hero.order")} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 text-base font-semibold border-border bg-card text-primary hover:bg-secondary"
                onClick={onOrderNow}
              >
                {t("hero.menu")}
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                {t("hero.hours", restaurantInfo.hoursLunch, restaurantInfo.hoursDinner)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {t("hero.locations")}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.2, 0.75, 0.25, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="relative aspect-[4/3] max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-border"
            >
              <img
                src="https://images.unsplash.com/photo-1639737611208-a01d87b78605?w=800&h=600&fit=crop"
                alt="Doner kebab"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-card/95 backdrop-blur rounded-2xl shadow-xl p-3 border border-border"
            >
              <p className="font-display text-primary font-semibold text-sm">Doner Kebab</p>
              <p className="text-xs text-muted-foreground">{t("hero.specialty")}</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}