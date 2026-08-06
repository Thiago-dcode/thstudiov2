/**
 * Reads a required environment variable, throwing when it is unset or empty.
 *
 * Credentials and secrets must never carry an inline fallback: a `??`/`||` default
 * turns a missing variable into a silent, working-but-insecure deployment (e.g. a
 * JWT signed with the literal string `'secret'`, or a seeded admin whose password
 * is published in the repo). Failing at startup is the only safe behaviour.
 *
 * @throws {Error} when the variable is unset, empty, or whitespace-only.
 */
export const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in the environment's .env — there is no default.`,
    );
  }

  return value;
};
