import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

export const swaggerPlugin = new Elysia({ name: 'swagger-plugin' }).use(
  swagger({
    documentation: {
      info: {
        title: 'Elysian Realm API',
        version: '1.0.0',
        description: 'API documentation for the Elysian Realm backend service',
      },
      tags: [
        {
          name: 'Auth',
          description: 'Authentication related endpoints',
        },
        {
          name: 'Admin',
          description: 'Administration endpoints',
        },
      ],
      components: {
        securitySchemes: {
          jwt: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for authentication'
          }
        }
      }
    },
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
    scalarConfig: {
      theme: 'deepSpace',
    },
  })
)