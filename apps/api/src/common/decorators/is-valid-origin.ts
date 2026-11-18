import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/** Parses a URL and returns its origin (`scheme://host[:port]`), or `null` if it is not a URL. */
const toOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * Validates that a URL's origin is one of `allowedOrigins`.
 *
 * Matches the full origin — scheme, host and port — exactly, so `http://` vs `https://`,
 * subdomains and lookalikes (`a11studio.com.evil.example`) are all rejected. Path, query and
 * hash are ignored. Allowlist entries are normalized too, so a trailing slash is fine.
 */
export const IsValidOrigin = (allowedOrigins: string[], validationOptions?: ValidationOptions) => {
  const allowed = new Set(allowedOrigins.map(toOrigin).filter((o): o is string => o !== null));

  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isValidOrigin',
      target: object.constructor,
      propertyName,
      constraints: [allowedOrigins],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const origin = toOrigin(value);
          return origin !== null && allowed.has(origin);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must point to an allowed origin`;
        },
      },
    });
};
