# Elysian Realm

A fullstack admin panel application with SvelteKit 5 frontend and ElysiaJS backend.

## Tech Stack

### Frontend (client/)
- SvelteKit 5 with TypeScript
- TailwindCSS with DaisyUI for styling
- Bun as the package manager
- Vite for build tooling

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
├── client/                 # SvelteKit 5 frontend
│   ├── src/
│   │   ├── lib/            # Shared components, utilities, and types
│   │   │   ├── assets/     # Static assets like images and icons
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── datasource/ # Data fetching utilities
│   │   │   ├── state/      # Application state management
│   │   │   ├── types/      # TypeScript types
│   │   │   └── utils/      # Utility functions
│   │   ├── routes/         # SvelteKit routes with file-based routing
│   │   ├── app.css         # Global CSS with TailwindCSS
│   │   ├── app.html        # HTML entry point
│   │   └── hooks/
│   ├── static/             # Static assets
│   ├── svelte.config.js    # SvelteKit configuration
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.js  # TailwindCSS configuration
│   └── package.json
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
   bun install
   ```
3. Start the development server:
   ```bash
   bun run dev
   ```

## Available Scripts

### Backend
- `bun run src/index.ts` - Start the development server
- `bun run test` - Run the test suite
- `bunx prisma migrate dev` - Run database migrations
- `bunx prisma db seed` - Seed the database
- `bunx prisma studio` - Open Prisma Studio

### Frontend
- `bun run dev` - Start the development server
- `bun run build` - Build for production
- `bun run preview` - Preview the production build

### Docker
- `docker-compose up --build` - Start all services in production mode
- `docker-compose -f docker-compose.dev.yml up --build` - Start all services in development mode with hot reloading
- `docker-compose down` - Stop all services
- `docker-compose logs` - View logs from all services

## Testing

This project uses Bun for testing. To run tests:

```bash
bun run test        # Run all tests once
bun run test:watch  # Run tests in watch mode
```

Note: This project uses Bun's built-in test runner. Both `bun test` and `bun run test` will work, but `bun test` is the direct way to run tests using Bun's native testing capabilities.

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
4. **Frontend** - SvelteKit application served by Nginx with optimized Docker image

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

## Unit Testing Guidelines

This project follows a comprehensive testing strategy with a focus on testability, dependency injection, and proper isolation. Below are the guidelines and best practices for writing unit tests in this codebase.

### Test Structure and Patterns

#### Component Builder Pattern
Components (controllers, services, middleware) should be designed using the Builder pattern to enable easy dependency injection and replacement:

```typescript
// Example controller with dependency injection
interface AdminControllerOptions {
  service?: AdminService
  adminMiddleware?: ReturnType<typeof adminMiddleware>
  auditMiddleware?: ReturnType<typeof auditMiddleware>
}

export const createAdminController = (options: AdminControllerOptions = {}) => {
  const service = options.service || adminService
  const admin = options.adminMiddleware || adminMiddleware()
  const audit = options.auditMiddleware || auditMiddleware()

  return new Elysia({ name: 'admin-controller' })
    .use(responsePlugin({ defaultServiceName: 'ADMIN' }))
    .group('/api/admin', (app) =>
      app
        .use(admin)
        .use(audit)
        // Controller routes here...
    )
}
```

This pattern enables:
- Easy mocking of dependencies in tests
- Flexible component composition
- Better testability and isolation

#### Test File Organization
Each module should have corresponding test files:
- `<component>.test.ts` - Endpoint/integration tests
- `<component>.mock.test.ts` - Unit tests with mocked dependencies

### Mocking Strategies

#### 1. Service Mocking
Use factory functions or direct object mocking for services:

```typescript
// Create mock service
const mockAdminService = new AdminService(mockPrisma)

// Override specific methods
const originalMethod = mockAdminService.getUsers
mockAdminService.getUsers = mock(() => Promise.resolve(mockResult)) as any

// Remember to restore after test
mockAdminService.getUsers = originalMethod
```

#### 2. Middleware Mocking
Create lightweight mock middleware that bypasses actual authentication but provides test contexts:

```typescript
const mockAuthMiddleware = (app: Elysia) => {
  return app.derive(() => ({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role_id: '1',
      role: {
        id: '1',
        name: 'admin',
        permissions: ['admins.read', 'admins.create']
      }
    }
  }))
}
```

#### 3. Plugin Mocking
Create mock plugins that return properly structured Elysia plugins:

```typescript
const createMockAdminAccessTokenPlugin = () => {
  return (app: Elysia) => app.derive(() => ({ 
    adminAccessToken: mockAdminAccessToken 
  }))
}
```

### Writing Effective Tests

#### 1. Test Structure
Follow the AAA pattern (Arrange, Act, Assert):

```typescript
it('should get admins list successfully', async () => {
  // Arrange - Setup test data and mocks
  const originalGetUsers = mockAdminService.getUsers
  const mockResult = { /* mock data */ }
  mockAdminService.getUsers = mock(() => Promise.resolve(mockResult)) as any

  // Act - Execute the test
  const app = new Elysia()
    .use(createAdminController({ 
      service: mockAdminService,
      adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any}),
      auditMiddleware: mockAuditMiddleware as any,
    }))

  const response = await app.handle(
    new Request('http://localhost/api/admin/admins', { 
      method: 'GET'
    })
  )

  // Assert - Verify results
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.meta.code).toBe('ADMIN-200')
  
  // Restore original method
  mockAdminService.getUsers = originalGetUsers
})
```

#### 2. Dependency Injection in Tests
Always inject dependencies to enable mocking:

```typescript
const app = new Elysia()
  .use(createAdminController({ 
    service: mockAdminService,        // Inject mock service
    adminMiddleware: mockAuthMiddleware as any,  // Inject mock auth
    auditMiddleware: mockAuditMiddleware as any, // Inject mock audit
  }))
```

#### 3. Test Isolation
Ensure tests don't interfere with each other by:
- Using fresh mock instances for each test
- Restoring original methods after mocking
- Avoiding shared state between tests

### Testing Different Component Types

#### Controllers
Controllers should be tested for:
- Route registration
- HTTP method acceptance
- Request validation
- Response formatting
- Permission checking
- Authentication requirements

#### Services
Services should be tested for:
- Business logic correctness
- Data transformation
- Error handling
- Integration with data sources

#### Middleware
Middleware should be tested for:
- Context enhancement
- Authentication/authorization logic
- Request/response modification

### Best Practices

1. **Mock at the Right Level**
   - Mock external dependencies (database, APIs)
   - Mock complex services but not simple utilities
   - Avoid over-mocking which can hide real issues

2. **Test Realistic Scenarios**
   - Test both success and failure cases
   - Test edge cases and error conditions
   - Test permission boundaries
   - Test validation scenarios

3. **Keep Tests Independent**
   - Each test should be able to run independently
   - Avoid shared state between tests
   - Clean up mocks after each test

4. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should return 401 for invalid credentials', async () => { ... })
   
   // Bad
   it('should fail', async () => { ... })
   ```

5. **Focus on Behavior, Not Implementation**
   - Test what the code does, not how it does it
   - Avoid testing internal implementation details
   - Focus on inputs and outputs

6. **Proper Test Data Management**
   - Use realistic but minimal test data
   - Create helper functions for common test data
   - Avoid hardcoded magic values in tests

### Common Testing Patterns

#### Testing Successful Operations
```typescript
it('should perform operation successfully', async () => {
  // Mock service to return success
  mockService.method = mock(() => Promise.resolve(successResult))
  
  // Execute request
  const response = await app.handle(request)
  
  // Verify success response
  expect(response.status).toBe(200)
  // ... additional assertions
})
```

#### Testing Error Conditions
```typescript
it('should handle error conditions gracefully', async () => {
  // Mock service to return error
  mockService.method = mock(() => Promise.resolve({ error: 'Error message' }))
  
  // Execute request
  const response = await app.handle(request)
  
  // Verify error response
  expect(response.status).toBe(400) // or appropriate error status
  // ... additional assertions
})
```

#### Testing Permission Boundaries
```typescript
it('should deny access when user lacks required permission', async () => {
  // Create mock auth middleware with limited permissions
  const mockAuthWithLimitedPermissions = (app: Elysia) => {
    return app.derive(() => ({
      user: { /* user with limited permissions */ }
    }))
  }
  
  // Execute request with limited permissions
  const response = await app.handle(request)
  
  // Verify access denied
  expect(response.status).toBe(403)
})
```

### Running Tests

```bash
# Run all tests once
bun test

# Run tests in watch mode
bun test --watch

# Run specific test files
bun test src/modules/admin/controller/admin_controller.mock.test.ts
```

Note: This project uses Bun's built-in test runner. You can use `bun test` directly to run tests using Bun's native testing capabilities.