import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ShoppingCart, Plus, Minus, Star, ArrowLeft, Tag } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { MediaMarktGenerator } from "@/components/generators/MediaMarktGenerator";
import { FormRenderer } from "@/components/generators/FormBuilder";
import { type Product } from "@shared/schema";
import type { FormBuilderSchema, FormSubmissionData } from "@shared/types/formBuilder";

interface CustomField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export function ProductDetails() {
  const params = useParams();
  const productId = params.id as string;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Dynamic generator form data based on custom fields
  const [generatorData, setGeneratorData] = useState<Record<string, any>>({});
  
  // Form builder data for new system
  const [formBuilderData, setFormBuilderData] = useState<FormSubmissionData>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dynamicPrice, setDynamicPrice] = useState(0);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const product = products.find(p => p.id === productId);

  // Initialize generator data when product loads with custom fields
  useEffect(() => {
    if (product?.customFields) {
      const initialData: Record<string, any> = {};
      product.customFields.forEach(field => {
        initialData[field.name] = "";
      });
      setGeneratorData(initialData);
    }
  }, [product]);
  
  // Calculate total price including dynamic pricing
  const totalPrice = product ? Number(product.price) + dynamicPrice : 0;

  const handleAddToCart = () => {
    if (!product) return;

    // For form builder products, validate form
    if (product.formBuilderJson) {
      const formSchema = product.formBuilderJson as FormBuilderSchema;
      const hasRequiredFields = formSchema && formSchema.sections && Array.isArray(formSchema.sections) &&
        formSchema.sections.some((section: any) =>
          section && section.fields && Array.isArray(section.fields) &&
          section.fields.some((field: any) => field.required)
        );
      
      if (hasRequiredFields && Object.keys(formBuilderData).length === 0) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in the required form fields",
          variant: "destructive",
        });
        return;
      }
      
      if (Object.keys(formErrors).length > 0) {
        toast({
          title: "Form Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }
    }

    addItem({
      id: product.id,
      title: product.title,
      price: totalPrice,
      image: product.images?.[0] || "https://via.placeholder.com/300x200",
      type: product.type.replace("_", " "),
      formBuilderData: product.formBuilderJson ? formBuilderData : undefined,
      generatorData: product.customFields && !product.formBuilderJson ? generatorData : undefined,
    } as any);

    toast({
      title: "Added to Cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;

    // For form builder products, validate form
    if (product.formBuilderJson) {
      const formSchema = product.formBuilderJson as FormBuilderSchema;
      const hasRequiredFields = formSchema && formSchema.sections && Array.isArray(formSchema.sections) &&
        formSchema.sections.some((section: any) =>
          section && section.fields && Array.isArray(section.fields) &&
          section.fields.some((field: any) => field.required)
        );
      
      if (hasRequiredFields && Object.keys(formBuilderData).length === 0) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in the required form fields",
          variant: "destructive",
        });
        return;
      }
      
      if (Object.keys(formErrors).length > 0) {
        toast({
          title: "Form Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }
    }
    // For legacy generators, validate required fields
    else if (product.category === "generator" && product.customFields) {
      const missingFields = product.customFields
        .filter(field => field.required && !generatorData[field.name])
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing Required Fields",
          description: `Please fill in: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Store product data in sessionStorage for checkout
    const buyNowItem = {
      id: product.id,
      title: product.title,
      price: totalPrice.toString(),
      image: product.images?.[0] || "https://via.placeholder.com/300x200",
      type: product.type.replace("_", " "),
      quantity: 1,
      formBuilderData: product.formBuilderJson ? formBuilderData : undefined,
      generatorData: product.customFields && !product.formBuilderJson ? generatorData : undefined
    };
    
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    
    // Navigate directly to checkout without adding to cart
    setLocation("/checkout?buyNow=true");
  };

  const handleGeneratorFieldChange = (fieldName: string, value: any) => {
    setGeneratorData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderCustomField = (field: CustomField) => {
    const value = generatorData[field.name] || "";
    
    switch (field.type) {
      case "text":
      case "email":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleGeneratorFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        );
      
      case "number":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleGeneratorFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        );
      
      case "date":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleGeneratorFieldChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );
      
      case "textarea":
        return (
          <div key={field.name} className="col-span-full">
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleGeneratorFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={3}
              required={field.required}
            />
          </div>
        );
      
      default:
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => handleGeneratorFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        );
    }
  };

  const isGenerator = product?.category === "generator";
  const hasStock = product?.stock === null || (product?.stock && product.stock > 0);
  const hasFormBuilder = product?.formBuilderJson !== null && product?.formBuilderJson !== undefined;
  const hasLegacyCustomFields = product?.customFields && product.customFields.length > 0 && !hasFormBuilder;
  const isFullWidthForm = hasFormBuilder && product?.formDisplayMode === 'fullwidth';

  if (!product) {
    return (
      <div className="max-w-full mx-auto px-3 md:px-6 text-center py-12">
        <p className="text-gray-500">Product not found.</p>
        <Link href="/shop">
          <Button className="mt-4">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  // Show MediaMarkt Generator for MediaMarkt product
  if (product.id === "prod-6") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/generators">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Generators
              </Button>
            </Link>
          </div>
          <MediaMarktGenerator />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 md:px-6">
      <Link href="/shop">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>
      </Link>
<div className={isFullWidthForm ? "space-y-8" : "grid lg:grid-cols-2 gap-12"}>
  {/* Product Images and Details Container for full-width mode */}
  {isFullWidthForm ? (
    <>
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.images?.[selectedImage] || "https://via.placeholder.com/600x600"}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details and Form */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
              {product.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {product.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              {product.description}
            </p>
            <div className="flex items-baseline space-x-2 mb-6">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalPrice.toFixed(2)}€
              </span>
              {dynamicPrice > 0 && (
                <span className="text-sm text-gray-500">
                  (Base: {product.price}€ + Options: {dynamicPrice.toFixed(2)}€)
                </span>
              )}
              {product.stock !== null && (
                <span className="text-sm text-gray-500">
                  {product.stock} in stock
                </span>
              )}
            </div>
          </div>

          {/* Form Builder Form (New System) - Sidebar Mode Only */}
          {hasFormBuilder && product.formBuilderJson && product.formDisplayMode !== 'fullwidth' && (
            <Card>
              <CardContent className="p-6">
                <FormRenderer
                  formBuilderSchema={product.formBuilderJson as FormBuilderSchema}
                  formDisplayMode={product.formDisplayMode || 'sidebar'}
                  onDataChange={(newData: FormSubmissionData) => {
                    setFormBuilderData(newData);
                  }}
                  onPriceChange={(price: number) => {
                    setDynamicPrice(price);
                  }}
                  initialData={formBuilderData}
                  readOnly={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Legacy Dynamic Generator Form Fields */}
          {hasLegacyCustomFields && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {product.title} Configuration
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Please fill in the required information for your custom {product.title.toLowerCase()}.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.customFields!.map(field => renderCustomField(field))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase Options */}
          <Card>
            <CardContent className="p-6">
              {!isGenerator && (
                <div className="flex items-center space-x-4 mb-6">
                  <Label htmlFor="quantity">Quantity:</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={product.maxPerUser !== null && product.maxPerUser !== undefined && quantity >= product.maxPerUser}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {product.maxPerUser && (
                    <span className="text-sm text-gray-500">
                      Max {product.maxPerUser} per user
                    </span>
                  )}
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!hasStock}
                  variant="outline"
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={!hasStock}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Buy Now
                </Button>
              </div>

              {!hasStock && (
                <p className="text-red-600 text-sm mt-2 text-center">
                  This item is currently out of stock
                </p>
              )}
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Product Information
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
                  <dd className="font-medium">{product.type.replace("_", " ")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Category:</dt>
                  <dd className="font-medium">{product.category}</dd>
                </div>
                {product.subcategory && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Subcategory:</dt>
                    <dd className="font-medium">{product.subcategory}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Delivery:</dt>
                  <dd className="font-medium">Instant Digital Download</dd>
                </div>
              </dl>
            </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Full-width Form (displayed below product details) */}
            {product.formBuilderJson && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {product.title} Configuration
                  </h3>
                  <FormRenderer
                    formBuilderSchema={product.formBuilderJson as FormBuilderSchema}
                    formDisplayMode={product.formDisplayMode || 'fullwidth'}
                    onDataChange={(newData: FormSubmissionData) => {
                      setFormBuilderData(newData);
                    }}
                    onPriceChange={(price: number) => {
                      setDynamicPrice(price);
                    }}
                    initialData={formBuilderData}
                    readOnly={false}
                  />
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={product.images?.[selectedImage] || "https://via.placeholder.com/600x600"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details and Form */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  {product.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {product.title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  {product.description}
                </p>
                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalPrice.toFixed(2)}€
                  </span>
                  {dynamicPrice > 0 && (
                    <span className="text-sm text-gray-500">
                      (Base: {product.price}€ + Options: {dynamicPrice.toFixed(2)}€)
                    </span>
                  )}
                  {product.stock !== null && (
                    <span className="text-sm text-gray-500">
                      {product.stock} in stock
                    </span>
                  )}
                </div>
              </div>

              {/* Form Builder Form (New System) - Sidebar Mode Only */}
              {hasFormBuilder && product.formBuilderJson && product.formDisplayMode !== 'fullwidth' && (
                <Card>
                  <CardContent className="p-6">
                    <FormRenderer
                      formBuilderSchema={product.formBuilderJson as FormBuilderSchema}
                      formDisplayMode={product.formDisplayMode || 'sidebar'}
                      onDataChange={(newData: FormSubmissionData) => {
                        setFormBuilderData(newData);
                      }}
                      onPriceChange={(price: number) => {
                        setDynamicPrice(price);
                      }}
                      initialData={formBuilderData}
                      readOnly={false}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Legacy Dynamic Generator Form Fields */}
              {hasLegacyCustomFields && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {product.title} Configuration
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Please fill in the required information for your custom {product.title.toLowerCase()}.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.customFields!.map(field => renderCustomField(field))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Purchase Options */}
              <Card>
                <CardContent className="p-6">
                  {!isGenerator && (
                    <div className="flex items-center space-x-4 mb-6">
                      <Label htmlFor="quantity">Quantity:</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                          disabled={product.maxPerUser !== null && product.maxPerUser !== undefined && quantity >= product.maxPerUser}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {product.maxPerUser && (
                        <span className="text-sm text-gray-500">
                          Max {product.maxPerUser} per user
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      onClick={handleAddToCart}
                      disabled={!hasStock}
                      variant="outline"
                      className="flex-1"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={handleBuyNow}
                      disabled={!hasStock}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Buy Now
                    </Button>
                  </div>

                  {!hasStock && (
                    <p className="text-red-600 text-sm mt-2 text-center">
                      This item is currently out of stock
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Product Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Product Information
                  </h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
                      <dd className="font-medium">{product.type.replace("_", " ")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Category:</dt>
                      <dd className="font-medium">{product.category}</dd>
                    </div>
                    {product.subcategory && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Subcategory:</dt>
                        <dd className="font-medium">{product.subcategory}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Delivery:</dt>
                      <dd className="font-medium">Instant Digital Download</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}