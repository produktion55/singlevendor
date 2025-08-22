# Overview

SecureMarket is a full-stack digital marketplace application built with React, Express, and PostgreSQL. It provides a platform for buying and selling digital products including software licenses, document generators, and premium digital content. The application features an invite-only registration system, role-based access control, and a comprehensive admin panel for product and user management.

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
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reload with Vite integration in development mode

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
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
- **PostgreSQL**: Primary database (configured for Neon serverless)
- **Drizzle ORM**: Database toolkit with type safety
- **@neondatabase/serverless**: Serverless PostgreSQL driver

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
- **Replit Integration**: Development environment support