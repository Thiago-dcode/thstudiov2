export class DbException extends Error {
  public code: number = 500;
  constructor(message: string, code: number = 500) {
    super(message);
    this.name = 'DbException';
    this.code = code;
  }
} 
export class DbWrongTableException extends DbException {
  constructor(message: string) {
    super(message);
    this.name = 'DbWrongTableException';
  }
}

/**
 * A write violated a unique constraint (PostgreSQL SQLSTATE 23505). Raised so callers can
 * recover — e.g. a slug allocator losing a race can retry — instead of the driver error
 * surfacing as an unhandled 500.
 */
export class DbUniqueViolationException extends DbException {
  /** Name of the violated constraint, when the driver reports one. */
  public readonly constraintName?: string;

  constructor(message: string, constraintName?: string) {
    super(message, 409);
    this.name = 'DbUniqueViolationException';
    this.constraintName = constraintName;
  }
}

/** PostgreSQL `unique_violation`. */
export const PG_UNIQUE_VIOLATION = '23505';

export default {
  DbException
};
