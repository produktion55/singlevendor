import React, { useState } from "react";
import { useLocation } from "wouter";
import { Search, ShoppingCart, Bell, Wallet, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotifications";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/i18n";

interface HeaderProps {
  sidebarWidth: number;
}

export function Header({ sidebarWidth }: HeaderProps) {
  const { user, logout } = useAuth();
  const { itemCount, setIsOpen } = useCart();
  const { notifications, unreadCount, markAsRead, formatNotificationTime } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const handleCartClick = () => {
    setIsOpen(true);
  };

  const handleWalletClick = () => {
    setLocation("/profile?tab=balance");
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <header 
      className="bg-card border-b border-border text-foreground px-3 md:px-6 py-3 md:py-4 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xs md:max-w-md md:ml-0 ml-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={t("searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Cart */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={handleCartClick}
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {t("noNotifications")}
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={`p-3 cursor-pointer hover:bg-accent ${!notification.isRead ? 'bg-accent' : ''}`}
                    onClick={() => {
                      // Mark as read when clicked
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      
                      // Navigate based on notification type
                      if (notification.type === "transaction") {
                        setLocation("/profile?tab=transactions");
                      } else if (notification.type === "order" && notification.orderId) {
                        setLocation(`/profile?tab=orders&order=${notification.orderId}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className={`font-medium ${!notification.isRead ? 'text-foreground' : ''}`}>
                          {notification.title}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatNotificationTime(notification.createdAt)}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 5 && (
                <DropdownMenuItem 
                  className="p-3 text-center border-t"
                  onClick={() => setLocation("/notifications")}
                >
                  {t("viewAllNotifications")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Wallet Balance */}
          {user && (
            <Button
              variant="ghost"
              onClick={handleWalletClick}
              className="flex items-center space-x-2 bg-muted hover:bg-accent rounded-lg px-3 py-2 h-auto"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-inter text-sm font-medium">€{user.balance}</span>
            </Button>
          )}

          {/* Profile Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={() => setLocation("/profile?tab=orders")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
