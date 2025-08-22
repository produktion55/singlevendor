import React, { createContext, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface CartItemWithProduct {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  title: string;
  price: number;
  image: string;
  type: string;
}

interface CartContextType {
  items: CartItemWithProduct[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: { id: string; title: string; price: number; image: string; type: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cart from database
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiRequest("GET", `/api/cart/user/${user.id}`);
      const dbCartItems = await response.json();
      
      // Fetch product details for each cart item
      const productsResponse = await apiRequest("GET", "/api/products");
      const products = await productsResponse.json();
      
      // Merge cart items with product details
      return dbCartItems.map((cartItem: any) => {
        const product = products.find((p: any) => p.id === cartItem.productId);
        return {
          ...cartItem,
          title: product?.title || "Unknown Product",
          price: parseFloat(product?.price || "0"),
          image: product?.images?.[0] || "",
          type: product?.type || "unknown"
        };
      });
    },
    enabled: !!user?.id
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item: { productId: string; quantity?: number }) => {
      if (!user?.id) throw new Error("User not logged in");
      const response = await apiRequest("POST", "/api/cart", {
        userId: user.id,
        productId: item.productId,
        quantity: item.quantity || 1
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  // Update cart item mutation  
  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not logged in");
      const response = await apiRequest("DELETE", `/api/cart/user/${user.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  const addItem = (item: { id: string; title: string; price: number; image: string; type: string }) => {
    addToCartMutation.mutate({ productId: item.id, quantity: 1 });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    updateCartMutation.mutate({ id, quantity });
  };

  const removeItem = (id: string) => {
    removeFromCartMutation.mutate(id);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  const total = cartItems.reduce((sum: number, item: CartItemWithProduct) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum: number, item: CartItemWithProduct) => sum + item.quantity, 0);

  const value: CartContextType = {
    items: cartItems,
    itemCount: totalItems,
    total,
    isOpen,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isLoading: isLoading || addToCartMutation.isPending || updateCartMutation.isPending || removeFromCartMutation.isPending || clearCartMutation.isPending,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}