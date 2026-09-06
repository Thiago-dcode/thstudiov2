import type { MediaIndexRequest } from '@repo/common-lib/types/media';
import type { QueryBuilder } from '@repo/database/queryBuilder';
import { RequestService } from 'src/common/services/request.service';
import { MediaRepository } from './media.repository';

/**
 * `completed` keeps failed uploads out of the atelier grid. It is deliberately "not FAILED"
 * rather than "is COMPLETED": the grid renders an unselectable card with a spinner for
 * anything still processing, so narrowing to COMPLETED would make an upload disappear from
 * the page until its job finished.
 *
 * It used to be answered by `completed_at`, which was the wrong column in both directions - a
 * FAILED row keeps whatever `completed_at` an earlier attempt wrote, and rows older than that
 * column have a null one despite being perfectly fine. These assertions name the column and
 * the status explicitly, because either mistake still "works" on freshly written data and only
 * shows up against real history.
 */
describe('MediaRepository.applyFilters — completed', () => {
    let repository: MediaRepository;
    let query: { [K in 'where' | 'select' | 'orderBy' | 'whereGroup']: jest.Mock };

    beforeEach(() => {
        query = {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            whereGroup: jest.fn().mockReturnThis(),
        };
        repository = new MediaRepository({ pagination: null } as unknown as RequestService);
    });

    /** `paginated` stays false so pagination short-circuits before it can touch the database. */
    const applyFilters = (filters: Partial<MediaIndexRequest>) =>
        repository.applyFilters(
            filters as MediaIndexRequest,
            query as unknown as QueryBuilder,
        );

    const statusFilters = () =>
        query.where.mock.calls.filter(([column]) => column === 'status');

    it('excludes FAILED rows, which is what put a failed upload in the grid', async () => {
        await applyFilters({ completed: true });

        expect(query.where).toHaveBeenCalledWith('status', '!=', 'FAILED');
        expect(query.where).not.toHaveBeenCalledWith('completed_at', '!=', null);
    });

    it('still returns media that is mid-processing, which the grid shows as loading', async () => {
        await applyFilters({ completed: true });

        // The whole point of filtering on FAILED rather than COMPLETED: an UPLOADING or
        // GENERATING_METADATA row must survive this filter and reach the grid's spinner state.
        expect(statusFilters()).toEqual([['status', '!=', 'FAILED']]);
        expect(query.where).not.toHaveBeenCalledWith('status', '=', 'COMPLETED');
    });

    it('asks for only the failed rows when completed is false', async () => {
        await applyFilters({ completed: false });

        expect(query.where).toHaveBeenCalledWith('status', '=', 'FAILED');
        expect(query.where).not.toHaveBeenCalledWith('completed_at', '=', null);
    });

    it('does not constrain status at all when completed is omitted', async () => {
        await applyFilters({ user_id: 2 });

        expect(statusFilters()).toEqual([]);
    });
});
