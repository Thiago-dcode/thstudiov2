import { DbException } from "../../exceptions";

export class ClientException extends DbException {   
  constructor(message: string) {
    super(message);
    this.name = 'ClientException';
  }
}

export class ClientNotInitializedException extends ClientException {
  constructor(message = 'Client not initialized') {
    super(message);
    this.name = 'ClientNotInitializedException';
  }
}

export class ClientAlreadyInitializedException extends ClientException {
  constructor(message = 'Client already initialized') {
    super(message);
    this.name = 'ClientAlreadyInitializedException';
  }
}

export class InvalidDatabaseClientException extends ClientException {
  constructor(message = 'Invalid database client') {
    super(message);
    this.name = 'InvalidDatabaseClientException';
  }
}

export default {
  ClientException,
  ClientNotInitializedException,
  ClientAlreadyInitializedException,
  InvalidDatabaseClientException,
};
