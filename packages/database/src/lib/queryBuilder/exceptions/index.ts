import { DbException } from "../../exceptions";

export class QueryBuilderException extends DbException {
  constructor(message: string) {
    super(message);
    this.name = 'QueryBuilderException';
  }
}

export class QueryBuilderNotInitializedException extends QueryBuilderException {
  constructor(message = 'Query builder not initialized') {
    super(message);
    this.name = 'QueryBuilderNotInitializedException';
  }
}

export class QueryBuilderWrongColumnException extends QueryBuilderException {
  constructor(message = 'Query builder wrong column exception') {
    super(message);
    this.name = 'QueryBuilderWrongColumnException';
  }
}

export class QueryBuilderWrongDatabaseClientException extends QueryBuilderException {
  constructor(message = 'Query builder wrong database client exception') {
    super(message);
    this.name = 'QueryBuilderWrongDatabaseClientException';
  }
}

export class QueryBuilderWrongColumnsException extends QueryBuilderException {
  constructor(message = 'Query builder wrong columns exception') {
    super(message);
    this.name = 'QueryBuilderWrongColumnsException';
  }
}

export class QueryBuilderMethodChainedException extends QueryBuilderException {
  constructor(message = 'Query builder method chained exception') {
    super(message);
    this.name = 'QueryBuilderMethodChainedException';
  }
}

export class QueryBuilderOperationNotAllowedException extends QueryBuilderException {
  constructor(message = 'Query builder operation not allowed exception') {
    super(message);
    this.name = 'QueryBuilderOperationNotAllowedException';
  }
}
export default {
  QueryBuilderException
};
