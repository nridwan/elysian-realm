import Elysia, { type ValidationError } from "elysia";
import { ErrorKeys } from "./error_handler_plugin";
import { localizationPlugin, LocalizationTools } from "./localization_plugin";

// Define the service name type
export type ServiceName = "AUTH" | "ADMIN" | "USER" | "AUDIT" | "PASSKEY";

// Define TypeScript types for our response structure
export interface ErrorDetail {
  field: string;
  messages: string[];
}

export interface Meta {
  code: string;
  message: string;
  errors?: ErrorDetail[];
}

export interface BaseResponse<T> {
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
    validationError: ValidationError,
    localizationTools?: any
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
      .use(localizationPlugin())
      .derive(({ localizationTools }) => {
        const responseTools: ResponseTools = createResponseTools(
          config,
          localizationTools
        );

        return { responseTools };
      })
      .onError(({ code, error, set, responseTools, localizationTools }) => {
        responseTools = responseTools!;
        // Handle validation errors
        switch (code) {
          case "VALIDATION":
            set.status = 400;
            return responseTools.generateValidationErrorResponse(
              error as ValidationError
            );
          case "NOT_FOUND":
            set.status = 404;
            return responseTools.generateErrorResponse(
              localizationTools?.getTranslation
                ? localizationTools.getTranslation("not_found")
                : "Not found",
              "404",
              localizationTools?.getTranslation
                ? localizationTools.getTranslation("resource_not_found")
                : "Resource not found"
            );
          default:
            // Only handle if status hasn't been set yet
          if (set.status === 200 || !set.status) {
            set.status = 500;
            return responseTools.generateErrorResponse(
              localizationTools?.getTranslation
                ? localizationTools.getTranslation("internal_server_error")
                : "Internal server error",
              "500",
              localizationTools?.getTranslation
                ? localizationTools.getTranslation("unexpected_error")
                : "An unexpected error occurred"
            );
          }
          // If status was already set, don't interfere
          return responseTools.generateErrorResponse(
            localizationTools?.getTranslation
              ? localizationTools.getTranslation("internal_server_error")
              : "Internal server error",
            "500",
            (error as Error).toString()
          );
        }
      });

function createResponseTools(
  config: { defaultServiceName?: ServiceName } | undefined,
  localizationTools: LocalizationTools
): ResponseTools {
  return {
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
      // Use localization if available, otherwise fallback to default messages
      const statusMessage =
        message ||
        (localizationTools?.getTranslation
          ? localizationTools.getTranslation("success")
          : "Success");

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
      // Use localization if available, otherwise fallback to provided message or error
      const statusMessage =
        message ||
        (localizationTools?.getTranslation
          ? localizationTools.getTranslation("error")
          : error);

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
      // Use localization if available, otherwise fallback to default message
      let message = localizationTools?.getTranslation
        ? localizationTools.getTranslation("validation_error")
        : "Validation Error";

      // Handle different error structures
      if (validationError.all) {
        errors = (validationError.all as any[]).map(
          ({
            path,
            message,
            schema,
          }: {
            message: string;
            path: string;
            schema: Record<string, any>;
          }) => {
            const field = path.replace(/^\//, "").replaceAll("/", ".");

            // If the message is one of our error keys, translate it with parameters
            let translatedMessage = message;
            if (localizationTools?.getTranslation) {
              const params = {
                field,
                ...schema,
              };

              // Check if the message is one of our error keys
              if (Object.values(ErrorKeys).includes(message as any)) {
                translatedMessage = localizationTools.getTranslation(
                  message,
                  params
                );
              }
            }

            return {
              field,
              messages: [translatedMessage],
            };
          }
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
}
