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

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isExpanded, onToggle, isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      category: "Generator",
      icon: Settings,
      items: [
        { name: "All Generators", path: "/generators" },
        { name: "Invoices", path: "/generators/invoices" },
        { name: "Kontoauszug", path: "/generators/statements" },
        { name: "Karten", path: "/generators/cards" },
        { name: "ID & PP", path: "/generators/id" },
        { name: "Misc", path: "/generators/misc" },
      ],
    },
    {
      category: "Tools",
      icon: QrCode,
      items: [
        { name: "Crypto QR Code", path: "/tools/crypto-qr" },
        { name: "IBAN Generator", path: "/tools/iban" },
        { name: "TOTP Authenticator", path: "/tools/totp" },
        { name: "Name & Address", path: "/tools/name-address" },
      ],
    },
    {
      category: "Shop",
      icon: ShoppingBag,
      items: [
        { name: "PSD", path: "/shop/psd" },
        { name: "Tutorials", path: "/shop/tutorials" },
        { name: "Real Docs", path: "/shop/real-docs" },
        { name: "Leaks", path: "/shop/leaks" },
      ],
    },
    {
      category: "Account",
      icon: UserCheck,
      items: [
        { name: "My Orders", path: "/orders" },
        { name: "Messages", path: "/messages" },
      ],
    },
  ];

  // Add admin section only for admin users
  if (user?.role === "admin") {
    navigationItems.push({
      category: "Admin",
      icon: Shield,
      items: [
        { name: "Sales", path: "/admin/sales" },
        { name: "Manage Products", path: "/admin/products" },
        { name: "Add Product", path: "/admin/add-product" },
        { name: "Admin Settings", path: "/admin/settings" },
      ],
    });
  }

  return (
    <div
      className={cn(
        isMobile 
          ? "h-full bg-white" 
          : "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-40 transition-all duration-300 hidden md:block",
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

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((section) => (
            <div key={section.category} className="space-y-1">
              <div className="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                <section.icon className="w-5 h-5" />
                <span className={cn(
                  "font-medium transition-opacity",
                  !isMobile && !isExpanded && "opacity-0"
                )}>
                  {section.category}
                </span>
              </div>
              
              <div className={cn(
                "ml-8 space-y-1 transition-opacity",
                !isMobile && !isExpanded && "opacity-0"
              )}>
                {section.items.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div className={cn(
                      "block p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors",
                      location === item.path && "text-blue-600 bg-blue-50"
                    )}>
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
