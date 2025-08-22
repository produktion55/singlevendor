import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertOrderSchema, insertTransactionSchema, insertCartItemSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { inviteCode, ...userData } = req.body;
      
      // Validate invite code
      const inviteCodeRecord = await storage.getInviteCode(inviteCode);
      if (!inviteCodeRecord || !inviteCodeRecord.isActive) {
        return res.status(400).json({ message: "Invalid invite code" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Validate user data
      const validatedData = insertUserSchema.parse({ ...userData, inviteCode });
      
      // Create user
      const user = await storage.createUser(validatedData);
      res.status(201).json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid input data" : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd verify the hashed password
      // For now, we'll just return success
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          balance: user.balance 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });

  // Get current user (for refreshing user data)
  app.get("/api/auth/user", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const user = await storage.getUser(userId as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Convert empty strings to null for consistency
      const response = { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        balance: user.balance,
        email: user.email || null,
        publicName: user.publicName || null,
        telegramUsername: user.telegramUsername || null,
        threemaUsername: user.threemaUsername || null,
        signalUsername: user.signalUsername || null,
        sessionUsername: user.sessionUsername || null,
        totpEnabled: user.totpEnabled
      };
      
      console.log("Returning user data:", response);
      res.json(response);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      
      // If password is being updated, keep it in updates
      // The storage layer should handle password hashing if needed
      
      const updatedUser = await storage.updateUser(req.params.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  // TOTP routes
  app.post("/api/auth/totp/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: user.username,
        issuer: "SecureMarket",
        length: 32
      });
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);
      
      // Store secret temporarily (not enabled yet)
      await storage.updateUser(userId, { totpSecret: secret.base32 });
      
      res.json({ 
        qrCode, 
        secret: secret.base32,
        backupCodes: [] // You could generate backup codes here
      });
    } catch (error) {
      console.error("TOTP setup error:", error);
      res.status(500).json({ message: "Failed to setup TOTP" });
    }
  });
  
  app.post("/api/auth/totp/verify", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      if (!userId || !token) {
        return res.status(400).json({ message: "User ID and token required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.totpSecret) {
        return res.status(400).json({ message: "TOTP not setup" });
      }
      
      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
      
      if (verified) {
        // Enable TOTP for the user
        await storage.updateUser(userId, { totpEnabled: true });
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Invalid token" });
      }
    } catch (error) {
      console.error("TOTP verify error:", error);
      res.status(500).json({ message: "Failed to verify TOTP" });
    }
  });
  
  app.post("/api/auth/totp/disable", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      await storage.updateUser(userId, { 
        totpSecret: null, 
        totpEnabled: false 
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("TOTP disable error:", error);
      res.status(500).json({ message: "Failed to disable TOTP" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      
      let products;
      if (category && typeof category === 'string') {
        products = await storage.getProductsByCategory(category);
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid product data" : "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Order routes
  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByUserId(req.params.userId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Create notification for order creation
      await storage.createNotification({
        userId: order.userId,
        title: "Order Created",
        message: `Your order #${order.id.slice(-8)} has been placed successfully`,
        type: "order",
        orderId: order.id
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid order data" : "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      // Get original order to compare status change
      const originalOrder = await storage.getOrder(req.params.id);
      
      // Convert deliveredAt string to Date if present
      const updateData = { ...req.body };
      if (updateData.deliveredAt && typeof updateData.deliveredAt === 'string') {
        updateData.deliveredAt = new Date(updateData.deliveredAt);
      }
      
      const updatedOrder = await storage.updateOrder(req.params.id, updateData);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create notification for status change
      if (originalOrder && originalOrder.status !== updatedOrder.status) {
        let notificationMessage = "";
        switch (updatedOrder.status) {
          case "delivered":
            notificationMessage = `Your order #${updatedOrder.id.slice(-8)} has been delivered!`;
            break;
          case "processing":
            notificationMessage = `Your order #${updatedOrder.id.slice(-8)} is being processed`;
            break;
          case "in_resolution":
            notificationMessage = `Your order #${updatedOrder.id.slice(-8)} is in resolution`;
            break;
          case "refunded":
            notificationMessage = `Your order #${updatedOrder.id.slice(-8)} has been refunded`;
            break;
        }
        
        if (notificationMessage) {
          await storage.createNotification({
            userId: updatedOrder.userId,
            title: "Order Status Updated",
            message: notificationMessage,
            type: "order",
            orderId: updatedOrder.id
          });
        }
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(400).json({ message: "Failed to update order" });
    }
  });

  // Transaction routes
  app.get("/api/transactions/user/:userId", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.params.userId);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      // For purchase transactions, deduct from user balance
      if (validatedData.type === "purchase" && validatedData.amount < 0) {
        const user = await storage.getUser(validatedData.userId);
        if (user && user.balance) {
          const currentBalance = parseFloat(user.balance);
          const transactionAmount = Math.abs(validatedData.amount);
          const newBalance = Math.max(0, currentBalance - transactionAmount);
          
          await storage.updateUser(validatedData.userId, {
            balance: newBalance.toFixed(2)
          });
        }
      }
      
      // Create notification for transaction
      const isDeposit = parseFloat(transaction.amount) > 0;
      await storage.createNotification({
        userId: transaction.userId,
        title: isDeposit ? "Funds Added" : "Purchase Completed", 
        message: isDeposit 
          ? `€${Math.abs(parseFloat(transaction.amount)).toFixed(2)} has been added to your wallet`
          : `Payment of €${Math.abs(parseFloat(transaction.amount)).toFixed(2)} processed successfully`,
        type: "transaction",
        transactionId: transaction.id
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid transaction data" : "Failed to create transaction" });
    }
  });

  // Cart routes
  app.get("/api/cart/user/:userId", async (req, res) => {
    try {
      const cartItems = await storage.getCartByUserId(req.params.userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid cart data" : "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (quantity === 0) {
        const removed = await storage.removeFromCart(req.params.id);
        return res.json({ success: removed });
      }

      const updatedItem = await storage.updateCartItem(req.params.id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Update cart item error:", error);
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const removed = await storage.removeFromCart(req.params.id);
      res.json({ success: removed });
    } catch (error) {
      console.error("Remove cart item error:", error);
      res.status(400).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart/user/:userId", async (req, res) => {
    try {
      const cleared = await storage.clearCart(req.params.userId);
      res.json({ success: cleared });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(400).json({ message: "Failed to clear cart" });
    }
  });

  // Invite codes
  app.get("/api/invite-codes", async (req, res) => {
    try {
      const codes = await storage.getAllInviteCodes();
      res.json(codes);
    } catch (error) {
      console.error("Get invite codes error:", error);
      res.status(500).json({ message: "Failed to fetch invite codes" });
    }
  });

  // MediaMarkt Generator API
  app.post("/api/generate-mediamarkt", async (req, res) => {
    try {
      const { formData, userId } = req.body;

      // Create an order for the generation request
      const order = await storage.createOrder({
        userId,
        productId: "prod-6", // MediaMarkt product
        quantity: 1,
        totalAmount: "12.99",
        status: "processing",
        orderData: {
          generatorType: "mediamarkt-rechnung",
          formData,
          fileReady: false
        }
      });

      // In a real implementation, this would trigger a webhook to external service
      // For now, we'll simulate the process
      console.log(`MediaMarkt generation request created: ${order.id}`);
      
      // Simulate webhook call to external Windows server
      const webhookPayload = {
        orderId: order.id,
        userId,
        productSlug: "mediamarkt-rechnung",
        formData,
        callbackUrl: `${req.protocol}://${req.get('host')}/api/webhook/mediamarkt-complete`
      };
      
      console.log("Webhook payload (would be sent to external server):", webhookPayload);

      res.json({ 
        success: true, 
        orderId: order.id,
        message: "Generation request submitted successfully"
      });
    } catch (error) {
      console.error("MediaMarkt generation error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to submit generation request" 
      });
    }
  });

  // Webhook endpoint for external service to upload completed files
  app.post("/api/webhook/mediamarkt-complete", async (req, res) => {
    try {
      const { orderId, userId, filename, fileBuffer } = req.body;

      if (!orderId || !userId || !fileBuffer) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify the order exists and belongs to the user
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId || order.productId !== "prod-6") {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order with file ready status
      await storage.updateOrder(orderId, {
        status: "delivered",
        deliveredAt: new Date(),
        orderData: {
          ...(order.orderData || {}),
          fileReady: true,
          filename: `mediamarkt-rechnung_${userId}_${orderId}.png`
        }
      });

      console.log(`MediaMarkt invoice generated: mediamarkt-rechnung_${userId}_${orderId}.png`);

      res.json({ success: true, message: "File processed successfully" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // File download endpoint with access control (simple mock for development)
  app.get("/api/download/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Parse filename to extract user ID for verification
      const parts = filename.split('_');
      if (parts.length < 3) {
        return res.status(400).json({ error: "Invalid filename format" });
      }

      // For development, we'll just return a success response
      // In production, this would stream the actual file from object storage
      res.json({ 
        message: "File download would start here", 
        filename,
        note: "This is a development endpoint. In production, the actual PNG file would be downloaded."
      });
      
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Notification routes
  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.params.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/user/:userId/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.params.userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(400).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(400).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
