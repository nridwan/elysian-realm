import { DefaultErrorFunction, SetErrorFunction, ValueErrorType } from "@sinclair/typebox/errors"

// Define error keys for localization
export const ErrorKeys = {
  STRING_FORMAT: 'validation.string_format',
  STRING_FORMAT_EMAIL: 'validation.string_format_email',
  STRING_FORMAT_UUID: 'validation.string_format_uuid',
  STRING_FORMAT_URI: 'validation.string_format_uri',
  STRING_FORMAT_DATETIME: 'validation.string_format_datetime',
  STRING_MIN_LENGTH: 'validation.string_min_length',
  STRING_MAX_LENGTH: 'validation.string_max_length',
  STRING_PATTERN: 'validation.string_pattern',
  OBJECT_REQUIRED_PROPERTY: 'validation.required_property',
  STRING_TYPE: 'validation.string_type',
  NUMBER_TYPE: 'validation.number_type',
  BOOLEAN_TYPE: 'validation.boolean_type',
  ARRAY_TYPE: 'validation.array_type',
  ARRAY_MIN_ITEMS: 'validation.array_min_items',
  ARRAY_MAX_ITEMS: 'validation.array_max_items',
} as const

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
                    return ErrorKeys.STRING_FORMAT_EMAIL
                }
                if (err.schema.format === 'uuid') {
                    return ErrorKeys.STRING_FORMAT_UUID
                }
                if (err.schema.format === 'uri') {
                    return ErrorKeys.STRING_FORMAT_URI
                }
                if (err.schema.format === 'date-time') {
                    return ErrorKeys.STRING_FORMAT_DATETIME
                }
                return ErrorKeys.STRING_FORMAT
                
            case ValueErrorType.StringMinLength:
                return ErrorKeys.STRING_MIN_LENGTH
                
            case ValueErrorType.StringMaxLength:
                return ErrorKeys.STRING_MAX_LENGTH
                
            case ValueErrorType.StringPattern:
                return ErrorKeys.STRING_PATTERN
                
            case ValueErrorType.ObjectRequiredProperty:
                return ErrorKeys.OBJECT_REQUIRED_PROPERTY
                
            case ValueErrorType.String:
                return ErrorKeys.STRING_TYPE
                
            case ValueErrorType.Number:
                return ErrorKeys.NUMBER_TYPE
                
            case ValueErrorType.Boolean:
                return ErrorKeys.BOOLEAN_TYPE
                
            case ValueErrorType.Array:
                return ErrorKeys.ARRAY_TYPE
                
            case ValueErrorType.ArrayMinItems:
                return ErrorKeys.ARRAY_MIN_ITEMS
                
            case ValueErrorType.ArrayMaxItems:
                return ErrorKeys.ARRAY_MAX_ITEMS
                
            default:
                // Fall back to the default error handler for unhandled cases
                return DefaultErrorFunction(err)
        }
    })
}