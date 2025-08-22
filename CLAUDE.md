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
npm run db:push       # Push schema changes to PostgreSQL database (drizzle-kit push)
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript with Vite, shadcn/ui components, Radix UI primitives, Tailwind CSS
- **Backend**: Express.js + TypeScript on Node.js
- **Database**: PostgreSQL with Neon serverless (using Drizzle ORM)
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
│   ├── db.ts           # Neon PostgreSQL connection
│   └── storage.ts      # Database abstraction layer
├── shared/              # Shared code between client and server
│   └── schema.ts       # Drizzle ORM schema and Zod validation
└── attached_assets/    # Development assets
```

### Key Architectural Patterns

1. **Single Page Application (SPA)** with RESTful API backend
2. **Session-based Authentication** using express-session with MemoryStore
3. **JSON Data Storage** - Complex data types (arrays, objects) are stored as JSON in PostgreSQL jsonb columns
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