import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import { responsePlugin } from "./response_plugin";
import { ErrorKeys } from "./error_handler_plugin";

describe("ResponsePlugin Validation Error Handling", () => {
  it("should transform validation errors to BaseResponse format", async () => {
    const app = new Elysia()
      .use(responsePlugin())
      .post("/login", ({ responseTools, body, localizationTools }) => {
        // This would normally be handled by Elysia's validation
        // But for testing purposes, we'll simulate a validation error
        responseTools.setServiceName("AUTH");
        // Create a mock validation error for testing
        const mockValidationError = {
          type: "validation",
          all: [
            {
              type: 50,
              schema: {
                description: "User email address for authentication",
                examples: ["user@example.com"],
                minLength: 5,
                format: "email",
                type: "string",
              },
              path: "/email",
              value: "invalid",
              message: ErrorKeys.STRING_FORMAT_EMAIL,
              errors: [],
              summary: "Property 'email' should be email",
            },
            {
              summary: "Expected string length greater or equal to 8",
              type: 52,
              schema: {
                description: "User password for authentication",
                examples: ["password123"],
                minLength: 8,
                type: "string",
              },
              path: "/password",
              value: "p",
              message: ErrorKeys.STRING_MIN_LENGTH,
              errors: [],
            },
          ],
        } as any;

        return responseTools.generateValidationErrorResponse(
          mockValidationError,
          localizationTools
        );
      });

    const response = await app.handle(
      new Request("http://localhost/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      })
    );

    const text = await response.text();
    console.log("Validation response status:", response.status);
    console.log("Validation response text:", text);

    // Try to parse as JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      console.error("Response text:", text);
      throw e;
    }

    expect(response.status).toBe(200); // We're returning a response object, not an HTTP error
    expect(body).toHaveProperty("meta");
    expect(body).toHaveProperty("data");
    expect(body.meta.code).toBe("AUTH-400");
    expect(body.meta.message).toBe("Validation Error");
    expect(body.meta).toHaveProperty("errors");
    expect(Array.isArray(body.meta.errors)).toBe(true);
    expect(body.data).toBeNull();

    // Check that we have errors for both fields with translated messages
    const emailError = body.meta.errors.find((e: any) => e.field === "email");
    expect(emailError).toBeDefined();
    expect(emailError.messages[0]).toBe("Property 'email' must be a valid email address");

    const passwordError = body.meta.errors.find((e: any) => e.field === "password");
    expect(passwordError).toBeDefined();
    expect(passwordError.messages[0]).toBe("Property 'password' must be at least 8 characters");
  });
});
