import Elysia, { Context } from "elysia";
import {
  authMiddleware,
  UserContext,
} from "../../auth/middleware/auth_middleware";

interface AdminMiddlewareOptions {
  auth?: typeof authMiddleware;
}

export const adminMiddleware = ({ auth }: AdminMiddlewareOptions = {}) => {
  return (app: Elysia) =>
    app
      .use(auth ?? authMiddleware)
      .macro({
        needAuth: {
          beforeHandle({ user, set }) {
            if (!user) {
              set.status = 401;
              return {
                meta: {
                  code: "PERMISSION-401",
                  message: "Unauthorized",
                },
                data: null,
              };
            }
          }
        },
        hasPermission(permission: string) {
          return {
            beforeHandle({ user, set }) {
              // Check if user is authenticated
              console.log(!user)
              if (!user) {
                set.status = 401;
                return {
                  meta: {
                    code: "PERMISSION-401",
                    message: "Unauthorized",
                  },
                  data: null,
                };
              }

              // Check if user has the required permission
              const userPermissions = user.role.permissions || [];
              if (!userPermissions.includes(permission)) {
                set.status = 403;
                return {
                  meta: {
                    code: "PERMISSION-403",
                    message: "Forbidden: Insufficient permissions",
                  },
                  data: null,
                };
              }
            },
          };
        },
      });
};
