import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Download, CheckCircle, Clock, AlertCircle, RefreshCw, Calendar, User, Package, CreditCard, FileText } from "lucide-react";
import { FormSummary } from "@/components/generators/FormBuilder";
import { type Order, type Product } from "@shared/schema";
import type { FormBuilderSchema } from "@shared/types/formBuilder";

interface OrderDetailsModalProps {
  order: Order | null;
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSupportClick?: (orderId: string) => void;
  onRefundClick?: (orderId: string) => void;
}

export function OrderDetailsModal({ order, product, isOpen, onClose, onSupportClick, onRefundClick }: OrderDetailsModalProps) {
  if (!order || !product) return null;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "--";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit", 
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "in_resolution":
        return <AlertCircle className="w-4 h-4" />;
      case "refunded":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Order Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={`${getStatusColor(order.status || 'processing')} flex items-center space-x-1`}>
                {getStatusIcon(order.status || 'processing')}
                <span className="capitalize">{order.status || 'processing'}</span>
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Order #{order.id}
            </div>
          </div>

          <Separator />

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Product Information</span>
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex space-x-4">
                {product.images?.[0] && (
                  <img 
                    src={product.images[0]} 
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{product.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">Type: {product.type}</span>
                    <span className="font-bold text-lg">€{Number(product.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Order Date:</span>
              </div>
              <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Seller:</span>
              </div>
              <p className="text-sm font-medium">Admin Seller</p>
            </div>
          </div>

          {/* Form Builder Data (if present) */}
          {order.orderData && (order.orderData as any).formBuilderData && product?.formBuilderJson && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Form Configuration</span>
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <FormSummary
                    formBuilderSchema={product.formBuilderJson as FormBuilderSchema}
                    formData={(order.orderData as any).formBuilderData}
                    compact={false}
                    showTitle={false}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Legacy Generator Data (if present) */}
          {order.orderData && (order.orderData as any).formData && !(order.orderData as any).formBuilderData && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Generator Configuration</span>
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries((order.orderData as any).formData).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-gray-600 dark:text-gray-400">{key}:</span>
                        <span className="ml-2">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Digital Content (if delivered) */}
          {order.status === "delivered" && order.orderData && (
            (order.orderData as any).licenseKey || (order.orderData as any).digitalFile || (order.orderData as any).textLines
          ) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Digital Content</span>
                </h3>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
                  {(order.orderData as any)?.licenseKey && (
                    <div>
                      <label className="text-sm font-medium text-blue-800 dark:text-blue-200">License Key:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded border text-sm">
                          {(order.orderData as any).licenseKey}
                        </code>
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText((order.orderData as any).licenseKey)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {(order.orderData as any)?.digitalFile && (
                    <div>
                      <label className="text-sm font-medium text-blue-800 dark:text-blue-200">Download:</label>
                      <div className="mt-1">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Download className="w-4 h-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {(order.orderData as any)?.textLines && (
                    <div>
                      <label className="text-sm font-medium text-blue-800 dark:text-blue-200">Generated Content:</label>
                      <div className="mt-1">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border text-sm whitespace-pre-wrap">
                          {(order.orderData as any).textLines}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              {order.status === "delivered" && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onSupportClick?.(order.id)}>
                <User className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              
              {order.status !== "delivered" && order.status !== "refunded" && (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" 
                  onClick={() => onRefundClick?.(order.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Refund
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}