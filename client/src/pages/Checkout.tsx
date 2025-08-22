import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Wallet, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product } from "@shared/schema";

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if this is a "Buy Now" checkout
  const urlParams = new URLSearchParams(window.location.search);
  const isBuyNow = urlParams.get('buyNow') === 'true';
  
  // Get Buy Now item from sessionStorage if applicable
  const buyNowItem = isBuyNow ? (() => {
    const stored = sessionStorage.getItem('buyNowItem');
    return stored ? JSON.parse(stored) : null;
  })() : null;

  // Use Buy Now item or regular cart items
  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : items;
  const checkoutTotal = isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : total;

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  const getProductDetails = (item: any) => {
    // For cart items, use productId; for buy now items, use id
    const productId = item.productId || item.id;
    return products.find(p => p.id === productId);
  };

  const userBalance = parseFloat(user?.balance || "0");
  const hasInsufficientFunds = checkoutTotal > userBalance;

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to complete your purchase",
        variant: "destructive"
      });
      return;
    }

    if (hasInsufficientFunds) {
      toast({
        title: "Insufficient Funds",
        description: "Please add funds to your wallet before purchasing",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create orders for each item
      for (const item of checkoutItems) {
        const product = getProductDetails(item);
        if (!product) continue;

        // Get actual product ID (for cart items, use productId; for buy now items, use id)
        const actualProductId = item.productId || item.id;

        // For digital products, mark as delivered instantly
        const isDigitalProduct = ['license_key', 'digital_file', 'text_lines'].includes(product.type);
        const orderStatus = isDigitalProduct ? "delivered" : "processing";

        // Create order
        const createdOrder = await createOrderMutation.mutateAsync({
          userId: user.id,
          productId: actualProductId,
          quantity: item.quantity,
          totalAmount: (item.price * item.quantity).toString(),
          status: orderStatus
        });

        // If digital product, immediately mark as delivered
        if (isDigitalProduct && createdOrder.id) {
          await apiRequest("PUT", `/api/orders/${createdOrder.id}`, {
            status: "delivered",
            deliveredAt: new Date()
          });
        }

        // Create transaction for each order
        await createTransactionMutation.mutateAsync({
          userId: user.id,
          type: "purchase",
          amount: `-${(item.price * item.quantity).toFixed(2)}`,
          currency: "EUR",
          description: `Purchase: ${item.title} (x${item.quantity})`
        });
      }

      // Clear cart after successful purchase (only if not Buy Now)
      if (!isBuyNow) {
        clearCart();
      } else {
        // Clear Buy Now item from sessionStorage
        sessionStorage.removeItem('buyNowItem');
      }

      // Invalidate user cache to refresh balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      toast({
        title: "🎉 Purchase Successful!",
        description: "Digital products are available instantly in your profile. Physical items are being processed."
      });

      // Redirect to profile
      window.location.href = "/profile";

    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add some products to your cart to continue with checkout
          </p>
        </div>
        <Link href="/shop">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 xl:px-6">
      <div className="mb-8">
        <Link href="/shop">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
          Review your order and complete your purchase
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkoutItems.map((item) => {
                const product = getProductDetails(item);
                return (
                  <div key={item.id} className="flex items-start space-x-3 p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white line-clamp-2">{item.title}</h4>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{item.type}</p>
                      {product?.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right min-w-0 flex-shrink-0">
                      <div className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                        {(item.price * item.quantity).toFixed(2)}€
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {item.price}€ × {item.quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="space-y-6">
          {/* Wallet Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Wallet Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {userBalance.toFixed(2)}€
                </div>
                {hasInsufficientFunds && (
                  <div className="text-xs md:text-sm text-red-600 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    Insufficient funds. Need {(checkoutTotal - userBalance).toFixed(2)}€ more.
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = "/profile?tab=balance"}
                >
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Total */}
          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">{checkoutTotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
                <span className="font-medium">0.00€</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{checkoutTotal.toFixed(2)}€</span>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handlePurchase}
                disabled={hasInsufficientFunds || isProcessing || !user}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 md:h-10 text-base md:text-sm"
              >
                {isProcessing ? (
                  "Processing..."
                ) : hasInsufficientFunds ? (
                  "Insufficient Funds"
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Complete Purchase
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
                <Lock className="w-3 h-3 mr-1" />
                <span>Secure checkout • Instant delivery</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                  🔒
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">🚀 Instant Delivery</p>
                  <p className="text-xs md:text-sm">Your digital products will be available for download immediately after purchase completion. Check your profile to access purchased items.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}