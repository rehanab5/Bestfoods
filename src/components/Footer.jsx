import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Bike } from "lucide-react";
import { restaurantInfo } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useLang } from "@/lib/LanguageContext";
import Logo from "./Logo";

export default function Footer() {
  const { t } = useLang();
  const { data } = useMenuData();
  const locations = data?.locations || [];
  return (
    <footer className="bg-card border-t border-border mt-8">
      <div className="md:max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={38} />
              <span className="font-display text-xl tracking-wide">
                BEST <span className="text-primary">FOODS</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.tagline")}</p>
            <p className="text-sm text-primary font-semibold mt-3">{t("footer.bonApetit")}</p>
            <div className="flex flex-col gap-1.5 mt-3">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t("footer.about")}
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t("footer.contact")}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t("footer.contact")}</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> {restaurantInfo.phone}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> {restaurantInfo.hoursLunch}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> {restaurantInfo.hoursDinner}
              </p>
              <p className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary" /> {t("footer.deliveryMin", restaurantInfo.deliveryMin)}
              </p>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <h4 className="font-bold mb-4">{t("footer.locations")}</h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{loc.name}</p>
                    <p>{loc.address}</p>
                    <p className="flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <a href={`tel:+34${loc.phone.replace(/\s/g, "")}`} className="hover:text-foreground transition-colors">
                        {loc.phone}
                      </a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 mt-10 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Best Foods · Bilbao. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}