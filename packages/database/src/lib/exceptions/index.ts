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
export default {
  DbException
};
