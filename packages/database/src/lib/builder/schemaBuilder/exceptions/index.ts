import { DbException } from '../../../exceptions';

export class SchemaBuilderException extends DbException {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaBuilderException';
  }
}
export class SchemaBuilderOperationNotAllowedException extends SchemaBuilderException {
  constructor(message = 'Schema builder operation not allowed exception') {
    super(message);
    this.name = 'SchemaBuilderOperationNotAllowedException';
  }
}
