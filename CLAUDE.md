# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AccountHub is a comprehensive Supabase application management backend that serves as a centralized admin interface for managing multiple applications. It provides unified control over user accounts and membership information across all connected apps.

**Key Capabilities:**
- User management across multiple applications
- Membership and subscription management
- Payment history tracking
- Admin audit logging
- Multi-application support from a single interface

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Environment Setup
Create a `.env.local` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **UI Library**: Ant Design (antd) with Chinese locale (zhCN)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v7
- **Build Tool**: Vite with React Compiler optimization (babel-plugin-react-compiler)

### Core Architecture Patterns

#### 1. Service Layer Pattern
All data operations go through service modules in `src/services/`:
- `auth.service.ts` - Authentication and admin management
- `users.service.ts` - User CRUD operations
- `applications.service.ts` - Application management
- `memberships.service.ts` - Membership management
- `audit.service.ts` - Admin action logging

Services handle:
- Direct Supabase client calls
- Input validation using `utils/validation.ts`
- Custom error classes (e.g., `ValidationError`, `AuditError`)
- Business logic encapsulation

#### 2. React Query Hooks Pattern
Custom hooks in `src/hooks/` wrap services with React Query:
- `useUsers.ts` - User queries and mutations
- `useApplications.ts` - Application queries and mutations
- `useMemberships.ts` - Membership queries and mutations

Pattern:
- `useQuery` for data fetching with automatic caching
- `useMutation` for data modifications with optimistic updates
- Automatic cache invalidation after mutations
- Ant Design message notifications on success/error

Query client configuration in `src/config/queryClient.ts`:
- 5-minute stale time
- 10-minute garbage collection time
- No refetch on window focus
- Single retry for queries, no retry for mutations

#### 3. Authentication Flow
- `AuthContext` (`src/contexts/AuthContext.tsx`) provides global auth state
- Distinguishes between `User` (regular users, cannot login) and `Admin` (can login to this dashboard)
- `ProtectedRoute` component guards admin-only routes
- Auth state persists via Supabase session management
- Admin verification happens on login and auth state changes

#### 4. Layout Structure
- `AdminLayout` wraps all authenticated pages with `Header` and `Sidebar`
- Nested routing via React Router's `<Outlet />`
- All admin pages are children of the protected root route

### Database Schema

Key tables (defined in `src/types/database.types.ts`):

**admins** - Admin users who can login to this dashboard
- `auth_user_id` links to Supabase Auth users
- Separate from regular `users` table

**users** - Regular application users (cannot login to dashboard)
- `is_banned` flag for account suspension
- `registered_from_app_id` tracks origin application
- Note: `profiles` table is deprecated, use `users` instead

**applications** - Registered applications
- `app_key` for API authentication
- `slug` for URL-friendly identification
- `is_active` status flag

**user_app_memberships** - Links users to applications with membership status
- Status: active, inactive, suspended, expired, trial, cancelled
- Payment status: paid, pending, failed, refunded
- Supports trial periods and auto-renewal

**subscriptions** - Subscription billing information
- Links to memberships via `membership_id`
- Supports multiple payment methods: stripe, alipay, wechat, manual
- Tracks billing cycles and next billing dates

**payment_history** - Payment transaction records
- Status: success, failed, pending, refunded
- Links to subscriptions and users

**admin_audit_logs** - Tracks all admin actions
- Records action type, resource, old/new data
- Captures IP address and user agent
- Use `auditService.logAction()` to create entries

### Type System

The `Database` interface in `database.types.ts` provides full type safety for Supabase operations:
- `Row` - Type for SELECT queries
- `Insert` - Type for INSERT operations (omits auto-generated fields)
- `Update` - Type for UPDATE operations (all fields optional)

### Validation Pattern

Services use `utils/validation.ts` for input validation:
- `isValidUUID()` - Validates UUID format
- `ValidationError` - Custom error class for validation failures
- Always validate UUIDs before database operations

### Error Handling

Services throw custom error classes:
- Catch and re-throw validation/service-specific errors
- Wrap unexpected errors in service-specific error classes
- React Query hooks display errors via Ant Design messages

## Important Notes

### Language
- UI is in Chinese (Simplified)
- Ant Design configured with `zhCN` locale
- Comments and error messages are in Chinese

### Admin vs User Distinction
- **Admins**: Can login to this dashboard (stored in `admins` table)
- **Users**: Regular app users, cannot login here (stored in `users` table)
- Don't confuse the two - they serve different purposes

### Deprecated Patterns
- `profiles` table is deprecated, use `users` table instead
- `Profile` type is deprecated, use `User` type instead
- The codebase maintains backward compatibility but new code should use `users`

### React Compiler
- Project uses experimental React Compiler for automatic optimization
- Configured in `vite.config.ts` via `babel-plugin-react-compiler`
- No manual memoization needed in most cases
