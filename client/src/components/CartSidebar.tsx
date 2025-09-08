import React from "react";
import { X, Trash2, FileText } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormSummary } from "@/components/generators/FormBuilder";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import type { FormBuilderSchema } from "@shared/types/formBuilder";
import { useI18n } from "@/i18n";

export function CartSidebar() {
  const { items, total, isOpen, setIsOpen, removeItem, updateQuantity, isLoading } = useCart();
  const { t } = useI18n();
  
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getProductConfig = (productId: string): FormBuilderSchema | null => {
    const product = products.find(p => p.id === productId);
    return product?.formBuilderJson as FormBuilderSchema | null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-96 p-0 bg-card text-foreground">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle>{t("shoppingCart")}</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-muted-foreground">{t("loadingCart")}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("cartEmpty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                    
                    {/* Show form summary for items with form builder data */}
                    {item.formBuilderData && (
                      <div className="mt-2 p-2 bg-accent rounded-md">
                        <div className="flex items-center gap-1 text-xs text-accent-foreground mb-1">
                          <FileText className="w-3 h-3" />
                          <span>{t("formData")}</span>
                        </div>
                        {(() => {
                          const config = getProductConfig(item.productId);
                          if (config) {
                            return (
                              <FormSummary
                                formBuilderSchema={config}
                                formData={item.formBuilderData}
                                compact={true}
                                showTitle={false}
                              />
                            );
                          }
                          // Fallback for when config is not available
                          return (
                            <div className="text-xs text-muted-foreground">
                              {Object.entries(item.formBuilderData).slice(0, 2).map(([key, value]) => (
                                <div key={key}>
                                  {key}: {String(value)}
                                </div>
                              ))}
                              {Object.keys(item.formBuilderData).length > 2 && (
                                <div>{t("andMoreFields", { count: Object.keys(item.formBuilderData).length - 2 })}</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Show legacy generator data */}
                    {item.generatorData && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(item.generatorData).slice(0, 2).map(([key, value]) => (
                            <div key={key}>
                              {key}: {String(value)}
                            </div>
                          ))}
                          {Object.keys(item.generatorData).length > 2 && (
                            <div>{t("andMoreFields", { count: Object.keys(item.generatorData).length - 2 })}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{(item.price * item.quantity).toFixed(2)}€</div>
                        <div className="text-xs text-muted-foreground">{item.price}€ each</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground">{t("total")}</span>
              <span className="text-lg font-bold text-foreground">{total.toFixed(2)}€</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setIsOpen(false)}>
                {t("proceedToCheckout")}
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
