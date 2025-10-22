import Elysia from "elysia";
import { AuditService } from '../services/audit_service';
import {
  authMiddleware,
} from "../../auth/middleware/auth_middleware";
import { auditService } from "../services/audit_service_factory";

// Define the audit trail data interface
export interface AuditTrailData {
  user_id?: string;
  action: string;
  changes?: Array<{
    table_name: string;
    old_value?: any;
    new_value?: any;
  }>;
  ip_address?: string;
  user_agent?: string;
}

// Define the audit tools interface
export interface AuditTools {
  recordStartAction: (action: string) => void;  // Record action at controller start
  recordChange: (table_name: string, old_value?: any, new_value?: any) => void;  // Record individual changes
  markForRollback: () => void;  // Mark audit for rollback if needed
  flushAudit: () => Promise<void>;  // Manually flush audit to database
  getAuditChanges: () => Array<{ table_name: string; old_value?: any; new_value?: any; }> | null;
}

// Define the audit context interface
export interface AuditContext {
  actionRecorded: boolean;        // Whether the initial action has been recorded at controller start
  initialAction: string | null;   // The initial action name recorded at controller start
  changes: Array<{              // Array of changes to be grouped into single audit
    table_name: string;
    old_value?: any;
    new_value?: any;
  }>;
  rollbackPending: boolean;      // Whether a rollback has been requested
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
      .derive(({ headers, request, server, user }) => {
        // Initialize the audit context
        const auditContext: AuditContext = {
          actionRecorded: false,
          initialAction: null,
          changes: [],
          rollbackPending: false,
        };

        const auditTools: AuditTools = {
          // Record action at the start of the controller
          recordStartAction: (action: string) => {
            if (!auditContext.actionRecorded) {
              auditContext.initialAction = action;
              auditContext.actionRecorded = true;
            }
          },

          // Record individual changes during the controller execution
          recordChange: (table_name: string, old_value?: any, new_value?: any) => {
            const change = {
              table_name,
              old_value,
              new_value
            };
            auditContext.changes.push(change);
          },

          // Mark audit for rollback if needed
          markForRollback: () => {
            auditContext.rollbackPending = true;
          },

          // Manually flush audit to database
          flushAudit: async () => {
            if (auditContext.changes.length > 0 && auditContext.initialAction && !auditContext.rollbackPending) {
              const ip_address = server?.requestIP(request)?.address ||
                                (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                                'unknown';
              
              const user_agent = headers['user-agent'] || request.headers.get('user-agent') || 'unknown';

              const auditData: AuditTrailData = {
                user_id: user?.id,
                action: auditContext.initialAction,
                changes: [...auditContext.changes], // Create a copy of changes
                ip_address,
                user_agent,
              };

              try {
                await service.createAuditTrail(auditData);
                // Clear the context after successful flush to prevent duplicate logging
                auditContext.changes = [];
                auditContext.initialAction = null;
                auditContext.actionRecorded = false;
              } catch (error) {
                console.error('Audit service error in flushAudit (handled gracefully):', error);
                // Don't throw the error - audit failures shouldn't affect main request
              }
            }
          },

          // Get current audit changes
          getAuditChanges: () => {
            return auditContext.changes.length > 0 ? [...auditContext.changes] : null;
          },
        };

        return { 
          auditContext,
          auditTools,
        };
      })
      // Hook to save the audit trail after the response is sent (single audit row with multiple changes)
      .onAfterHandle(async ({ auditContext, user, headers, server, request }) => {
        // Only log audit if there are changes and it's not marked for rollback
        if (auditContext.changes.length > 0 && auditContext.initialAction && !auditContext.rollbackPending) {
          const ip_address = server?.requestIP(request)?.address ||
                            (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                            'unknown';
          
          const user_agent = headers['user-agent'] || request.headers.get('user-agent') || 'unknown';

          const auditData: AuditTrailData = {
            user_id: user?.id,
            action: auditContext.initialAction,
            changes: auditContext.changes,
            ip_address,
            user_agent,
          };

          try {
            await service.createAuditTrail(auditData);
          } catch (error) {
            console.error('Audit service error in onAfterHandle (handled gracefully):', error);
            // Continue even if audit fails
          }
        }
      });
};