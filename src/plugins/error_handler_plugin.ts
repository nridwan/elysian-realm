import { DefaultErrorFunction, SetErrorFunction, ValueErrorType } from "@sinclair/typebox/errors"

/**
 * Custom error handler plugin for Elysia validation errors
 * 
 * This plugin enhances the default TypeBox error messages with more user-friendly
 * messages and proper property path formatting.
 * 
 * Error Types Handled:
 * - StringFormat: Custom formatting for email, uuid, etc.
 * - StringMinLength: Custom messages for minimum length requirements
 * - StringMaxLength: Custom messages for maximum length requirements
 * - StringPattern: Custom messages for pattern validation
 * - ObjectRequiredProperty: Custom messages for required properties
 * - ObjectAdditionalProperty: Custom messages for additional property restrictions
 * 
 * The plugin formats property paths to be more readable, e.g.:
 * - 'user.profile.email' instead of '/user/profile/email'
 */

export function errorHandlerPlugin() {
    SetErrorFunction((err) => {
        // Format the property path to be more readable
        const formattedPath = err.path.replace(/^\//, '').replace(/\//g, '.')
        
        switch (err.errorType) {
            case ValueErrorType.StringFormat:
                // Handle different string formats with specific messages
                if (err.schema.format === 'email') {
                    return `Email must be a valid email address`
                }
                if (err.schema.format === 'uuid') {
                    return `Must be a valid UUID`
                }
                if (err.schema.format === 'uri') {
                    return `Must be a valid URI`
                }
                if (err.schema.format === 'date-time') {
                    return `Must be a valid ISO 8601 date-time`
                }
                return `property '${formattedPath}' format error`
                
            case ValueErrorType.StringMinLength:
                const minLength = err.schema.minLength ?? 0
                return `Must be at least ${minLength} characters`
                
            case ValueErrorType.StringMaxLength:
                const maxLength = err.schema.maxLength ?? 0
                return `Must be no more than ${maxLength} characters`
                
            case ValueErrorType.StringPattern:
                return `Must match the required pattern`
                
            case ValueErrorType.ObjectRequiredProperty:
                return `This field is required`
                
            case ValueErrorType.String:
                return `Must be a string`
                
            case ValueErrorType.Number:
                return `Must be a number`
                
            case ValueErrorType.Boolean:
                return `Must be a boolean`
                
            case ValueErrorType.Array:
                return `Must be an array`
                
            case ValueErrorType.ArrayMinItems:
                const minItems = err.schema.minItems ?? 0
                return `Must have at least ${minItems} items`
                
            case ValueErrorType.ArrayMaxItems:
                const maxItems = err.schema.maxItems ?? 0
                return `Must have no more than ${maxItems} items`
                
            default:
                // Fall back to the default error handler for unhandled cases
                return DefaultErrorFunction(err)
        }
    })
}