import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { ObjectUploader } from "@/components/ObjectUploader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product, InsertProduct } from "@shared/schema";
// import type { UploadResult } from "@uppy/core";

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
  customFields?: { name: string; label: string; type: string; required: boolean }[];
}

export function EditProduct({ productId }: { productId: string }) {
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
    customFields: [],
  });

  const [currentImage, setCurrentImage] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products/${productId}`);
      return response.json();
    },
  });

  // Update form data when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        type: product.type || "",
        stock: product.stock ? product.stock.toString() : "",
        maxPerUser: product.maxPerUser ? product.maxPerUser.toString() : "1",
        images: product.images || [],
        tags: product.tags || [],
        isActive: product.isActive ?? true,
        sellerId: product.sellerId || user?.id || "",
        customFields: product.customFields || [],
      });
    }
  }, [product, user?.id]);

  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest("PUT", `/api/products/${productId}`, productData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Updated",
        description: `${data.title} has been successfully updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      setLocation("/admin/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | any[]) => {
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

  const handleThumbnailUpload = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleThumbnailComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL as string;
      
      // Add thumbnail as first image
      setFormData(prev => ({
        ...prev,
        images: [imageUrl, ...prev.images.filter(img => img !== imageUrl)]
      }));

      toast({
        title: "Thumbnail Uploaded",
        description: "Product thumbnail has been uploaded successfully.",
      });
    }
  };

  const addCustomField = () => {
    const newField = {
      name: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false
    };
    
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    }));
  };

  const updateCustomField = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields?.map((customField, i) => 
        i === index ? { ...customField, [field]: value } : customField
      ) || []
    }));
  };

  const removeCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields?.filter((_, i) => i !== index) || []
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
      customFields: formData.customFields || null,
    };

    updateProductMutation.mutate(productData);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-8">
        <div className="text-center">
          <p className="text-gray-500">Product not found</p>
          <Link href="/admin/products">
            <Button className="mt-4">Back to Products</Button>
          </Link>
        </div>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update product information
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

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Main Thumbnail (Max 4MB)</Label>
              {/* ObjectUploader temporarily disabled
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={4194304} // 4MB
                onGetUploadParameters={handleThumbnailUpload}
                onComplete={handleThumbnailComplete}
                buttonClassName="mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Thumbnail
              </ObjectUploader>
              */}
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
                <Label>Current Images:</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs">Thumbnail</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {/* Custom Fields for Generators */}
        {formData.category === "generator" && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields for Webhook</CardTitle>
              <p className="text-sm text-gray-500">Define custom fields that will be sent with webhook requests</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.customFields?.map((field, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Field {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Field Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                        placeholder="field_name"
                      />
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                        placeholder="Field Label"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateCustomField(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`required-${index}`}>Required</Label>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addCustomField}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Field
              </Button>
            </CardContent>
          </Card>
        )}

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
            disabled={updateProductMutation.isPending || false}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {(updateProductMutation.isPending || false) ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}