import { PrismaClient } from '@prisma/client';
import { 
  generateAuthenticationOptions, 
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture
} from '@simplewebauthn/server';
import type { 
  AuthenticationResponseJSON, 
  RegistrationResponseJSON 
} from '@simplewebauthn/types';
import { config } from '../../../config/config';
import { RedisClient } from 'bun';

// Types for our passkey service
export interface PasskeyRegistrationOptions {
  userId: string;
  email: string;
  name: string;
  passKeyName?: string;
  uuid?: string;
}

export interface PasskeyAuthenticationOptions {
  email: string | undefined;
  uuid?: string;
}

export class PasskeyService {
  private rpName = config.passkey.rpName;
  private rpID = config.passkey.rpID;
  private origin = config.passkey.origin;
  private redis: RedisClient;

  constructor(private prisma: PrismaClient) {
    // Initialize Bun's built-in Redis client using config values
    const passwordPart = config.redis.password ? `${config.redis.password}@` : '';
    this.redis = new RedisClient(`redis://${passwordPart}${config.redis.host}:${config.redis.port}`);
  }

  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions({ userId, email, name, passKeyName, uuid }: PasskeyRegistrationOptions) {
    try {
      // Get existing passkeys for this user
      const existingPasskeys = await this.prisma.passkey.findMany({
        where: { userId }
      });

      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: Buffer.from(userId, 'utf-8'),
        userName: email,
        userDisplayName: name,
        attestationType: 'none',
        excludeCredentials: existingPasskeys.map(passkey => ({
          id: passkey.id,
          type: 'public-key',
          transports: passkey.transports as AuthenticatorTransportFuture[],
        })),
        authenticatorSelection: {
          authenticatorAttachment: undefined, // Allow both platform and cross-platform authenticators
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        timeout: 120000, // 2 minutes timeout for better UX
      });

      // Store the challenge for later verification along with the passkey name
      await this.storeRegistrationChallenge(userId, options.challenge, passKeyName, uuid);

      return { success: true, options };
    } catch (error) {
      console.error('Error generating registration options:', error);
      return { success: false, error: 'Failed to generate registration options' };
    }
  }

  /**
   * Verify and store a new passkey
   */
  async verifyRegistrationResponse(userId: string, response: RegistrationResponseJSON, uuid?: string) {
    try {
      // Get the expected challenge and associated passkey name
      const { challenge, passKeyName } = await this.getExpectedRegistrationChallengeWithPasskeyName(userId, uuid);
      
      if (!challenge) {
        return { success: false, error: 'No registration challenge found' };
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
        
        // Store the passkey in the database with name
        const passkey = await this.prisma.passkey.create({
          data: {
            id: credential.id,
            userId,
            name: passKeyName || null, // Use the provided name or null if not provided
            publicKey: credential.publicKey,
            counter: credential.counter,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: response.response.transports ?? [],
          }
        });

        // Clear the challenge after successful registration
        await this.clearRegistrationChallenge(userId, uuid);

        return { success: true, passkey };
      }

      return { success: false, error: 'Passkey verification failed' };
    } catch (error) {
      console.error('Error verifying registration response:', error);
      return { success: false, error: 'Failed to verify registration response' };
    }
  }

  /**
   * Generate authentication options for email-based login
   */
  async generateAuthenticationOptions({ email, uuid }: PasskeyAuthenticationOptions) {
    try {
      if (!email) {
        return { success: false, error: 'Email is required for email-based authentication' };
      }
      
      // Find the user
      const user = await this.prisma.admin.findUnique({
        where: { email }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Get existing passkeys for this user
      const passkeys = await this.prisma.passkey.findMany({
        where: { userId: user.id }
      });

      if (passkeys.length === 0) {
        return { success: false, error: 'No passkeys found for this user' };
      }

      const authOptions = await generateAuthenticationOptions({
        rpID: this.rpID,
        userVerification: 'preferred',
        allowCredentials: passkeys.map(passkey => ({
          id: passkey.id,
          type: 'public-key',
          transports: passkey.transports as AuthenticatorTransportFuture[],
        })),
      });

      // Store the challenge for later verification using UUID if provided
      await this.storeAuthenticationChallenge(user.id, authOptions.challenge);

      return { success: true, options: authOptions, userId: user.id };
    } catch (error) {
      console.error('Error generating authentication options:', error);
      return { success: false, error: 'Failed to generate authentication options' };
    }
  }
  
  /**
   * Generate passwordless authentication options - allows any passkey from this device
   */
  async generatePasswordlessAuthenticationOptions(uuid: string) {
    try {
      const authOptions = await generateAuthenticationOptions({
        rpID: this.rpID,
        userVerification: 'preferred',
        // Don't specify allowCredentials to allow any passkey registered for this RP ID
      });

      // Store the challenge with a special identifier for passwordless
      await this.storePasswordlessAuthenticationChallenge(authOptions.challenge, uuid);

      return { success: true, options: authOptions };
    } catch (error) {
      console.error('Error generating passwordless authentication options:', error);
      return { success: false, error: 'Failed to generate passwordless authentication options' };
    }
  }

  /**
   * Verify authentication response
   * If userId is provided, we're doing email-based authentication
   * If userId is empty, we're doing passwordless authentication where the passkey ID identifies the user
   */
  async verifyAuthenticationResponse(userId: string, response: AuthenticationResponseJSON, uuid?: string) {
    try {
      // Get the passkey from the database using the rawId from the response
      const passkey = await this.prisma.passkey.findUnique({
        where: { id: response.rawId }
      });

      if (!passkey) {
        return { success: false, error: 'Passkey not found' };
      }

      let expectedChallenge: string | null = null;
      
      if (userId) {
        // Email-based authentication - use user-specific challenge (with optional UUID)
        expectedChallenge = await this.getExpectedAuthenticationChallenge(userId);
      } else {
        // Passwordless authentication - use passwordless challenge
        expectedChallenge = await this.getPasswordlessExpectedChallenge(uuid ?? '');
      }
      
      if (!expectedChallenge) {
        return { success: false, error: 'No authentication challenge found' };
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: passkey.id,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: passkey.counter,
          transports: passkey.transports as AuthenticatorTransportFuture[],
        },
      });

      if (verification.verified) {
        // Update the counter to prevent replay attacks
        await this.prisma.passkey.update({
          where: { id: passkey.id },
          data: { counter: verification.authenticationInfo.newCounter }
        });

        // Clear the appropriate challenge after successful authentication
        if (userId) {
          await this.clearAuthenticationChallenge(userId);
        } else {
          await this.clearPasswordlessAuthenticationChallenge(uuid ?? '');
        }

        return { success: true, userId: passkey.userId };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('Error verifying authentication response:', error);
      return { success: false, error: 'Failed to verify authentication response' };
    }
  }

  /**
   * Get all passkeys for a user
   */
  async getUserPasskeys(userId: string) {
    try {
      const passkeys = await this.prisma.passkey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true, // Include the name field
          deviceType: true,
          backedUp: true,
          transports: true,
          created_at: true,
          updated_at: true,
        }
      });
      
      return { success: true, passkeys };
    } catch (error) {
      console.error('Error getting user passkeys:', error);
      return { success: false, error: 'Failed to retrieve passkeys' };
    }
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(userId: string, passkeyId: string) {
    try {
      const passkey = await this.prisma.passkey.findUnique({
        where: { id: passkeyId }
      });

      if (!passkey) {
        return { success: false, error: 'Passkey not found' };
      }

      if (passkey.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      await this.prisma.passkey.delete({
        where: { id: passkeyId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting passkey:', error);
      return { success: false, error: 'Failed to delete passkey' };
    }
  }

  // Helper methods for storing/retrieving challenges using Redis
  private async storeRegistrationChallenge(userId: string, challenge: string, passKeyName?: string, uuid?: string) {
    const key = uuid 
      ? `passkey:registration:challenge:${uuid}`
      : `passkey:registration:challenge:${userId}`;
    const challengeData = {
      challenge,
      passKeyName: passKeyName || null
    };

    // Store with 5-minute expiration
    await this.redis.set(key, JSON.stringify(challengeData), "EX", 300);
  }

  private async getExpectedRegistrationChallengeWithPasskeyName(userId: string, uuid?: string) {
    const key = uuid 
      ? `passkey:registration:challenge:${uuid}`
      : `passkey:registration:challenge:${userId}`;
    const challengeData = await this.redis.get(key);
    
    if (!challengeData) {
      return { challenge: null, passKeyName: null };
    }
    
    const parsed = JSON.parse(challengeData);
    return {
      challenge: parsed.challenge,
      passKeyName: parsed.passKeyName
    };
  }

  private async clearRegistrationChallenge(userId: string, uuid?: string) {
    const key = uuid 
      ? `passkey:registration:challenge:${uuid}`
      : `passkey:registration:challenge:${userId}`;
    await this.redis.del(key);
  }

  private async storeAuthenticationChallenge(userId: string, challenge: string) {
    const key = `passkey:authentication:challenge:${userId}`;
    
    // Store with 5-minute expiration
    await this.redis.set(key, challenge, "EX", 300);
  }

  private async getExpectedAuthenticationChallenge(userId: string) {
    const key = `passkey:authentication:challenge:${userId}`;
    return await this.redis.get(key);
  }

  private async clearAuthenticationChallenge(userId: string) {
    const key = `passkey:authentication:challenge:${userId}`;
    await this.redis.del(key);
  }
  
  // Helper methods for passwordless authentication challenges
  private async storePasswordlessAuthenticationChallenge(challenge: string, uuid: string) {
    const key = `passkey:passwordless:challenge:${uuid}`;
    
    // Store with 5-minute expiration
    await this.redis.set(key, challenge, "EX", 300);
  }

  private async getPasswordlessExpectedChallenge(uuid: string) {
    const key = `passkey:passwordless:challenge:${uuid}`;
    return await this.redis.get(key);
  }

  private async clearPasswordlessAuthenticationChallenge(uuid: string) {
    const key = `passkey:passwordless:challenge:${uuid}`;
    await this.redis.del(key);
  }
}