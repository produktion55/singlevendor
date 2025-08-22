import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  subcategory: string;
  type: string;
  stock: string;
  maxPerUser: string;
  images: string[];
  tags: string[];
  isActive: boolean;
  sellerId: string;
}

export function AddProduct() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    type: "",
    stock: "",
    maxPerUser: "1",
    images: [],
    tags: [],
    isActive: true,
    sellerId: user?.id || "",
  });

  const [currentImage, setCurrentImage] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Created",
        description: `${data.title} has been successfully added to the marketplace.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setLocation("/admin/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addImage = () => {
    if (currentImage.trim() && !formData.images.includes(currentImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, currentImage.trim()]
      }));
      setCurrentImage("");
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.price || !formData.category || !formData.type) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for submission
    const productData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      price: formData.price,
      category: formData.category,
      subcategory: formData.subcategory.trim() || null,
      type: formData.type,
      stock: formData.stock ? parseInt(formData.stock) : null,
      maxPerUser: formData.maxPerUser ? parseInt(formData.maxPerUser) : 1,
      images: formData.images.length > 0 ? formData.images : null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      isActive: formData.isActive,
      sellerId: formData.sellerId || null,
    };

    createProductMutation.mutate(productData);
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

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/products">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a new product for the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter product title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category & Type */}
        <Card>
          <CardHeader>
            <CardTitle>Category & Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="generator">Generator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  placeholder="e.g., licenses, invoices, games"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Product Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="license_key">License Key</SelectItem>
                    <SelectItem value="text_lines">Text Lines</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="digital_file">Digital File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock & Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Stock & Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-sm text-gray-500">Leave empty for unlimited stock</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxPerUser">Max Per User</Label>
                <Input
                  id="maxPerUser"
                  type="number"
                  min="1"
                  value={formData.maxPerUser}
                  onChange={(e) => handleInputChange('maxPerUser', e.target.value)}
                  placeholder="1"
                />
                <p className="text-sm text-gray-500">Maximum purchases per user</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentImage}
                onChange={(e) => setCurrentImage(e.target.value)}
                placeholder="Enter image URL"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              />
              <Button type="button" onClick={addImage} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <Label>Images:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((image, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <span className="max-w-[200px] truncate">{image}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Enter tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Product is active and visible</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={createProductMutation.isPending || false}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {(createProductMutation.isPending || false) ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}