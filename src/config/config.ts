// Environment configuration
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
  },

  // Application configuration
  app: {
    name: process.env.APP_NAME || 'Elysian Realm',
    url: process.env.APP_URL || 'http://localhost:5173',
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

  // Swagger configuration
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Passkey/WebAuthn configuration
  passkey: {
    rpID: process.env.PASSKEY_RP_ID || 'localhost',
    rpName: process.env.PASSKEY_RP_NAME || process.env.APP_NAME || 'Elysian Realm',
    origin: process.env.PASSKEY_ORIGIN || process.env.APP_URL || 'http://localhost:5173',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    tls: process.env.REDIS_TLS === 'true',
  },
}