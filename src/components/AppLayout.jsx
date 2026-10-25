import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import CartDrawer from "./CartDrawer";
import BottomTabBar from "./BottomTabBar";
import { useCart } from "@/lib/cartContext.jsx";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppLayout() {
  const location = useLocation();
  const { isCartOpen } = useCart();
  const isMobile = useIsMobile();
  const isTabRoute =
    location.pathname !== "/checkout" && location.pathname !== "/order-confirmed";
  const showTabBar = isTabRoute && !isCartOpen;

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className={`safe-x ${isTabRoute ? "pb-16 md:pb-0 safe-bottom" : ""}`}>
        <AnimatePresence mode={isMobile ? "popLayout" : "wait"}>
          <motion.div
            key={location.pathname}
            initial={isMobile ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={isMobile ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: isMobile ? 0.2 : 0.25, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {showTabBar && <BottomTabBar />}
    </>
  );
}