// Environment configuration
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'supersecretkey',
  },

  // Token expiration configuration
  token: {
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '5m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '60d',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/elysian-realm?schema=public',
  },

  // OpenTelemetry configuration
  openTelemetry: {
    serviceName: process.env.OTEL_SERVICE_NAME || 'elysian-realm',
    exporterType: process.env.OTEL_EXPORTER_TYPE || 'console',
    otlpEndpoint: process.env.OTEL_OTLP_ENDPOINT || '',
  },

  // Localization configuration
  localization: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  },
}