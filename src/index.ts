import Elysia from 'elysia'
import { jwtPlugin } from './plugins/jwt'
import { loadModules } from './modules'

const app = new Elysia()
  .use(jwtPlugin)
  .use(loadModules)
  .get('/', () => ({ message: 'Hello Elysian Realm!' }))
  .listen(process.env.PORT || 3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)

export type App = typeof app