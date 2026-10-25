import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/LanguageContext';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CartProvider } from '@/lib/cartContext.jsx';
import AppLayout from '@/components/AppLayout';

const Home = lazy(() => import('@/pages/Home'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderConfirmed = lazy(() => import('@/pages/OrderConfirmed'));
const Settings = lazy(() => import('@/pages/Settings'));
const Orders = lazy(() => import('@/pages/Orders'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Admin = lazy(() => import('@/pages/Admin'));

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}

function AnimatedRoutes() {
  return (
    <AnimatePresence>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmed" element={<OrderConfirmed />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-xl">🍕</span>
          </div>
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <CartProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <AnimatedRoutes />
      </Suspense>
      <SonnerToaster position="top-center" richColors />
    </CartProvider>
  );
};

function App() {
  const isAndroidWebView =
    typeof navigator !== "undefined" &&
    /Android/.test(navigator.userAgent) &&
    /wv/.test(navigator.userAgent);
  // iOS WKWebView: an iOS device whose UA lacks "Safari" (browsers on iOS
  // include "Safari"; an embedded WKWebView does not). Force dark for every
  // WebView environment, Android and iOS alike.
  const isIOSWebView =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !/Safari/.test(navigator.userAgent);
  const isWebView = isAndroidWebView || isIOSWebView;

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem forcedTheme={isWebView ? "dark" : undefined} disableTransitionOnChange>
          <LanguageProvider>
            <Router>
              <AuthenticatedApp />
            </Router>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App