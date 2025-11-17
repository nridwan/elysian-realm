import Elysia, { Context } from "elysia";
import {
  authMiddleware,
  UserContext,
} from "../../auth/middleware/auth_middleware";
import { responsePlugin } from "../../../plugins/response_plugin";

interface AdminMiddlewareOptions {
  auth?: typeof authMiddleware;
  response?: ReturnType<typeof responsePlugin>;
}

export const adminMiddleware = ({ auth, response }: AdminMiddlewareOptions = {}) => {
  return (app: Elysia) =>
    app
      .use(auth ?? authMiddleware)
      .use(response ?? responsePlugin({ defaultServiceName: 'PERMISSION' }))
      .macro({
        needAuth: {
          beforeHandle({ user, set, responseTools }) {
            if (!user) {
              return responseTools?.generateErrorResponse(
                "admin.unauthorized",
                "401",
              );
            }
          }
        },
        hasPermission(permission: string) {
          return {
            beforeHandle({ user, set, responseTools }) {
              // Check if user is authenticated
              if (!user) {
                return responseTools?.generateErrorResponse(
                  "admin.unauthorized",
                  "401",
                );
              }

              // Check if user has the required permission
              const userPermissions = user.role.permissions || [];
              if (!userPermissions.includes(permission)) {
                return responseTools?.generateErrorResponse(
                  "admin.forbidden_insufficient_permissions",
                  "403",
                );
              }
            },
          };
        },
      });
};
