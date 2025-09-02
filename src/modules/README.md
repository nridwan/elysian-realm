# Modules

This directory contains the application modules, each organized with a consistent structure:

```
modules/
├── module_name/
│   ├── middleware/        # Module-specific middleware
│   ├── controller/        # Elysia controllers with routes
│   ├── services/          # Business logic
│   ├── dto/              # Data transfer objects and validation schemas
│   └── index.ts          # Module entry point (optional)
```

## Module Structure

Each module follows a consistent pattern:

- **middleware/**: Contains Elysia middleware specific to the module
- **controller/**: Contains Elysia controllers that define routes and HTTP handlers
- **services/**: Contains business logic and data access functions
- **dto/**: Contains Data Transfer Objects and validation schemas

This structure makes the codebase:
- More maintainable and organized
- Easier to test (services can be unit tested independently)
- More modular and reusable
- Easier to mock for testing