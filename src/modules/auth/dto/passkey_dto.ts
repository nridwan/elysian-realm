import { t } from 'elysia'
import { BaseMetaDto } from '../../../dto/base.dto'

// Passkey Registration DTOs
export const PasskeyRegistrationStartDto = t.Object({
  email: t.String({
    description: 'User email address for passkey registration',
    examples: ['user@example.com'],
    minLength: 5,
    format: 'email',
  }),
  name: t.Optional(t.String({
    description: 'Display name for the passkey',
    examples: ['My Phone', 'Work Laptop'],
    minLength: 1,
    maxLength: 100,
  })),
  uuid: t.Optional(t.String({
    description: 'UUID for cross-device registration session (optional)',
    format: 'uuid',
  })),
})

export const PasskeyRegistrationFinishDto = t.Object({
  response: t.Object({
    id: t.String(),
    rawId: t.String(),
    response: t.Object({
      attestationObject: t.String(),
      clientDataJSON: t.String(),
      transports: t.Optional(t.Array(t.Any())),
      publicKeyAlgorithm: t.Optional(t.Number()),
      publicKey: t.Optional(t.String()),
      authenticatorData: t.Optional(t.String()),
    }),
    type: t.Any(),
    clientExtensionResults: t.Object({}),
    authenticatorAttachment: t.Optional(t.Any()),
  }, {
    description: 'WebAuthn registration response from the browser',
  }),
  uuid: t.Optional(t.String({
    description: 'UUID for cross-device registration session (optional)',
    format: 'uuid',
  })),
})

// Passkey Authentication DTOs
export const PasskeyAuthenticationStartDto = t.Object({
  email: t.Optional(t.String({
    description: 'User email address for passkey authentication (optional for passwordless)',
    examples: ['user@example.com'],
    minLength: 5,
    format: 'email',
  })),
  uuid: t.Optional(t.String({
    description: 'UUID for cross-device authentication session (optional)',
    format: 'uuid',
  })),
})

// Passwordless Authentication DTOs
export const PasswordlessAuthenticationStartDto = t.Object({
  uuid: t.String({
    description: 'UUID for cross-device authentication session (optional)',
    format: 'uuid',
  }),
})

export const PasskeyAuthenticationFinishDto = t.Object({
  response: t.Object({
    id: t.String(),
    rawId: t.String(),
    response: t.Object({
      attestationObject: t.Optional(t.String()),
      clientDataJSON: t.String(),
      transports: t.Optional(t.Array(t.Any())),
      publicKeyAlgorithm: t.Optional(t.Number()),
      publicKey: t.Optional(t.String()),
      authenticatorData: t.String(),
      signature: t.String(),
    }),
    type: t.Any(),
    clientExtensionResults: t.Object({}),
    authenticatorAttachment: t.Optional(t.Any()),
  }, {
    description: 'WebAuthn authentication response from the browser',
  }),
  uuid: t.Optional(t.String({
    description: 'UUID for cross-device authentication session (optional)',
    format: 'uuid',
  })),
})

// Passkey Management DTOs
export const PasskeyDto = t.Object({
  id: t.String({
    description: 'Unique identifier for the passkey',
  }),
  name: t.Union([t.String({
    description: 'Display name for the passkey',
  }), t.Null()]),
  deviceType: t.Union([t.String({
    description: 'Type of device used for the passkey',
  }), t.Null()]),
  backedUp: t.Boolean({
    description: 'Whether the passkey is backed up',
  }),
  transports: t.Array(t.String(), {
    description: 'Supported transports for the passkey',
  }),
  created_at: t.Date({
    description: 'Creation timestamp',
    format: 'date-time',
  }),
  updated_at: t.Date({
    description: 'Last update timestamp',
    format: 'date-time',
  }),
})

export const PasskeyListDto = t.Array(PasskeyDto, {
  description: 'List of user passkeys',
})

export const PasskeyOptionsResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Object({
    options: t.Any({
      description: 'WebAuthn options for registration or authentication',
    }),
  }),
})

export const PasskeyRegistrationResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Object({
    success: t.Boolean({
      description: 'Whether the registration was successful',
    }),
  }),
})

export const PasskeyAuthenticationResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([
    t.Object({
      access_token: t.String({
        description: 'JWT access token for API authentication',
        examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...']
      }),
      refresh_token: t.String({
        description: 'Refresh token for obtaining new access tokens',
        examples: ['dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4gdGV4dA==']
      }),
    }),
    t.Null()
  ], {
    description: 'Authentication token data or null if authentication failed'
  }),
})

export const PasskeyListResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Optional(PasskeyListDto),
})

export const PasskeyDeleteResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Object({
    success: t.Boolean({
      description: 'Whether the deletion was successful',
    }),
  }),
})