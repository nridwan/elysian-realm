# API Documentation

This project uses Swagger UI for API documentation, powered by the [@elysiajs/swagger](https://github.com/elysiajs/elysia-swagger) plugin.

## Accessing the Documentation

Once the server is running, you can access the Swagger UI at:

```
http://localhost:3000/swagger
```

Replace `3000` with the port your server is running on if it's different.

## Features

- Interactive API documentation
- Try out endpoints directly from the browser
- View request/response schemas
- Authentication support

## How it Works

The Swagger documentation is automatically generated from your Elysia routes and schema definitions. When you define routes with:

1. Request/response schemas using Elysia's `t` object
2. Route metadata in the `detail` property
3. Tags for grouping endpoints

The documentation will automatically reflect these definitions.

## Adding Documentation to Your Routes

To add documentation to your routes, include a `detail` object in your route configuration:

```typescript
app.get(
  '/api/users/:id',
  async ({ params }) => {
    // Route implementation
  },
  {
    params: t.Object({
      id: t.String()
    }),
    response: {
      200: UserDto
    },
    detail: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Retrieves a user by their unique identifier'
    }
  }
)
```

## Customization

The Swagger configuration can be found in `src/plugins/swagger.ts`. You can customize:

- API title and description
- Version information
- Tags and their descriptions
- UI options