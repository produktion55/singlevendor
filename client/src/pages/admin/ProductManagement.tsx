import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  ArrowLeft,
  Search,
  Filter,
  MoreVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeleteProductId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const toggleProductStatus = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/products/${productId}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Product status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product status",
        variant: "destructive",
      });
    },
  });

  // Filter products based on search term and category
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (isActive: boolean | null) => {
    const active = isActive ?? true;
    return (
      <Badge variant={active ? "default" : "secondary"}>
        {active ? "Active" : "Unpublished"}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      license_key: "default",
      text_lines: "secondary",
      service: "outline",
      digital_file: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || "secondary"}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const handleToggleStatus = (product: Product) => {
    toggleProductStatus.mutate({
      productId: product.id,
      isActive: !(product.isActive ?? true)
    });
  };

  // Check admin access
  if (user?.role !== "admin") {
    return (
      <div className="max-w-full mx-auto px-3 md:px-6 text-center py-12">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
        <Link href="/admin">
          <Button className="mt-4">Back to Admin</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto px-3 md:px-6 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 md:px-6 py-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your marketplace products
            </p>
          </div>
          
          <Link href="/admin/add-product">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterCategory === "all" ? "default" : "outline"}
                onClick={() => setFilterCategory("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterCategory === "shop" ? "default" : "outline"}
                onClick={() => setFilterCategory("shop")}
                size="sm"
              >
                Shop
              </Button>
              <Button
                variant={filterCategory === "generator" ? "default" : "outline"}
                onClick={() => setFilterCategory("generator")}
                size="sm"
              >
                Generator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-semibold">{product.title}</div>
                          <div className="text-sm text-gray-500">
                            {product.category} • {product.subcategory}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(product.type)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">${product.price}</span>
                    </TableCell>
                    <TableCell>
                      {product.stock === null ? (
                        <Badge variant="outline">Unlimited</Badge>
                      ) : (
                        <span className="font-medium">{product.stock}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleToggleStatus(product)}
                        className="hover:opacity-75 transition-opacity"
                      >
                        {getStatusBadge(product.isActive)}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/product/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                        </Link>
                        <Link href={`/admin/edit-product/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteProductId(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">No products found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && handleDeleteProduct(deleteProductId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}