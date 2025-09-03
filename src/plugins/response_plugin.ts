import Elysia, { type ValidationError } from "elysia";

// Define the service name type
type ServiceName = "AUTH" | "ADMIN" | "USER" | string;

// Define TypeScript types for our response structure
interface ErrorDetail {
  field: string;
  messages: string[];
}

interface Meta {
  code: string;
  message: string;
  errors?: ErrorDetail[];
}

interface BaseResponse<T> {
  meta: Meta;
  data: T;
}

// Define the response tools interface
export interface ResponseTools {
  serviceName: string;
  setServiceName: (name: ServiceName) => void;
  generateResponse: <T>(
    data: T,
    code?: string,
    message?: string
  ) => BaseResponse<T>;
  generateErrorResponse: (
    error: string,
    code?: string,
    message?: string
  ) => BaseResponse<null>;
  generateValidationErrorResponse: (
    validationError: ValidationError
  ) => BaseResponse<null>;
}

// Define the plugin state
interface PluginState {
  serviceName: ServiceName | null;
}

// should be used in each module basis
export const responsePlugin =
  (config?: { defaultServiceName?: ServiceName }) => (app: Elysia) =>
    app
      .derive(({ store }) => {
        const responseTools: ResponseTools = {
          serviceName: config?.defaultServiceName ?? "SERVICE",
          setServiceName(name: ServiceName) {
            this.serviceName = name;
          },
          generateResponse<T>(
            data: T,
            code?: string,
            message?: string
          ): BaseResponse<T> {
            const serviceName = this.serviceName || "APP";
            const statusCode = code || "200";
            const statusMessage = message || "Success";

            return {
              meta: {
                code: `${serviceName}-${statusCode}`,
                message: statusMessage,
              },
              data,
            };
          },
          generateErrorResponse(
            error: string,
            code?: string,
            message?: string
          ): BaseResponse<null> {
            const serviceName = this.serviceName || "APP";
            const statusCode = code || "500";
            const statusMessage = message || error;

            return {
              meta: {
                code: `${serviceName}-${statusCode}`,
                message: statusMessage,
              },
              data: null,
            };
          },
          generateValidationErrorResponse(
            validationError: ValidationError
          ): BaseResponse<null> {
            const serviceName = this.serviceName || "APP";

            // Transform validation errors to our format
            let errors: ErrorDetail[] = [];
            let message = "Validation Error";

            // Handle different error structures
            if (validationError.all) {
              errors = (validationError.all as any[]).map(
                ({path, message}: {message: string, path: string}) => ({
                  field: path.replace(/^\//, '').replace(/\//g, '.'),
                  messages: [message],
                })
              );
            } else if (validationError.message) {
              // Single error
              message = validationError.message;
            }

            return {
              meta: {
                code: `${serviceName}-400`,
                message,
                errors,
              },
              data: null,
            };
          },
        };

        return { responseTools };
      })
      .onError(({ code, error, set, responseTools }) => {
        responseTools = responseTools!;
        // Handle validation errors
        if (code === "VALIDATION") {
          set.status = 400;
          return responseTools.generateValidationErrorResponse(
            error as ValidationError,
          );
        }

        // Handle other common errors only if they haven't been handled already
        switch (code) {
          case "NOT_FOUND":
            set.status = 404;
            return responseTools.generateErrorResponse(
              "Not found",
              "404",
              "Resource not found"
            );
          default:
            // Only handle if status hasn't been set yet
            if (set.status === 200 || !set.status) {
              set.status = 500;
              return responseTools.generateErrorResponse(
                "Internal server error",
                "500",
                "An unexpected error occurred"
              );
            }
            // If status was already set, don't interfere
            return responseTools.generateErrorResponse(
              "Internal server error",
              "500",
              error.toString()
            );
        }
      });
