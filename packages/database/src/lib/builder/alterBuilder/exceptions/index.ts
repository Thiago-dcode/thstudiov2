import { DbException } from '../../../exceptions';

export class AlterBuilderException extends DbException {
  constructor(message: string) {
    super(message);
    this.name = 'AlterBuilderException';
  }
}
export class SchemaBuilderOperationNotAllowedException extends AlterBuilderException {
  constructor(message = 'Alter builder operation not allowed exception') {
    super(message);
    this.name = 'AlterBuilderOperationNotAllowedException';
  }
}
