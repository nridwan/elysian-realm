import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { superFetch } from '$lib/utils/fetch';

const API_BASE_URL = '/api/auth/passkey';

/**
 * Start passkey registration process
 */
export async function startPasskeyRegistration(email: string, name?: string, uuid?: string) {
  const payload: { email: string; name?: string; uuid?: string } = { email };
  if (name) {
    payload.name = name;
  }
  if (uuid) {
    payload.uuid = uuid;
  }
  
  const response = await superFetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.options;
}

/**
 * Finish passkey registration process
 */
export async function finishPasskeyRegistration(response: RegistrationResponseJSON, uuid?: string) {
  const payload: { response: RegistrationResponseJSON; uuid?: string } = { response };
  if (uuid) {
    payload.uuid = uuid;
  }
  
  const finishResponse = await superFetch(`${API_BASE_URL}/register/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return finishResponse;
}

/**
 * Start passkey authentication process with email
 */
export async function startPasskeyAuthentication(email: string, uuid?: string) {
  const payload: { email: string; uuid?: string } = { email };
  if (uuid) {
    payload.uuid = uuid;
  }
  
  const response = await superFetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.options;
}

/**
 * Start passwordless passkey authentication process
 */
export async function startPasswordlessPasskeyAuthentication(uuid?: string) {
  const response = await superFetch(`${API_BASE_URL}/login/passwordless`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({uuid}),
  });

  return response.options;
}

/**
 * Finish passkey authentication process
 */
export async function finishPasskeyAuthentication(response: AuthenticationResponseJSON, uuid?: string) {
  const payload: { response: AuthenticationResponseJSON; uuid?: string } = { response };
  if (uuid) {
    payload.uuid = uuid;
  }
  
  const finishResponse = await superFetch(`${API_BASE_URL}/login/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return finishResponse;
}

/**
 * Get user's passkeys
 */
export async function getUserPasskeys() {
  const response = await superFetch(`${API_BASE_URL}s`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}

/**
 * Delete a passkey
 */
export async function deletePasskey(id: string) {
  const response = await superFetch(`${API_BASE_URL}s/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}

/**
 * Register a new passkey for the current user
 */
export async function registerPasskey(email: string, name?: string, uuid?: string) {
  try {
    // Start registration
    const options = await startPasskeyRegistration(email, name, uuid);
    
    // Use WebAuthn browser API to create the credential
    const registrationResponse = await startRegistration({ optionsJSON: options });
    
    // Finish registration
    const result = await finishPasskeyRegistration(registrationResponse, uuid);
    
    return result;
  } catch (error) {
    console.error((error as Record<string, string>)?.stack)
    console.error('Passkey registration error:', error);
    throw error;
  }
}

/**
 * Authenticate with an existing passkey (passwordless)
 */
export async function authenticateWithPasskeyPasswordless(uuid?: string) {
  try {
    // Start passwordless authentication
    const options = await startPasswordlessPasskeyAuthentication(uuid);
    
    // Use WebAuthn browser API to get the credential
    const authenticationResponse = await startAuthentication({ optionsJSON: options });
    
    // Finish authentication
    const result = await finishPasskeyAuthentication(authenticationResponse, uuid);
    
    return result;
  } catch (error) {
    console.error('Passkey authentication error:', error);
    throw error;
  }
}

/**
 * Authenticate with an existing passkey (email-based) - kept for backwards compatibility
 */
export async function authenticateWithPasskey(email: string, uuid?: string) {
  try {
    // Start email-based authentication
    const options = await startPasskeyAuthentication(email, uuid);
    
    // Use WebAuthn browser API to get the credential
    const authenticationResponse = await startAuthentication({ optionsJSON: options });
    
    // Finish authentication
    const result = await finishPasskeyAuthentication(authenticationResponse, uuid);
    
    return result;
  } catch (error) {
    console.error('Passkey authentication error:', error);
    throw error;
  }
}