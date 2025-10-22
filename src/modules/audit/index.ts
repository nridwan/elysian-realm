import Elysia from 'elysia'
import { auditController } from './controller/audit_controller'

export const auditModule = new Elysia({ name: 'audit-module' })
  .use(auditController)