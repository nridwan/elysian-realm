# Elysian Realm

A fullstack admin panel application with React frontend and ElysiaJS backend.

## Tech Stack

### Frontend (client/)
- ReactJS with Vite
- TypeScript
- TailwindCSS for styling
- Bun as the package manager

### Backend (server)
- ElysiaJS framework
- Bun runtime
- Prisma ORM
- PostgreSQL database
- JWT for authentication

## Features

- User authentication with JWT
- Admin dashboard
- User management (CRUD operations)
- Role management (CRUD operations)
- Permission system
- Super admin role with elevated privileges
- User seeder for initial setup
- Full TypeScript type safety

## Project Structure

```
elysian-realm/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── src/                    # Elysia backend
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── plugins/
│   ├── types/
│   ├── prisma/
│   ├── utils/
│   ├── config/
│   └── index.ts
├── prisma/                 # Prisma schema
│   ├── schema.prisma
│   └── seed.ts
├── package.json
├── bun.lock
└── README.md
```

## Getting Started

You can run this application in two ways: using Docker (recommended) or manually installing dependencies.

### Prerequisites (Manual Installation)

- [Bun](https://bun.sh/) installed
- [PostgreSQL](https://www.postgresql.org/) installed locally or access to a PostgreSQL database

### Docker Setup (Recommended)

1. Navigate to the project root directory
2. Start all services with Docker Compose:
   ```bash
   docker-compose up --build
   ```

This will start all services:
- PostgreSQL database on port 5432
- Jaeger tracing on ports 16686 (UI), 4317 (gRPC), 4318 (HTTP)
- Backend API on port 3000
- Frontend on port 80

For development with hot reloading:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Manual Setup

#### Backend Setup

1. Navigate to the project root directory
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up the environment variables:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
   ```
   - Update the values in the `.env` file with your actual configuration
4. Set up PostgreSQL database:
   - Install PostgreSQL locally or use a cloud provider (e.g., Supabase, Render, etc.)
   - Create a new database named `elysian-realm`
5. Update the `DATABASE_URL` in the `.env` file with your database credentials:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/elysian-realm?schema=public"
   ```
6. Run Prisma migrations:
   ```bash
   bunx prisma migrate dev --name init
   ```
7. Seed the database:
   ```bash
   bunx prisma db seed
   ```
8. Start the server:
   ```bash
   bun run src/index.ts
   ```

#### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

### Backend
- `bun run src/index.ts` - Start the development server
- `bun run test` - Run the test suite
- `bunx prisma migrate dev` - Run database migrations
- `bunx prisma db seed` - Seed the database
- `bunx prisma studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

### Docker
- `docker-compose up --build` - Start all services in production mode
- `docker-compose -f docker-compose.dev.yml up --build` - Start all services in development mode with hot reloading
- `docker-compose down` - Stop all services
- `docker-compose logs` - View logs from all services

## Testing

This project uses Vitest for testing with the `vi` test utilities. To run tests:

```bash
bun run test        # Run all tests once
bun run test:watch  # Run tests in watch mode
```

Note: Use `bun run test` rather than `bun test` to ensure compatibility with the Vitest test suite and `vi` utilities used in the test files.

## Environment Variables

Create a `.env` file in the root directory based on the `.env.example` template:

```bash
cp .env.example .env
```

Then update the values in the `.env` file with your actual configuration:

```
DATABASE_URL="postgresql://username:password@localhost:5432/elysian-realm?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

The application now uses a centralized configuration approach. Instead of directly accessing `process.env`, configuration values are accessed through the `config` object imported from `src/config/config.ts`. This provides better type safety and default values.

## Default Credentials

After seeding the database, you can log in with:

- Email: `superadmin@example.com`
- Password: `password` (hashed in the seed file)

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Admin Management
- GET `/api/admin/users` - List all users
- GET `/api/admin/users/:id` - Get user details
- PUT `/api/admin/users/:id` - Update user
- DELETE `/api/admin/users/:id` - Delete user

### Role Management
- GET `/api/admin/roles` - List all roles
- POST `/api/admin/roles` - Create new role
- PUT `/api/admin/roles/:id` - Update role
- DELETE `/api/admin/roles/:id` - Delete role

### Permission Management
- GET `/api/admin/permissions` - List all permissions
- POST `/api/admin/permissions` - Create new permission

## Docker Architecture

This project includes a complete Docker setup with four services:

1. **PostgreSQL Database** - For data persistence
2. **Jaeger** - For distributed tracing and monitoring
3. **Backend API** - ElysiaJS application with optimized Docker image
4. **Frontend** - React application served by Nginx with optimized Docker image

The production Docker images are optimized for size and security:
- Both backend and frontend use Bun for building and running the applications
- Backend uses a multi-stage build with Bun Alpine image
- Frontend uses a multi-stage build with Bun for building and Nginx Alpine for serving static files
- Non-root users for security
- Health checks for all services
- Proper caching strategies

## Type Safety

This project includes full TypeScript type safety for:
- JWT payload types
- Request/response bodies
- Database models
- Middleware context
- Elysia plugin extensions

The types are automatically generated from the Prisma schema and manually defined for:
- JWT plugin integration across modules
- User context in middleware
- Request/response validation schemas

This ensures proper type inference throughout the application, even when using the JWT plugin across different modules.

## Data Transfer Objects (DTOs)

This project uses Data Transfer Objects (DTOs) for defining API response structures and validation schemas. The base DTOs are defined in `src/dto/base.dto.ts` and provide common response formats and pagination structures.

### Base Response Structure

All API responses follow a consistent structure with a `meta` field containing status information and a `data` field containing the actual response data:

```typescript
{
  meta: {
    code: string,     // Response status code (e.g., 'AUTH-200', 'ADMIN-404')
    message: string,  // Human-readable response message
    errors?: Array<{  // Optional validation errors
      field: string,  // Field that caused the error
      messages: string[] // Array of error messages for the field
    }>
  },
  data: T           // Generic data payload
}
```

### Pagination Structure

Paginated responses follow a standard format with page information and an array of items:

```typescript
{
  page: number,     // Current page number
  limit: number,    // Number of items per page
  total: number,    // Total number of items
  pages: number,    // Total number of pages
  data: T[]         // Array of items for the current page
}
```

### Pagination Query Parameters

Pagination can be controlled via query parameters:

- `page`: Page number to retrieve (default: 1)
- `limit`: Number of items per page (default: 10)
