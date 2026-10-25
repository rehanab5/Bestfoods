import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Bike } from "lucide-react";
import { restaurantInfo } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useLang } from "@/lib/LanguageContext";
import Logo from "@/components/Logo";

export default function About() {
  const { t } = useLang();
  const { data } = useMenuData();
  const locations = data?.locations || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="md:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Logo size={48} />
          <span className="font-display text-2xl tracking-wide">
            BEST <span className="text-primary">FOODS</span>
          </span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          {t("about.title")}
        </h1>

        <div className="prose prose-invert max-w-none space-y-5 text-foreground/90 leading-relaxed">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
          <p>{t("about.p4", restaurantInfo.deliveryMin)}</p>
          <p>{t("about.p5", restaurantInfo.hoursLunch, restaurantInfo.hoursDinner)}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {locations.map((loc) => (
            <div key={loc.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-bold text-base mb-1">{loc.name}</p>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                {loc.address}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                <Phone className="w-4 h-4 text-primary" />
                <a href={`tel:+34${loc.phone.replace(/\s/g, "")}`} className="hover:text-primary transition-colors">
                  {loc.phone}
                </a>
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {restaurantInfo.hoursLunch} · {restaurantInfo.hoursDinner}</span>
          <span className="flex items-center gap-2"><Bike className="w-4 h-4 text-primary" /> {t("about.delivery", restaurantInfo.deliveryMin)}</span>
        </div>

        <Link to="/" className="inline-block mt-8">
          <Button className="rounded-full h-12 px-6">{t("about.viewMenu")}</Button>
        </Link>
      </div>
    </div>
  );
}