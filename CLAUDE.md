# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev           # Start development server (tsx server/index.ts with NODE_ENV=development)

# Build & Production
npm run build         # Build client (Vite) and server (ESBuild)
npm run start         # Run production server (NODE_ENV=production)

# Type Checking
npm run check         # Run TypeScript type checking (tsc)

# Database
npm run db:push       # Push schema changes to SQLite database (drizzle-kit push)
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript with Vite, shadcn/ui components, Radix UI primitives, Tailwind CSS
- **Backend**: Express.js + TypeScript on Node.js
- **Database**: SQLite (using Drizzle ORM)
- **State Management**: TanStack Query for server state, React Hook Form for forms
- **Routing**: Wouter for client-side routing
- **Validation**: Zod schemas shared between frontend and backend
- **Authentication**: Session-based with express-session, TOTP 2FA support

### Project Structure
```
SpendSavvy/
├── client/              # Frontend React application
│   └── src/
│       ├── components/  # UI components (using shadcn/ui)
│       ├── pages/       # Route pages
│       ├── hooks/       # Custom React hooks
│       └── contexts/    # React contexts (Cart, Theme)
├── server/              # Express backend
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API route definitions
│   ├── db.ts           # SQLite database connection
│   └── storage.ts      # Database abstraction layer
├── shared/              # Shared code between client and server
│   └── schema.ts       # Drizzle ORM schema and Zod validation
└── attached_assets/    # Development assets
```

### Key Architectural Patterns

1. **Single Page Application (SPA)** with RESTful API backend
2. **Session-based Authentication** using express-session with MemoryStore
3. **JSON Data Storage** - Complex data types (arrays, objects) are stored as JSON in SQLite columns
4. **Type-safe Database Access** - Drizzle ORM with Zod validation ensures type safety from database to API
5. **Path Aliases** - Use `@/` for client/src imports and `@shared/` for shared code

Database tables:
- `users` - User accounts with balance, TOTP, social usernames
- `products` - Digital products with JSON fields
- `orders` - Purchase orders with JSON orderData
- `transactions` - Financial transactions (deposits, purchases, refunds)
- `cartItems` - Shopping cart persistence
- `notifications` - In-app notification system
- `messages` - User-to-user messaging
- `inviteCodes` - Registration invite system

### API Endpoints Pattern

All API routes are defined in `server/routes.ts` following RESTful conventions:
- Authentication: `/api/auth/*` (register, login, TOTP)
- Users: `/api/users/:id`
- Products: `/api/products/*`
- Orders: `/api/orders/*`
- Cart: `/api/cart/*`
- Transactions: `/api/transactions/*`
- Notifications: `/api/notifications/*`
- Generators: `/api/generate-mediamarkt`

### Component Library

This project uses shadcn/ui components located in `client/src/components/ui/`. These are pre-built, customizable components based on Radix UI primitives. When adding UI elements, check existing components first before creating new ones.

## Development Notes

- The project uses Vite for development with API proxying to Express
- Database migrations are handled through Drizzle Kit
- All timestamps use Unix timestamps (seconds since epoch)
- Authentication persists in localStorage with session validation
- The project uses ESBuild for production bundling
- TOTP 2FA for user logins is implemented using Speakeasy library
- File uploads should be saved in backend, no external cloud like AWS S3 or Google Cloud Storage


# Other information Overview

SecureMarket is a full-stack single vendor ecommerce shop built with React, Express, and a database. It provides a platform for buying and selling digital products including software licenses, document generators, and premium digital content. The application features an invite-only registration system, role-based access control, and a comprehensive admin panel for product and user management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Component Structure**: Modular component architecture with reusable UI components

## Backend Architecture
- **Runtime**: Node.js 20+ with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reload with Vite integration in development mode

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: SQLite
- **Schema**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle-kit for database migrations and schema management
- **Validation**: Zod for runtime type validation and schema parsing

## Authentication & Authorization
- **Session Management**: In-memory session storage (development phase)
- **Invite System**: Invite-code based registration with tracking
- **Role-based Access**: User and admin role distinctions
- **User Storage**: Username/password authentication with role-based permissions

## File Storage Strategy
- **Approach**: Local file storage on server (no cloud services)
- **Asset Management**: Local attached_assets directory for file handling
- **Image Handling**: Product images stored locally with URL references

## Real-time Communication
- **Method**: Server-Sent Events (SSE) for messages and notifications
- **Design Decision**: Chosen over WebSockets for simplicity and unidirectional data flow

## Theme System
- **Multi-theme Support**: Light, dark, OLED, and colorful themes
- **Implementation**: CSS custom properties with theme switching
- **Typography**: Inter font for UI, JetBrains Mono for monospace content

# External Dependencies

## Core Frameworks
- **React 18+**: Frontend framework with hooks and modern patterns
- **Express.js**: Backend web framework
- **Vite**: Build tool and development server

## Database & ORM
- **SQLite**: Primary database (file-based)
- **Drizzle ORM**: Database toolkit with type safety
- **better-sqlite3**: SQLite driver

## UI Components
- **Radix UI**: Headless UI component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component library

## State Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state and validation

## Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Production build bundling

## Features
- **Multi-language support**: Internationalization capabilities for multiple languages

# User Flows

## Purchase Flow
1. Browse product catalog
2. View product details
3. Add to cart or buy now
4. Review checkout summary
5. Confirm purchase with balance
6. Receive order confirmation
7. Access delivery content

## Registration Flow
1. User opens site, sees registration/login page
2. Enter username, password, invite code
3. System validates invite code
4. Create user account
5. Redirect to shop catalogue