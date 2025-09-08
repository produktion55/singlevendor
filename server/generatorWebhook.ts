import type { Request, Response } from "express";
import { storage } from "./storage";
import type { FormBuilderSchema, FormSubmissionData } from "@shared/types/formBuilder";

interface GeneratorWebhookPayload {
  orderId: string;
  userId: string;
  productId: string;
  productTitle: string;
  formBuilderData: FormSubmissionData;
  formBuilderSchema: FormBuilderSchema;
  callbackUrl: string;
  timestamp: string;
}

interface WebhookResponse {
  orderId: string;
  userId: string;
  status: 'success' | 'processing' | 'failed';
  fileUrl?: string;
  filename?: string;
  error?: string;
}

/**
 * Handles generator webhook requests for form builder products
 * This endpoint is called when an order with formBuilderData is created
 */
export async function handleGeneratorWebhook(req: Request, res: Response) {
  try {
    const { orderId, userId, productId } = req.body;

    if (!orderId || !userId || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: orderId, userId, productId" 
      });
    }

    // Get the order and product details
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: "Order not found" 
      });
    }

    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }

    // Verify this is a generator product with form builder
    if (product.category !== "generator" || !product.formBuilderJson) {
      return res.status(400).json({ 
        success: false, 
        error: "Product is not a valid generator with form builder configuration" 
      });
    }

    // Extract form data from order
    const orderData = order.orderData as any;
    if (!orderData?.formBuilderData) {
      return res.status(400).json({ 
        success: false, 
        error: "Order does not contain form builder data" 
      });
    }

    // Prepare webhook payload for external service
    const webhookPayload: GeneratorWebhookPayload = {
      orderId: order.id,
      userId: order.userId,
      productId: product.id,
      productTitle: product.title,
      formBuilderData: orderData.formBuilderData,
      formBuilderSchema: product.formBuilderJson as FormBuilderSchema,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/webhook/generator-complete`,
      timestamp: new Date().toISOString()
    };

    // Log the webhook payload (in production, this would be sent to external service)
    console.log("Generator webhook payload:", JSON.stringify(webhookPayload, null, 2));

    // In a real implementation, you would:
    // 1. Send webhookPayload to external generator service
    // 2. External service processes the form data
    // 3. External service generates the file (PDF, image, etc.)
    // 4. External service calls back to callbackUrl with the result

    // For now, we'll simulate success
    res.json({ 
      success: true, 
      orderId: order.id,
      message: "Generator webhook triggered successfully",
      status: "processing"
    });

  } catch (error) {
    console.error("Generator webhook error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process generator webhook" 
    });
  }
}

/**
 * Handles the callback from external generator service when file is ready
 */
export async function handleGeneratorCallback(req: Request, res: Response) {
  try {
    const response: WebhookResponse = req.body;
    
    if (!response.orderId || !response.userId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields in callback" 
      });
    }

    // Verify the order exists
    const order = await storage.getOrder(response.orderId);
    if (!order || order.userId !== response.userId) {
      return res.status(404).json({ 
        success: false, 
        error: "Order not found or user mismatch" 
      });
    }

    // Update order based on response status
    if (response.status === 'success' && response.fileUrl) {
      // File generated successfully
      await storage.updateOrder(response.orderId, {
        status: "delivered",
        deliveredAt: new Date(),
        orderData: {
          ...(order.orderData as any || {}),
          fileReady: true,
          fileUrl: response.fileUrl,
          filename: response.filename || `generated_${response.orderId}.pdf`
        }
      });

      // Create notification for user
      await storage.createNotification({
        userId: response.userId,
        title: "File Generated Successfully",
        message: `Your generated file is ready for download`,
        type: "order",
        orderId: response.orderId
      });

      console.log(`Generator file ready for order ${response.orderId}: ${response.fileUrl}`);
      
    } else if (response.status === 'failed') {
      // Generation failed
      await storage.updateOrder(response.orderId, {
        status: "in_resolution",
        orderData: {
          ...(order.orderData as any || {}),
          fileReady: false,
          error: response.error || "Generation failed"
        }
      });

      // Create error notification
      await storage.createNotification({
        userId: response.userId,
        title: "Generation Failed",
        message: response.error || "File generation failed. Please contact support.",
        type: "order",
        orderId: response.orderId
      });

      console.error(`Generator failed for order ${response.orderId}: ${response.error}`);
    }

    res.json({ 
      success: true, 
      message: "Callback processed successfully" 
    });

  } catch (error) {
    console.error("Generator callback error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process generator callback" 
    });
  }
}

/**
 * Validates form data against the form builder schema
 */
export function validateFormData(
  formData: FormSubmissionData, 
  schema: FormBuilderSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate each section and field
  for (const section of schema.sections) {
    for (const field of section.fields) {
      const value = formData[field.name];

      // Check required fields
      if (field.required && (!value || value === '')) {
        errors.push(`Field "${field.label}" is required`);
      }

      // Validate field types
      if (value) {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(value))) {
              errors.push(`Field "${field.label}" must be a valid email`);
            }
            break;
          
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Field "${field.label}" must be a number`);
            }
            break;
        }
      }

      // Check min/max length for text fields
      if (value && field.validation) {
        const strValue = String(value);
        if (field.validation.minLength && strValue.length < field.validation.minLength) {
          errors.push(`Field "${field.label}" must be at least ${field.validation.minLength} characters`);
        }
        if (field.validation.maxLength && strValue.length > field.validation.maxLength) {
          errors.push(`Field "${field.label}" must be at most ${field.validation.maxLength} characters`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculates dynamic pricing based on form selections
 */
export function calculateDynamicPrice(
  formData: FormSubmissionData,
  schema: FormBuilderSchema,
  basePrice: number
): number {
  let additionalPrice = 0;

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === 'select' && field.options && field.optionPrices) {
        const selectedValue = formData[field.name];
        const optionIndex = field.options.indexOf(String(selectedValue));
        
        if (optionIndex !== -1 && field.optionPrices[optionIndex]) {
          const priceModifier = field.optionPrices[optionIndex];
          
          if (field.optionPriceType === 'percentage') {
            additionalPrice += basePrice * (priceModifier / 100);
          } else {
            additionalPrice += priceModifier;
          }
        }
      }
    }
  }

  return basePrice + additionalPrice;
}