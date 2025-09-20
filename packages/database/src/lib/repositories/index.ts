import { QueryBuilder } from '../builder/queryBuilder';

export class BaseRepository {
  constructor(protected readonly queryBuilder: QueryBuilder) {
    
  }
}
