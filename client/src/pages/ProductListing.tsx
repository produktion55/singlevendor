import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@shared/schema";
import { useI18n } from "@/i18n";

export function ProductListing() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { addItem } = useCart();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filterOptions = ["free", "paid", "germany", "europe", "printable", "photorealistic"];

  const getQuery = () => {
    const idx = location.indexOf("?");
    const params = new URLSearchParams(idx >= 0 ? location.slice(idx) : "");
    return (
      params.get("q") || params.get("query") || params.get("search") || ""
    ).toLowerCase();
  };

  const query = getQuery();

  const normalized = (v: any) => (v === null || v === undefined ? "" : String(v).toLowerCase());
  const matchesQuery = (p: Product, q: string) => {
    if (!q) return true;
    const hay = [
      p.title,
      p.description,
      p.category,
      (p as any).subcategory,
      p.type,
      p.id,
      p.price,
      ...(p.tags || [])
    ]
      .map(normalized)
      .join("\n");
    return hay.includes(q);
  };

  const filteredProducts = products.filter(product => {
    if (selectedCategory !== "all" && product.category !== selectedCategory) {
      return false;
    }
    
    if (selectedFilters.length > 0) {
      const hasMatchingTag = selectedFilters.some(filter => 
        product.tags?.includes(filter)
      );
      if (!hasMatchingTag) return false;
    }
    
    if (!matchesQuery(product, query)) return false;
    
    return true;
  });

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.images?.[0] || "https://via.placeholder.com/300x200",
      type: product.type.replace("_", " "),
    });
    
    toast({
      title: "Added to Cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleBuyNow = (product: Product) => {
    // Store product data in sessionStorage for checkout
    const buyNowItem = {
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.images?.[0] || "https://via.placeholder.com/300x200",
      type: product.type.replace("_", " "),
      quantity: 1
    };
    
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    
    // Navigate directly to checkout without adding to cart
    setLocation("/checkout?buyNow=true");
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto px-3 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-300"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 md:px-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t("digitalMarketplace")}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          {t("digitalMarketplaceSubtitle")}
        </p>
      </div>

      {/* Filters Bar */}
      <Card className="mb-8 bg-card text-foreground">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-muted-foreground">{t("category")}</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  <SelectItem value="shop">{t("shop")}</SelectItem>
                  <SelectItem value="generator">{t("generators")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              {filterOptions.map(filter => (
                <Button
                  key={filter}
                  variant={selectedFilters.includes(filter) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(filter)}
                  className="text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="ml-auto">
              <Filter className="w-4 h-4 mr-2" />
              {t("moreFilters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={`/product/${product.id}`}>
              <img 
                src={product.images?.[0] || "https://via.placeholder.com/300x200"}
                alt={product.title}
                className="w-full h-48 object-cover cursor-pointer"
              />
            </Link>
            <CardContent className="p-4">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600">
                  {product.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {product.description}
              </p>
              
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-foreground">
                  {product.price}€
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleBuyNow(product)}
                  >
                    {t("buyNow")}
                  </Button>
                </div>
              </div>

              {product.stock !== null && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("stockAvailable", { count: product.stock })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {t("noProductsFound")}
          </p>
        </div>
      )}
    </div>
  );
}
