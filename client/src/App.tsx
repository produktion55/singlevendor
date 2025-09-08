import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/CartContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/i18n";
import { Layout } from "@/components/Layout";
import { Landing } from "@/pages/Landing";
import { ProductListing } from "@/pages/ProductListing";
import { Profile } from "@/pages/Profile";
import { AdminPanel } from "@/pages/AdminPanel";
import { AddProduct } from "@/pages/admin/AddProduct";
import { ProductManagement } from "@/pages/admin/ProductManagement";
import { EditProduct } from "@/pages/admin/EditProduct";
import { CryptoQrGenerator } from "@/pages/CryptoQrGenerator";
import { IbanGenerator } from "@/pages/IbanGenerator";
import { TotpGenerator } from "@/pages/TotpGenerator";
import { Checkout } from "@/pages/Checkout";
import { Messages } from "@/pages/Messages";
import { ProductDetails } from "@/pages/ProductDetails";
import { MyOrders } from "@/pages/MyOrders";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import TestFormBuilder from "@/pages/TestFormBuilder";

function Router() {
  const { isAuthenticated } = useAuth();

  // Landing page route (without layout)
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={() => <Layout><ProductListing /></Layout>} />
      </Switch>
    );
  }

  // Authenticated routes (with layout)
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ProductListing} />
        <Route path="/shop" component={ProductListing} />
        <Route path="/shop/:category" component={ProductListing} />
        <Route path="/generators" component={ProductListing} />
        <Route path="/generators/:subcategory" component={ProductListing} />
        <Route path="/tools/crypto-qr" component={CryptoQrGenerator} />
        <Route path="/tools/iban" component={IbanGenerator} />
        <Route path="/tools/totp" component={TotpGenerator} />
        <Route path="/totp-generator" component={TotpGenerator} />
        <Route path="/tools/:tool" component={ProductListing} />
        <Route path="/profile" component={Profile} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/messages" component={Messages} />
        <Route path="/orders" component={MyOrders} />
        <Route path="/product/:id" component={ProductDetails} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/admin/add-product" component={AddProduct} />
        <Route path="/admin/products" component={ProductManagement} />
        <Route path="/admin/edit-product/:id">
          {(params) => <EditProduct productId={params.id} />}
        </Route>
        <Route path="/admin/:section" component={AdminPanel} />
        <Route path="/test-form-builder" component={TestFormBuilder} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            <CartProvider>
              <Router />
            </CartProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
