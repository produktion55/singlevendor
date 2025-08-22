# SpendSavvy Product Requirements Document (PRD)

## Executive Summary & Product Vision
SpendSavvy is a single vendor ecommerce shop with particular focus on the german market, where users can purchase digital products and generate PDF/PNG files/documents/invoices with their own text input. The site has a wallet-based top-up store balance system to buy products.

## Target Audience

### User Personas

#### 1. Digital Product Buyer "Alex"
- **Age**: 15-50
- **Needs**: Software licenses, digital content, custom automated invoice generation, secure transactions
- **Pain Points**: Manual document creation
- **Value**: One-stop platform with verified products and secure payments

#### 2. Platform Administrator "Thomas"
- **Role**: Platform management
- **Needs**: User oversight, product management, order processing
- **Value**: Comprehensive admin tools with analytics

## Core Features & Requirements

### 1. User Management System

#### 1.1 Registration & Authentication
- **Invite-Only Registration**
  - Valid invite code required for new accounts
  - Username/password authentication
  - Optional TOTP 2FA setup possible after account registration
- **Session Management**
  - Persistent login sessions
  - Remember me functionality

#### 1.2 User Profiles
- **Account Information**
  - Username (immutable)
  - no Email addresses
  - optional Social media handles (Discord, Telegram) for support cases
- **Security Settings**
  - Password management
  - TOTP 2FA configuration
  - Session management

### 2. Digital Marketplace

#### 2.1 Product Catalog
- **Product Types**
  - License keys (software, services)
  - Text lines (codes, serials)
  - Digital files
  - automated PDF/PNG generation served by external server
  
- **Product Attributes**
  - Title and description
  - Price in Euros
  - Stock quantity
  - Per-user purchase limits
  - Category assignment
  - Tags for filtering

#### 2.2 Shopping Experience
- **Browse & Discovery**
  - Category navigation (Shop, Generators)
  - Search functionality
  - Filter by tags
  - Sort by price, date, popularity
- **Product Details**
  - Full description
  - Image gallery
  - Stock availability
  - Purchase restrictions

#### 2.3 Purchase Flow
- **Cart Management**
  - Add/remove items
  - Quantity adjustment
  - Cart persistence
  - Price calculation
- **Checkout Process**
  - Wallet balance check
  - Order confirmation
  - Instant delivery for digital items
  - Order tracking

### 3. Wallet & Payments

#### 3.1 Digital Wallet
- **Balance Management**
  - View current balance in Euros
  - Transaction history
  - Real-time updates
- **Funding Options**
  - Admin-managed deposits
  - Refund credits

#### 3.2 Transaction Types
- **Deposits**: Adding funds to wallet
- **Purchases**: Product and service payments
- **Refunds**: Order cancellations and returns
- **Fees**: Service charges for generators

### 4. Document Generation Services

#### 4.1 MediaMarkt Invoice Generator
- **Features**
  - Professional German retail invoices
  - Customizable customer details (text fields)
- **Pricing**: €12.99 per invoice
- **Delivery**: PDF/PNG Generation will be served by external Windows Server that receives a webhook with order meta data and uploads a file to a folder in the backend, order status gets updated as "completed" and user can then download the file with the "download button"

#### 4.2 IBAN Generator
- **Features**
  - Search German banks
  - Valid IBAN generation for chosen Bank
- **Pricing**: €0.02 per IBAN
- **Use Case**: Testing and development

### 5. Security Tools

#### 5.1 TOTP Authenticator
- **Features**
  - Generate 2FA codes
  - Store multiple accounts
  - Import/export functionality
  - Local storage with sync
  - for users that do not have access to KeePass/GoogleAuthenticator/MicrosoftAuthenticator/BitwardenPremiumTariff
- **Integration**: QR code scanning setup

#### 5.2 Crypto QR Generator
- **Supported Cryptocurrencies**
  - Bitcoin (BTC)
  - Litecoin (LTC)
  - Monero (XMR)
- **Features**
  - Payment URI generation
  - Address validation
  - QR code creation

### 6. Communication System

#### 6.1 Notifications
- **Types**
  - Order updates
  - Payment confirmations
  - System announcements
  - Admin messages
- **Delivery**
  - In-app notifications
  - Real-time updates
  - Notification center

#### 6.2 Messaging
- **Order-Related Communication**
  - Buyer-seller messaging
  - Support inquiries
  - Order dispute resolution

### 7. Admin Dashboard

#### 7.1 Product Management
- **CRUD Operations**
  - Create new listings
  - Edit existing products
  - Hide products
  - Stock management
- **Bulk Operations**
  - Import/export products
  - Batch updates

#### 7.2 User Management
- **User Overview**
  - Account details
  - Transaction history
  - Order history
- **Actions**
  - Balance adjustments
  - Role management
  - Account suspension

#### 7.3 Order Management
- **Order Processing**
  - Status updates (processing, delivered, refunded)
  - Manual fulfillment
  - Dispute resolution
- **Analytics**
  - Sales metrics
  - User statistics
  - Revenue tracking

## Technical Requirements

### Frontend Requirements
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### Backend Requirements
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Express sessions
- **API**: RESTful design

### Infrastructure Requirements
- **Hosting**: Linux Server
- **Storage**: File system for assets
- **External Services**: 
  - Webhook server for document generation
  - Crypto payment processing

### Security Requirements
- **Authentication**
  - Secure password storage
  - Session management
  - TOTP 2FA support
- **Data Protection**
  - HTTPS enforcement
  - Input validation
  - SQL injection prevention
- **Financial Security**
  - Transaction logging
  - Balance verification
  - Audit trails

## User Stories

### As a Buyer
1. I want to browse digital products so I can find what I need
2. I want to add items to my cart so I can purchase multiple items
3. I want to track my orders so I know delivery status
4. I want to manage my wallet balance so I can make purchases

### As a Document Generator User
1. I want to create professional invoices so I can use them for my business
2. I want to generate valid IBANs so I can test payment systems
3. I want to download my generated documents so I can use them offline

### As an Administrator
1. I want to manage products so I can control marketplace inventory
2. I want to process orders so customers receive their purchases
3. I want to view analytics so I can track platform performance
4. I want to manage users so I can maintain platform security

## Success Metrics

### Business Metrics
- **User Growth**: Monthly active users
- **Revenue**: Total transaction volume
- **Generator Usage**: Documents generated per month
- **Marketplace Activity**: Products sold per month

### User Experience Metrics
- **User Retention**: Monthly returning users

## Roadmap & Future Enhancements

### Phase 1: Core Platform (Current)
- ✅ Basic single vendor shop functionality
- ✅ Wallet system
- ✅ Document generators
- ✅ Admin dashboard

### Phase 2: Enhanced Features
- [ ] Crypto payments
- [ ] Advanced search and filtering
- [ ] User reviews and ratings
- [ ] Automated order fulfillment

### Phase 3: Platform Expansion
- [ ] API for third-party integrations
- [ ] Multi-language support
- [ ] Additional document generators

### Phase 4: Advanced Capabilities
- [ ] Advanced analytics dashboard

## Compliance & Legal

### Regulatory Requirements
- **Financial Regulations**: No compliance needed due to special jurisdiction and invite-only marketplace with precisely defined ToS and Privacy Policy

### Terms of Service
- User agreements
- Seller agreements
- Refund policies
- Privacy policy

## Appendix


### Database Schema Overview
- **users**: User accounts and authentication
- **products**: Digital product listings
- **orders**: Purchase transactions
- **transactions**: Financial movements
- **cartItems**: Shopping cart data
- **notifications**: User notifications
- **messages**: User communications
- **inviteCodes**: Registration codes