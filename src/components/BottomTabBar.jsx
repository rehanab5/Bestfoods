import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Receipt, Settings } from "lucide-react";
import { useCart } from "@/lib/cartContext.jsx";
import { useLang } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

const TAB_ROOTS = { home: "/", orders: "/orders", settings: "/settings" };
const STORAGE_KEY = "bf_tab_stacks";

function readStacks() {
  const base = { home: [], orders: [], settings: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.keys(TAB_ROOTS).forEach((k) => {
        if (Array.isArray(parsed[k])) base[k] = parsed[k];
      });
    }
  } catch {
    /* ignore */
  }
  return base;
}

function writeStacks(map) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { t } = useLang();
  const [stacks, setStacks] = useState(() => readStacks());
  const stacksRef = useRef(stacks);
  stacksRef.current = stacks;

  const path = location.pathname;
  let activeTab = "home";
  if (path.startsWith("/orders")) activeTab = "orders";
  else if (path.startsWith("/settings")) activeTab = "settings";

  // Persist stack state
  useEffect(() => {
    writeStacks(stacks);
  }, [stacks]);

  // Track in-tab navigation: append new paths to the active tab's stack
  useEffect(() => {
    setStacks((prev) => {
      const arr = prev[activeTab] || [];
      if (arr[arr.length - 1] === path) return prev;
      return { ...prev, [activeTab]: [...arr, path] };
    });
  }, [path, activeTab]);

  const handleTab = (tab) => {
    if (tab === "cart") {
      setIsCartOpen(true);
      return;
    }
    if (tab === activeTab) {
      // Re-selecting the active tab: reset to root and clear its stack
      setStacks((prev) => ({ ...prev, [tab]: [] }));
      navigate(TAB_ROOTS[tab]);
      return;
    }
    // Switching tabs: push the current path to the active tab's stack
    setStacks((prev) => {
      const arr = prev[activeTab] || [];
      if (arr[arr.length - 1] === path) return prev;
      return { ...prev, [activeTab]: [...arr, path] };
    });
    const target = (stacksRef.current[tab] || []).at(-1) || TAB_ROOTS[tab];
    navigate(target);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/60 md:hidden safe-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        <TabButton
          icon={Home}
          label={t("nav.home")}
          active={activeTab === "home"}
          onClick={() => handleTab("home")}
        />
        <TabButton
          icon={ShoppingBag}
          label={t("nav.cart")}
          badge={totalItems}
          onClick={() => handleTab("cart")}
        />
        <TabButton
          icon={Receipt}
          label={t("nav.orders")}
          active={activeTab === "orders"}
          onClick={() => handleTab("orders")}
        />
        <TabButton
          icon={Settings}
          label={t("nav.settings")}
          active={activeTab === "settings"}
          onClick={() => handleTab("settings")}
        />
      </div>
    </nav>
  );
}

function TabButton({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] text-muted-foreground"
    >
      {active && <span className="absolute top-0 h-1 w-8 bg-primary rounded-full" />}
      <div className="relative">
        <Icon className={cn("w-6 h-6", active && "text-primary")} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className={cn("text-xs font-medium", active && "text-primary")}>
        {label}
      </span>
    </button>
  );
}