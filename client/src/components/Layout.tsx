import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CartSidebar } from "./CartSidebar";
import { Footer } from "./Footer";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ui.sidebarExpanded");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const sidebarWidth = sidebarExpanded ? 256 : 64; // 16rem : 4rem in pixels

  useEffect(() => {
    try {
      localStorage.setItem("ui.sidebarExpanded", JSON.stringify(sidebarExpanded));
    } catch {}
  }, [sidebarExpanded]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar 
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />

      {/* Mobile Menu */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="w-4 h-4" />
      </Button>
          
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar 
            isExpanded={true}
            onToggle={() => {}}
            isMobile={true}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${!isMobile ? (sidebarExpanded ? 'ml-64' : 'ml-16') : 'ml-0'} ${isMobile ? 'w-full' : ''}`}>
        <Header sidebarWidth={isMobile ? 0 : sidebarWidth} />
        
        <main className="p-0 xl:p-6 w-full">
          {children}
        </main>
        
        <Footer />
      </div>

      {/* Cart Sidebar */}
      <CartSidebar />
    </div>
  );
}
