import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Settings, 
  ShoppingBag, 
  Shield, 
  Users,
  FileText,
  CreditCard,
  IdCard,
  QrCode,
  Building,
  UserCheck,
  MessageCircle,
  Package,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isExpanded, onToggle, isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const navigationItems = [
    {
      id: "generator",
      category: t("sidebarGenerator"),
      icon: Settings,
      items: [
        { name: t("navAllGenerators"), path: "/generators" },
        { name: t("navInvoices"), path: "/generators/invoices" },
        { name: t("navStatements"), path: "/generators/statements" },
        { name: t("navCards"), path: "/generators/cards" },
        { name: t("navIdPP"), path: "/generators/id" },
        { name: t("navMisc"), path: "/generators/misc" },
      ],
    },
    {
      id: "tools",
      category: t("sidebarTools"),
      icon: QrCode,
      items: [
        { name: t("navCryptoQR"), path: "/tools/crypto-qr" },
        { name: t("navIbanGenerator"), path: "/tools/iban" },
        { name: t("navTotp"), path: "/tools/totp" },
        { name: t("navNameAddress"), path: "/tools/name-address" },
      ],
    },
    {
      id: "shop",
      category: t("sidebarShop"),
      icon: ShoppingBag,
      items: [
        { name: t("navPsd"), path: "/shop/psd" },
        { name: t("navTutorials"), path: "/shop/tutorials" },
        { name: t("navRealDocs"), path: "/shop/real-docs" },
        { name: t("navLeaks"), path: "/shop/leaks" },
      ],
    },
    {
      id: "account",
      category: t("sidebarAccount"),
      icon: UserCheck,
      items: [
        { name: t("navMyOrders"), path: "/orders" },
        { name: t("navMessages"), path: "/messages" },
      ],
    },
  ];

  // Add admin section only for admin users
  if (user?.role === "admin") {
    navigationItems.push({
      id: "admin",
      category: t("sidebarAdmin"),
      icon: Shield,
      items: [
        { name: t("navSales"), path: "/admin/sales" },
        { name: t("navManageProducts"), path: "/admin/products" },
        { name: t("navAddProduct"), path: "/admin/add-product" },
        { name: t("navAdminSettings"), path: "/admin/settings" },
      ],
    });
  }

  return (
    <div
      className={cn(
        isMobile 
          ? "h-full bg-card text-foreground overflow-y-auto" 
          : "fixed left-0 top-0 h-full bg-card text-foreground border-r border-border shadow-sm z-40 transition-all duration-300 hidden md:block overflow-y-auto",
        !isMobile && (isExpanded ? "w-64" : "w-16")
      )}
    >
      <div className="p-4">
        {/* Toggle Button - Only show on desktop */}
        {!isMobile && (
          <div className="flex items-center mb-8">
            <button
              onClick={onToggle}
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Navigation with collapsible sections */}
        <nav>
          <Accordion type="multiple" defaultValue={navigationItems.map(n => n.id)} className="space-y-1">
            {navigationItems.map((section) => (
              <AccordionItem key={section.id} value={section.id} className="border-b-0">
                <AccordionTrigger className="px-2 py-2">
                  <div className="flex items-center space-x-3">
                    <section.icon className="w-5 h-5" />
                    <span className={cn(
                      "font-medium transition-opacity",
                      !isMobile && !isExpanded && "opacity-0"
                    )}>
                      {section.category}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className={cn(
                  "ml-8 space-y-1",
                  !isMobile && !isExpanded && "opacity-0"
                )}>
                  {section.items.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <div className={cn(
                        "block p-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                        location === item.path && "bg-accent text-accent-foreground"
                      )}>
                        {item.name}
                      </div>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
      </div>
    </div>
  );
}
