import Elysia from 'elysia'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from './plugins/jwt'
import { loadModules } from './modules'
import { otel } from './plugins/otel'
import { config } from './config/config'
import { swaggerPlugin } from './plugins/swagger'
import { errorHandlerPlugin } from './plugins/error_handler_plugin'
import { corsPlugin } from './plugins/cors'
import {
  Span
} from "@opentelemetry/api";

errorHandlerPlugin()

let rootContext: Span | undefined

const app = new Elysia()
  .use(corsPlugin)
  .use(otel({ enabled: false }))
  .on('mapResponse', () => {}) // hack otel bun 1.2
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