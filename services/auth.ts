import { ServiceError, simulateLatency } from "./_client";

/**
 * Authentication boundary — intentionally NOT implemented.
 * Wire these to your auth provider (e.g. Server Actions + httpOnly session cookie).
 * Never handle secrets or tokens in client components.
 */

export type SignInInput = { email: string; password: string };
export type SignUpInput = { name: string; email: string; company: string; password: string };

/** TODO(auth): replace with a Server Action that creates a session. */
export async function signIn(input: SignInInput): Promise<void> {
  await simulateLatency(900);
  if (input.password.length < 8) {
    throw new ServiceError("Email or password is incorrect.", "unauthorized");
  }
}

/** TODO(auth): replace with a Server Action that creates the account. */
export async function signUp(input: SignUpInput): Promise<void> {
  await simulateLatency(1100);
  if (input.email.toLowerCase().startsWith("taken@")) {
    throw new ServiceError("An account already exists for this email.", "validation");
  }
}
