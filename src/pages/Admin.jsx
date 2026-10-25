import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ArrowLeft, UtensilsCrossed, MapPin, Star } from "lucide-react";
import MenuItemsManager from "@/components/admin/MenuItemsManager";
import LocationsManager from "@/components/admin/LocationsManager";
import ReviewsManager from "@/components/admin/ReviewsManager";

const TABS = [
  { id: "menu", label: "Menú", icon: UtensilsCrossed, Component: MenuItemsManager },
  { id: "locations", label: "Locales", icon: MapPin, Component: LocationsManager },
  { id: "reviews", label: "Reseñas", icon: Star, Component: ReviewsManager },
];

export default function Admin() {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin, logout } = useAuth();
  const [tab, setTab] = useState("menu");

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) navigateToLogin();
  }, [isLoadingAuth, isAuthenticated, navigateToLogin]);

  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="text-muted-foreground max-w-sm">Necesitas una cuenta de administrador para acceder a este panel.</p>
        <Button onClick={() => navigateToLogin()}>Iniciar sesión con otra cuenta</Button>
      </div>
    );
  }

  const Active = TABS.find((t) => t.id === tab)?.Component || MenuItemsManager;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur safe-top">
        <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍕</span>
            <span className="font-display text-lg font-semibold">Best Foods · Panel</span>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4 mr-1.5" />Ver web</Link></Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}><LogOut className="h-4 w-4 mr-1.5" />Salir</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 safe-x">
        <nav className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <Active />
      </div>
    </div>
  );
}