/**
 * Utility for redacting sensitive data in audit trails
 */

const sensitiveKeys = [
  'password',
  'access_token',
  'refresh_token',
  'email',  // For additional privacy
  'old_password',
  'new_password',
  'confirm_password'
];

/**
 * Recursively redact sensitive data from an object
 */
export function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey) || 
        sensitiveKey.toLowerCase().includes(key)
      )) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveData(value);
      }
    }
    
    return result;
  }
  
  return obj;
}