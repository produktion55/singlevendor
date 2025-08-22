import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { type Order, type Product } from "@shared/schema";

interface OrderWithProduct extends Order {
  product?: Product;
}

export function MyOrders() {
  const { user } = useAuth();

  const { data: orders = [], isLoading, refetch } = useQuery<OrderWithProduct[]>({
    queryKey: [`/api/orders/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Merge orders with product details
  const ordersWithProducts = orders.map(order => ({
    ...order,
    product: products.find(p => p.id === order.productId)
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_resolution":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "refunded":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_resolution":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "refunded":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto px-3 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Orders
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your purchases and order history
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 md:px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Orders
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
              Track your purchases and order history
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {ordersWithProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No orders yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => window.location.href = '/products'}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordersWithProducts.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(order.status || 'processing')}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.status || 'processing')}
                        <span className="capitalize">{order.status || 'processing'}</span>
                      </div>
                    </Badge>
                    <div className="text-right">
                      <div className="font-semibold">{order.totalAmount}€</div>
                      <div className="text-xs text-gray-500">
                        Qty: {order.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {order.product ? (
                  <div className="flex items-center space-x-4">
                    <img
                      src={order.product.images?.[0] || "https://via.placeholder.com/80x80"}
                      alt={order.product.title}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {order.product.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {order.product.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary">
                          {order.product.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {order.product.price}€ each
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {order.status === "delivered" && order.deliveredAt && (
                        <div className="text-xs text-green-600">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Delivered {formatDate(order.deliveredAt)}
                        </div>
                      )}
                      {order.status === "processing" && (
                        <div className="text-xs text-yellow-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Processing...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-500">
                        Product no longer available
                      </h3>
                      <p className="text-sm text-gray-400">
                        This product may have been removed or discontinued
                      </p>
                    </div>
                  </div>
                )}

                {order.orderData && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Order Details
                    </h4>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {typeof order.orderData === 'object' && order.orderData !== null
                        ? JSON.stringify(order.orderData, null, 2)
                        : String(order.orderData || 'No additional details')
                      }
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}