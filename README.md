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

### Prerequisites

- [Bun](https://bun.sh/) installed
- [PostgreSQL](https://www.postgresql.org/) installed locally or access to a PostgreSQL database

### Backend Setup

1. Navigate to the project root directory
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up PostgreSQL database:
   - Install PostgreSQL locally or use a cloud provider (e.g., Supabase, Render, etc.)
   - Create a new database named `elysian-realm`
4. Update the `DATABASE_URL` in the `.env` file with your database credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/elysian-realm?schema=public"
   ```
5. Run Prisma migrations:
   ```bash
   bunx prisma migrate dev --name init
   ```
6. Seed the database:
   ```bash
   bunx prisma db seed
   ```
7. Start the server:
   ```bash
   bun run src/index.ts
   ```

### Frontend Setup

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
- `bunx prisma migrate dev` - Run database migrations
- `bunx prisma db seed` - Seed the database
- `bunx prisma studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elysian-realm?schema=public"
JWT_SECRET="your-jwt-secret"
PORT=3000
```

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