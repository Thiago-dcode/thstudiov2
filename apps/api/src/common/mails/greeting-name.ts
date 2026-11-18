import { UserSchema } from '@repo/common-lib/schemas/user';

/**
 * The name a mail greets the user by, or `null` for the nameless greeting. Never the username:
 * email sign-ups get a random one (`artistk3x9q2mf`) until onboarding's Name step replaces it.
 */
export const mailGreetingName = (user: Partial<Pick<UserSchema, 'name'>>): string | null =>
  user.name?.trim() || null;
