import Elysia from 'elysia'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from './plugins/jwt'
import { loadModules } from './modules'
import { otel } from './plugins/otel'
import { config } from './config/config'

const app = new Elysia()
  .use(otel({ enabled: true }))
  .use(adminAccessTokenPlugin)
  .use(adminRefreshTokenPlugin)
  .use(loadModules)
  .get('/', () => ({ message: 'Hello Elysian Realm!' }))
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'elysian-realm-backend'
  }))
  .listen(config.server.port)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)

export type App = typeof app