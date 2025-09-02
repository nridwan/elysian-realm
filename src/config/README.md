# Configuration

This directory contains the application's configuration files.

## config.ts

This is the main configuration file that centralizes all environment variable handling. It reads from environment variables and provides default values.

## token.config.ts

This file contains token-specific configuration that uses values from `config.ts`.

## Usage

Instead of directly accessing `process.env`, import the configuration from `config.ts`:

```typescript
import { config } from './config/config'

// Access configuration values
const port = config.server.port
const jwtSecret = config.jwt.secret
```