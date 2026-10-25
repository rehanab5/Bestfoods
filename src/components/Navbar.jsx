import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Phone, ArrowLeft, Settings, Languages, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cartContext.jsx";
import { restaurantInfo } from "@/lib/menuData";
import { useLang } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const iconBtn =
  "rounded-full border border-border bg-card text-primary hover:bg-secondary hover:text-primary min-h-[44px] min-w-[44px]";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, toggle } = useLang();
  const isRoot = location.pathname === "/";
  const showCart =
    location.pathname !== "/checkout" && location.pathname !== "/order-confirmed";

  const handleBack = () => {
    // Go back in browser history when a previous entry exists (normal in-app
    // navigation and refreshes keep working). On a deep link or fresh open
    // there's no history to return to, so fall back to home — keeping back
    // behavior correct after deep links and refreshes.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border safe-top">
      <div className="md:max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {!isRoot && (
              <Button
                variant="ghost"
                size="icon"
                className={iconBtn}
                onClick={handleBack}
                aria-label={t("nav.back")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2.5" aria-label="Best Foods">
              {isRoot && <Logo size={38} />}
              <div className="leading-none">
                <span className="font-display text-base sm:text-lg md:text-xl text-foreground">
                  Best <span className="text-primary">Foods</span>
                </span>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-0.5 hidden sm:block">
                  Kebab · Bilbao
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            <a href="tel:+34946290937" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <span>{restaurantInfo.phone}</span>
            </a>
            <span className="text-border">·</span>
            <span>{t("nav.delivery")}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-card font-semibold px-2.5 sm:px-3 gap-1.5 min-h-[44px] hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={toggle}
              aria-label={`Change language, current: ${lang.toUpperCase()}`}
            >
              <Languages className="w-4 h-4 text-primary" />
              {lang.toUpperCase()}
            </Button>
            <Link to="/orders" className="hidden md:flex" aria-label={t("orders.title")}>
              <Button variant="outline" size="icon" className={iconBtn} aria-label={t("orders.title")}>
                <Receipt className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/settings" aria-label={t("nav.settings")}>
              <Button variant="outline" size="icon" className={iconBtn} aria-label={t("nav.settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            {showCart && (
              <Button
                variant="outline"
                size="icon"
                className={`relative ${iconBtn}`}
                onClick={() => setIsCartOpen(true)}
                aria-label={t("nav.cartAria", totalItems)}
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}