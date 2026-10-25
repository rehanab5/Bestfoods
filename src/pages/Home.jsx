import React, { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import PullToRefreshWrapper from "@/components/PullToRefreshWrapper";
import HeroSection from "@/components/HeroSection";
import DealsSection from "@/components/DealsSection";
import CategoryTabs from "@/components/CategoryTabs";
import MenuGrid from "@/components/MenuGrid";
import Locations from "@/components/Locations";
import Footer from "@/components/Footer";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const menuRef = useRef(null);

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Carta actualizada");
  }, []);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh} className="min-h-screen">
      <HeroSection onOrderNow={scrollToMenu} />
      <DealsSection />
      <div ref={menuRef}>
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <MenuGrid activeCategory={activeCategory} />
      </div>
      <Locations />
      <Footer />
    </PullToRefreshWrapper>
  );
}