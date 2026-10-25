import React, { useState } from "react";
import { restaurantInfo } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useLang } from "@/lib/LanguageContext";
import { MapPin, Phone, Clock, Bike, Navigation, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getUserLocation, haversineDistance, estimateDriveTime } from "@/lib/geo";
import { toast } from "sonner";

export default function Locations() {
  const { t } = useLang();
  const { data, isLoading } = useMenuData();
  const locations = data?.locations || [];
  const [distances, setDistances] = useState({});
  const [locating, setLocating] = useState(false);
  const [nearestId, setNearestId] = useState(null);

  const handleUseLocation = async () => {
    setLocating(true);
    try {
      const pos = await getUserLocation();
      const withDist = locations.map((l) => ({
        id: l.id,
        km: haversineDistance(pos.lat, pos.lng, l.lat, l.lng),
      }));
      const nearest = withDist.reduce((a, b) => (a.km < b.km ? a : b));
      const map = {};
      withDist.forEach((d) => {
        map[d.id] = { km: d.km, min: estimateDriveTime(d.km) };
      });
      setDistances(map);
      setNearestId(nearest.id);
      toast.success(t("location.nearest"));
    } catch {
      toast.error(t("location.denied"));
    } finally {
      setLocating(false);
    }
  };

  return (
    <section className="py-14 px-4 md:px-6 bg-muted border-t border-border">
      <div className="md:max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-2">
            {t("locations.findUs")}
          </p>
          <h2 className="font-display text-4xl tracking-wide">{t("locations.title")}</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            {t("locations.subtitle", restaurantInfo.deliveryMin)}
          </p>
          <button
            onClick={handleUseLocation}
            disabled={locating || locations.length === 0}
            className="mt-5 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? t("location.detecting") : t("location.useMyLocation")}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {locations.map((loc, i) => {
              const d = distances[loc.id];
              const isNearest = nearestId === loc.id;
              return (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`bg-card rounded-2xl border p-5 transition-all ${
                    isNearest
                      ? "border-primary ring-1 ring-primary/40"
                      : "border-border/70 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center font-display text-primary text-sm">
                      {i + 1}
                    </div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {loc.area}
                    </span>
                    {isNearest && (
                      <span className="ml-auto text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {t("location.nearest")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-2">{loc.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{loc.address}</span>
                    </p>
                    <a
                      href={`tel:+34${loc.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{loc.phone}</span>
                    </a>
                    {d && (
                      <p className="flex items-center gap-2 text-primary font-medium">
                        <Navigation className="w-4 h-4 flex-shrink-0" />
                        <span>{d.km.toFixed(1)} km · ~{d.min} min</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid sm:grid-cols-3 gap-4 md:max-w-3xl mx-auto">
          <InfoTile icon={<Phone className="w-5 h-5" />} title={t("locations.phone")} value={restaurantInfo.phone} />
          <InfoTile icon={<Clock className="w-5 h-5" />} title={t("locations.hours")} value={`${restaurantInfo.hoursLunch} · ${restaurantInfo.hoursDinner}`} />
          <InfoTile icon={<Bike className="w-5 h-5" />} title={t("locations.delivery")} value={t("locations.deliveryVal", restaurantInfo.deliveryMin)} />
        </div>
      </div>
    </section>
  );
}

function InfoTile({ icon, title, value }) {
  return (
    <div className="flex items-center gap-3 bg-secondary/60 rounded-xl p-4 border border-border/60">
      <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
}