export class DbException extends Error {
  public code: number = 500;
  constructor(message: string, code: number = 500) {
    super(message);
    this.name = 'DbException';
    this.code = code;
  }
} 

export default {
  DbException
};
