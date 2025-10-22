import Elysia from "elysia";
import { AuditService } from '../services/audit_service';
import { PrismaClient } from '@prisma/client';
import {
  authMiddleware,
  UserContext,
} from "../../auth/middleware/auth_middleware";
import { auditService } from "../services/audit_service_factory";

// Define the audit trail data interface
export interface AuditTrailData {
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
}

// Define the audit tools interface
export interface AuditTools {
  logAction: (data: Omit<AuditTrailData, 'ip_address' | 'user_agent'>) => void;
  addAction: (data: Omit<AuditTrailData, 'ip_address' | 'user_agent'>) => void;
  getAuditTrail: () => AuditTrailData | null;
}

// Define the audit context interface
export interface AuditContext {
  auditTrail: AuditTrailData | null;
  pendingAuditData: AuditTrailData[];
}

interface AuditMiddlewareOptions {
  auth?: typeof authMiddleware;
  service?: AuditService
}

export const auditMiddleware = ({ auth, service }: AuditMiddlewareOptions = {}) => {
  service = service || auditService
  return (app: Elysia) =>
    app
      .use(auth ?? authMiddleware)
      .derive(({ headers, request, user }) => {
        // Initialize the audit context
        const auditContext: AuditContext = {
          auditTrail: null,
          pendingAuditData: [],
        };

        const auditTools: AuditTools = {
          // Method to add an audit trail action to be processed later
          addAction: (data: Omit<AuditTrailData, 'ip_address' | 'user_agent'>) => {
            const ip_address = (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                              (headers['x-real-ip'] as string) ||
                              request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                              request.headers.get('x-real-ip') ||
                              'unknown';
            
            const user_agent = headers['user-agent'] || request.headers.get('user-agent') || 'unknown';

            const auditData: AuditTrailData = {
              ...data,
              ip_address,
              user_agent,
            };

            auditContext.pendingAuditData.push(auditData);
          },

          // Method to directly log an action immediately (for read operations)
          logAction: async (data: Omit<AuditTrailData, 'ip_address' | 'user_agent'>) => {
            const ip_address = headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                              headers['x-real-ip'] ||
                              request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                              request.headers.get('x-real-ip') ||
                              'unknown';
            
            const user_agent = headers['user-agent'] || request.headers.get('user-agent') || 'unknown';

            const auditData: AuditTrailData = {
              ...data,
              ip_address,
              user_agent,
            };

            await auditService.createAuditTrail(auditData);
          },

          // Method to get current audit trail data
          getAuditTrail: () => auditContext.auditTrail,
        };

        return { 
          auditContext,
          auditTools,
        };
      })
      // Hook to save all pending audit trails after the response is sent
      .onAfterHandle(async ({ auditContext, user }) => {
        // Process all pending audit data
        for (const auditData of auditContext.pendingAuditData) {
          // If no user_id was provided in the audit data, try to get it from the authenticated user
          if (!auditData.user_id && user && user.id) {
            auditData.user_id = user.id;
          }
          
          await auditService.createAuditTrail(auditData);
        }
      });
};