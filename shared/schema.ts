import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { FormBuilderSchema, FormDisplayMode, FormSubmissionData } from './types/formBuilder';

export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  publicName: text("public_name"),
  balance: real("balance").default(0.00),
  role: text("role").default("user"), // user, admin
  telegramUsername: text("telegram_username"),
  threemaUsername: text("threema_username"),
  signalUsername: text("signal_username"),
  sessionUsername: text("session_username"),
  inviteCode: text("invite_code"),
  totpSecret: text("totp_secret"),
  totpEnabled: integer("totp_enabled", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const inviteCodes = sqliteTable("invite_codes", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  code: text("code").notNull().unique(),
  usedBy: text("used_by").references(() => users.id),
  registrationCount: integer("registration_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text("title").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  category: text("category").notNull(), // generator, shop
  subcategory: text("subcategory"),
  type: text("type").notNull(), // license_key, text_lines, service, digital_file
  stock: integer("stock"),
  maxPerUser: integer("max_per_user").default(1),
  images: text("images", { mode: "json" }).$type<string[]>().default([]),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sellerId: text("seller_id").references(() => users.id),
  customFields: text("custom_fields", { mode: "json" }).$type<{ name: string; label: string; type: string; required: boolean }[]>(),
  // New form builder fields
  formBuilderJson: text("form_builder_json", { mode: "json" }).$type<FormBuilderSchema | null>(),
  formDisplayMode: text("form_display_mode").$type<FormDisplayMode>().default("sidebar"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").references(() => users.id).notNull(),
  productId: text("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").default(1),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("processing"), // processing, delivered, in_resolution, refunded
  orderData: text("order_data", { mode: "json" }).$type<{
    customFields?: Record<string, any>;  // Legacy custom fields
    formData?: FormSubmissionData;  // New form builder data
    [key: string]: any;  // Additional data
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // deposit, purchase, refund
  amount: real("amount").notNull(),
  currency: text("currency").default("USD"),
  description: text("description"),
  orderId: text("order_id").references(() => orders.id),
  cryptoAddress: text("crypto_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  senderId: text("sender_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  orderId: text("order_id").references(() => orders.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").references(() => users.id).notNull(),
  productId: text("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").default(1),
  metadata: text("metadata", { mode: "json" }).$type<{
    customFields?: Record<string, any>;  // Legacy custom fields
    formBuilderData?: FormSubmissionData;  // New form builder data
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // order, transaction, system, admin
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  orderId: text("order_id").references(() => orders.id),
  transactionId: text("transaction_id").references(() => transactions.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Form Builder Validation Schemas
export const conditionalLogicSchema = z.object({
  enabled: z.boolean(),
  fieldId: z.string(),
  value: z.string()
});

export const fieldValidationSchema = z.object({
  alphanumeric: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  email: z.boolean().optional()
});

export const baseFieldSchema = z.object({
  type: z.enum(['text', 'select', 'textarea', 'date', 'number', 'email']),
  label: z.string(),
  name: z.string(),
  placeholder: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
  validation: fieldValidationSchema.optional(),
  readonly: z.boolean().optional(),
  disabled: z.boolean().optional()
});

export const selectFieldSchema = baseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(z.string()),
  optionPrices: z.array(z.number()).optional(),
  optionPriceType: z.enum(['fixed', 'percentage']).optional(),
  multiple: z.boolean().optional()
});

export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal('text'),
  defaultValue: z.string().optional()
});

export const emailFieldSchema = baseFieldSchema.extend({
  type: z.literal('email'),
  defaultValue: z.string().optional()
});

export const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal('textarea'),
  defaultValue: z.string().optional(),
  rows: z.number().optional(),
  cols: z.number().optional()
});

export const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal('number'),
  defaultValue: z.number().optional(),
  step: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional()
});

export const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal('date'),
  defaultValue: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional()
});

export const fieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  emailFieldSchema,
  textareaFieldSchema,
  numberFieldSchema,
  dateFieldSchema,
  selectFieldSchema
]);

export const sectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  width: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]),
  isPadding: z.boolean().optional(),
  collapsible: z.boolean().optional(),
  expanded: z.boolean().optional(),
  fields: z.array(fieldSchema)
});

export const formBuilderSchema = z.object({
  sections: z.array(sectionSchema)
});

export const formDisplayModeSchema = z.enum(['sidebar', 'fullwidth']);

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  formBuilderJson: formBuilderSchema.nullable().optional(),
  formDisplayMode: formDisplayModeSchema.default('sidebar')
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  deliveredAt: true,
}).extend({
  orderData: z.object({
    customFields: z.record(z.any()).optional(),
    formData: z.record(z.any()).optional()
  }).catchall(z.any()).optional()
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
}).extend({
  metadata: z.object({
    customFields: z.record(z.any()).optional(),
    formBuilderData: z.record(z.any()).optional()
  }).optional()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;

// Re-export form builder types for convenience
export type {
  FormBuilderSchema,
  FormDisplayMode,
  FormSubmissionData,
  Section,
  Field,
  FieldType,
  ConditionalLogic,
  FieldValidation,
  TextField,
  EmailField,
  TextareaField,
  NumberField,
  DateField,
  SelectField,
  OptionPriceType,
  FormPricingCalculation,
  FormValidationResult
} from './types/formBuilder';