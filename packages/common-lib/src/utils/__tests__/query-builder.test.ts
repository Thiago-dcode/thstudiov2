import {queryParamBuilder} from "../query-builder";


describe('QueryBuilder', () => {
    it('should build query with primitive types', () => {
        let query = queryParamBuilder('users', {
           
        });
        expect(query).toBe('users');

        query = queryParamBuilder('users', {name: 'John'});
        expect(query).toBe('users?name=John');

        query = queryParamBuilder('users', {name: 'John', age: 20});
        expect(query).toBe('users?name=John&age=20');

        query = queryParamBuilder('users', {name: 'John', age: 20, active: true, created_at: new Date('2021-01-01').toISOString(), deleted_at: undefined});
        expect(query).toBe('users?name=John&age=20&active=1&created_at=2021-01-01T00:00:00.000Z');
    });

    it('should build query with arra types', () => {
        let query = queryParamBuilder('users', {name: 'John', age: 20, active: true, tags: ['tag1', 'tag2']});
        expect(query).toBe('users?name=John&age=20&active=1&tags[]=tag1&tags[]=tag2');

        query = queryParamBuilder('users', {name: 'John', age: 20, active: true, tags: ['tag1', 'tag2'],surnames: ['Doe', 'Smith', 'Johnson', 'Williams']});
        expect(query).toBe('users?name=John&age=20&active=1&tags[]=tag1&tags[]=tag2&surnames[]=Doe&surnames[]=Smith&surnames[]=Johnson&surnames[]=Williams');
    });

    
    it('should build query when the resource ends with slash', () => {
        let query = queryParamBuilder('users/', {name: 'John', age: 20, active: true, tags: ['tag1', 'tag2']});
        expect(query).toBe('users?name=John&age=20&active=1&tags[]=tag1&tags[]=tag2');
    });

    it('should sanitize trailing ? from resource', () => {
        let query = queryParamBuilder('users?', {name: 'John'});
        expect(query).toBe('users?name=John');

        query = queryParamBuilder('users/?', {name: 'John'});
        expect(query).toBe('users?name=John');
    });

    it('should append to existing query params with &', () => {
        let query = queryParamBuilder('users?status=active', {name: 'John'});
        expect(query).toBe('users?status=active&name=John');

        query = queryParamBuilder('users?status=active&role=admin', {name: 'John', age: 20});
        expect(query).toBe('users?status=active&role=admin&name=John&age=20');
    });

    it('should return resource as-is when no query params provided', () => {
        expect(queryParamBuilder('users?status=active')).toBe('users?status=active');
        expect(queryParamBuilder('users?')).toBe('users');
        expect(queryParamBuilder('users/')).toBe('users');
    });

   //TODO: Add test for nested objects when is needed


    
});