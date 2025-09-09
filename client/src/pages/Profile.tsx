import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Transaction, type Order, type Product } from "@shared/schema";
import { Plus, Minus, RefreshCw, Wallet, User, Settings, Shield, Lock, Phone, Download, Copy, Eye, CheckCircle, AlertCircle, MessageCircle, ArrowUpRight, ArrowDownLeft, Bitcoin, DollarSign } from "lucide-react";
import { BitcoinIcon, LitecoinIcon, MoneroIcon } from "@/components/icons/CryptoIcons";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";

export function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize with tab from URL params if available
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    return (tab && ['orders', 'balance', 'transactions', 'settings'].includes(tab)) ? tab : 'orders';
  });

  const [orderFilter, setOrderFilter] = useState("all");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [isTotpEnabled, setIsTotpEnabled] = useState(false);
  const [contactMethods, setContactMethods] = useState({
    telegram: (user as any)?.telegramUsername || "",
    threema: (user as any)?.threemaUsername || "",
    signal: (user as any)?.signalUsername || "",
    session: (user as any)?.sessionUsername || ""
  });

  // Update TOTP status and contact methods when user data changes
  useEffect(() => {
    if (user) {
      setIsTotpEnabled((user as any)?.totpEnabled || false);
      setContactMethods({
        telegram: (user as any)?.telegramUsername || "",
        threema: (user as any)?.threemaUsername || "",
        signal: (user as any)?.signalUsername || "",
        session: (user as any)?.sessionUsername || ""
      });
    }
  }, [user]);

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/user", user?.id],
    enabled: !!user?.id,
  });

  // Handle URL search params for direct tab navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    const orderId = searchParams.get('order');
    
    if (tab && ['orders', 'balance', 'transactions', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
    
    // If there's a specific order ID, open that order's details
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        handleOrderDetails(order);
      }
    }
  }, [orders]);

  // Listen for URL changes (including programmatic navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      if (tab && ['orders', 'balance', 'transactions', 'settings'].includes(tab)) {
        setActiveTab(tab);
      }
    };

    // Listen for browser back/forward
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for programmatic navigation (like clicking the wallet)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const handleOrderDetails = (order: Order) => {
    const product = getProductDetails(order.productId);
    setSelectedOrder(order);
    setSelectedProduct(product || null);
    setIsOrderModalOpen(true);
  };

  const handleSupportMessage = (orderId: string) => {
    // Navigate to messages and create support conversation
    setLocation(`/messages?new=support&order=${orderId}`);
    setIsOrderModalOpen(false);
  };

  const handleRefundRequest = (orderId: string) => {
    // Navigate to messages and create refund conversation
    setLocation(`/messages?new=refund&order=${orderId}`);
    setIsOrderModalOpen(false);
  };

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (orderFilter === "all") return true;
    if (orderFilter === "delivered") return order.status === "delivered";
    if (orderFilter === "processing") return order.status === "processing";
    if (orderFilter === "in_resolution") return order.status === "in_resolution";
    if (orderFilter === "refunded") return order.status === "refunded";
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "purchase":
        return <ArrowUpRight className="w-4 h-4" />;
      case "refund":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-600 bg-green-100";
      case "purchase":
        return "text-red-600 bg-red-100";
      case "refund":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-600";
      case "purchase":
        return "text-red-600";
      case "refund":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const handleContactMethodsUpdate = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, {
        telegramUsername: contactMethods.telegram,
        threemaUsername: contactMethods.threema,
        signalUsername: contactMethods.signal,
        sessionUsername: contactMethods.session
      });

      if (response.ok) {
        // Invalidate user cache to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        
        toast({
          title: "Success",
          description: "Contact methods have been updated successfully."
        });
      } else {
        throw new Error("Failed to update contact methods");
      }
    } catch (error) {
      console.error("Contact methods update error:", error);
      toast({
        title: "Error",
        description: "Failed to update contact methods. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, {
        password: newPassword
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password has been updated successfully."
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error("Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTotpSetup = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/auth/totp/setup", {
        userId: user.id
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setTotpSecret(data.secret);
        setShowTotpSetup(true);
      } else {
        throw new Error("Failed to setup TOTP");
      }
    } catch (error) {
      console.error("TOTP setup error:", error);
      toast({
        title: "Error",
        description: "Failed to setup TOTP. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTotpVerify = async () => {
    if (!user?.id || !totpToken) {
      toast({
        title: "Error",
        description: "Please enter the verification code.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/auth/totp/verify", {
        userId: user.id,
        token: totpToken
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Two-factor authentication has been enabled successfully!"
        });
        setShowTotpSetup(false);
        setIsTotpEnabled(true);
        setTotpToken("");
        setQrCode("");
        setTotpSecret("");
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("TOTP verify error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify TOTP code.",
        variant: "destructive"
      });
    }
  };

  const handleTotpDisable = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/auth/totp/disable", {
        userId: user.id
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Two-factor authentication has been disabled."
        });
        setIsTotpEnabled(false);
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        throw new Error("Failed to disable TOTP");
      }
    } catch (error) {
      console.error("TOTP disable error:", error);
      toast({
        title: "Error",
        description: "Failed to disable TOTP. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-full mx-auto px-0 xl:px-6 text-center py-12">
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-0 xl:px-6">
      <div className="mb-4 xl:mb-8 px-3 xl:px-0">
        <h1 className="text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Account</h1>
        <p className="text-base xl:text-lg text-gray-600 dark:text-gray-400">
          Manage your account, orders, and settings
        </p>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 dark:border-gray-800">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Orders Tab */}
          <TabsContent value="orders" className="p-3 xl:p-6">
            <div className="space-y-6">
              {/* Filter */}
              <div className="flex items-center space-x-4">
                <Label htmlFor="order-filter" className="text-sm font-medium">Filter:</Label>
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="delivered">Generated/Delivered</SelectItem>
                    <SelectItem value="processing">Generating/Shipping</SelectItem>
                    <SelectItem value="in_resolution">In Resolution</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orders List */}
              <div className="space-y-2">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders found
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const product = getProductDetails(order.productId);
                    const statusText = order.status === "delivered" ? "Delivered" : 
                                     order.status === "processing" ? "Processing" :
                                     order.status === "in_resolution" ? "In Resolution" : 
                                     order.status === "refunded" ? "Refunded" : "Unknown";
                    
                    return (
                      <Card key={order.id} className="border">
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-start justify-between">
                            {/* Left side - Product and Order info */}
                            <div className="flex-1">
                              {/* Product Title */}
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {product?.title || "Unknown Product"}
                              </h3>
                              
                              {/* Two-line layout */}
                              <div className="space-y-1">
                                {/* First line: Placed on date */}
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true
                                  }) : 'N/A'}
                                </div>
                                
                                {/* Second line: Status and updated date */}
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {statusText} {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric', 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: true
                                    }) : (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric', 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'N/A')}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Order ID - Mobile only */}
                              <div className="md:hidden text-xs text-gray-500 mt-2">
                                Order #{order.id.slice(-8)}
                              </div>
                            </div>
                            
                            {/* Right side - Action Buttons */}
                            <div className="ml-4 flex flex-col items-end space-y-2">
                              {/* Status Badge */}
                              <div>
                                {order.status === "delivered" && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 font-mono">#{order.id.slice(-8)}</span>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Delivered
                                    </Badge>
                                  </div>
                                )}
                                {order.status === "processing" && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Processing
                                  </Badge>
                                )}
                                {order.status === "in_resolution" && (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                    In Resolution
                                  </Badge>
                                )}
                                {order.status === "refunded" && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    Refunded
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-1 md:space-x-2 flex-wrap justify-end">
                                {order.status === "delivered" && (
                                  <Button className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="outline" className="py-2"
                                  onClick={() => handleSupportMessage(order.id)}>
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Support
                                </Button>
                                {order.status === "delivered" ? (
                                  <Button variant="outline" className="text-green-600 border-green-200 py-2">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    <span className="text-xs">Mark Received</span>
                                  </Button>
                                ) : order.status === "in_resolution" ? (
                                  <Button variant="outline" className="text-orange-600 border-orange-200 py-2">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    <span className="text-xs">In Resolution</span>
                                  </Button>
                                ) : (
                                  <Button variant="outline" className="text-red-600 border-red-200 py-2"
                                    onClick={() => handleRefundRequest(order.id)}>
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    <span className="text-xs">Request Refund</span>
                                  </Button>
                                )}
                                <Button variant="outline" className="px-3 py-2"
                                  onClick={() => handleOrderDetails(order)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Balance Tab */}
          <TabsContent value="balance" className="p-3 xl:p-6">
            <div className="space-y-6">
              {/* Current Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5" />
                    <span>Current Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-4xl font-bold text-green-600 mb-4 font-inter">
                    €{parseFloat(user?.balance || "0").toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              {/* Deposit Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Deposit Cryptocurrency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="py-4 md:py-6 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <BitcoinIcon className="w-5 h-5 mr-2" />
                      Deposit BTC
                    </Button>
                    <Button variant="outline" className="py-4 md:py-6 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <LitecoinIcon className="w-5 h-5 mr-2" />
                      Deposit LTC
                    </Button>
                    <Button variant="outline" className="py-4 md:py-6 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <MoneroIcon className="w-5 h-5 mr-2" />
                      Deposit XMR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="p-3 xl:p-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {transaction.type === "deposit" ? "Cryptocurrency deposit" : 
                               transaction.type === "purchase" ? "Product purchase" : "Refund processed"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
                          {transaction.type === "deposit" ? "+" : 
                           transaction.type === "refund" ? "+" : "-"}{Math.abs(parseFloat(transaction.amount)).toFixed(2)}€
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-3 xl:p-6">
            <div className="space-y-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username (can't be changed)</Label>
                    <Input 
                      id="username" 
                      value={user?.username || ""} 
                      disabled 
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicName">Public Name (can't be changed)</Label>
                    <Input 
                      id="publicName" 
                      value={(user as any)?.publicName || ""} 
                      disabled 
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password" 
                    />
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handlePasswordUpdate}
                    disabled={!newPassword || !confirmPassword}
                  >
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isTotpEnabled ? (
                    <>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Two-factor authentication adds an extra layer of security to your account.
                      </div>
                      <Button 
                        variant="outline"
                        onClick={handleTotpSetup}
                        disabled={showTotpSetup}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Setup Two-Factor Authentication (TOTP)
                      </Button>
                      
                      {showTotpSetup && (
                        <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <h4 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                              </p>
                              {qrCode && (
                                <div className="flex justify-center mb-4">
                                  <img src={qrCode} alt="TOTP QR Code" className="border border-gray-300 rounded" />
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                2. Or manually enter this secret key:
                              </p>
                              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm break-all">
                                {totpSecret}
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="totpToken">3. Enter the 6-digit code from your authenticator app:</Label>
                              <Input
                                id="totpToken"
                                type="text"
                                value={totpToken}
                                onChange={(e) => setTotpToken(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="font-mono text-center text-lg"
                              />
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                onClick={handleTotpVerify}
                                disabled={totpToken.length !== 6}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Verify & Enable
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setShowTotpSetup(false);
                                  setTotpToken("");
                                  setQrCode("");
                                  setTotpSecret("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation("/totp-generator")}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Need an authenticator app? Use our TOTP Generator
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Two-factor authentication is enabled</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your account is protected with two-factor authentication.
                      </p>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={handleTotpDisable}
                      >
                        Disable Two-Factor Authentication
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span>Contact Methods for Moderation & Administrators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="telegram">Telegram Username</Label>
                    <Input 
                      id="telegram" 
                      value={contactMethods.telegram}
                      onChange={(e) => setContactMethods(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="threema">Threema Username</Label>
                    <Input 
                      id="threema" 
                      value={contactMethods.threema}
                      onChange={(e) => setContactMethods(prev => ({ ...prev, threema: e.target.value }))}
                      placeholder="ABCDEFGH"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signal">Signal Username</Label>
                    <Input 
                      id="signal" 
                      value={contactMethods.signal}
                      onChange={(e) => setContactMethods(prev => ({ ...prev, signal: e.target.value }))}
                      placeholder="username.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session">Session Username</Label>
                    <Input 
                      id="session" 
                      value={contactMethods.session}
                      onChange={(e) => setContactMethods(prev => ({ ...prev, session: e.target.value }))}
                      placeholder="username"
                    />
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleContactMethodsUpdate}
                  >
                    Save Contact Methods
                  </Button>
                </CardContent>
              </Card>

              {/* Logout */}
              <Card>
                <CardContent className="pt-6">
                  <Button variant="destructive">
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        product={selectedProduct}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSupportClick={handleSupportMessage}
        onRefundClick={handleRefundRequest}
      />
    </div>
  );
}