import Elysia from 'elysia'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from './plugins/jwt'
import { loadModules } from './modules'
import { otel } from './plugins/otel'
import { config } from './config/config'
import { swaggerPlugin } from './plugins/swagger'

const app = new Elysia()
  .use(otel({ enabled: true }))
  .use(swaggerPlugin)
  .use(adminAccessTokenPlugin)
  .use(adminRefreshTokenPlugin)
  .use(loadModules)
  .get('/', () => ({ message: 'Hello Elysian Realm!' }), {
    detail: {
      hide: true
    }
  })
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'elysian-realm-backend'
  }), {
    detail: {
      hide: true
    }
  })
  .listen(config.server.port)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
console.log(
  `📖 Swagger UI is available at http://localhost:${app.server?.port}/swagger`
)

export type App = typeof app