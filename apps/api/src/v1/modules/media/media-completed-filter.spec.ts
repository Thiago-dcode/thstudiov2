import type { MediaIndexRequest } from '@repo/common-lib/types/media';
import type { QueryBuilder } from '@repo/database/queryBuilder';
import { RequestService } from 'src/common/services/request.service';
import { MediaRepository } from './media.repository';

/**
 * `completed` asks whether the media has an asset it is safe to show. That answer lives on
 * `completed_at`, not on `status`: status is a lifecycle position and used to mint COMPLETED
 * without an asset (see `restoreStatus` / `media_completed_has_completed_at`).
 *
 * These assertions name the column and the SQL null operators explicitly, because a `!= null`
 * or a status filter still "works" on freshly written data and only shows up against real history.
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

    const completedAtFilters = () =>
        query.where.mock.calls.filter(([column]) => column === 'completed_at');

    it('asks for a recorded completion, which is what makes an asset safe to show', async () => {
        await applyFilters({ completed: true });

        expect(completedAtFilters()).toEqual([['completed_at', 'IS NOT', null]]);
        expect(statusFilters()).toEqual([]);
    });

    it('does not require status COMPLETED, so an edit on a finished media still shows', async () => {
        await applyFilters({ completed: true });

        // A finished media parked in UPDATING / GENERATING_METADATA keeps its timestamp, so it
        // stays in the grid. A first upload still in flight has no timestamp and does not —
        // the client shows those from its own in-progress upload state.
        expect(query.where).not.toHaveBeenCalledWith('status', '=', 'COMPLETED');
        expect(query.where).not.toHaveBeenCalledWith('status', '!=', 'FAILED');
    });

    it('asks for rows with no completion when completed is false', async () => {
        await applyFilters({ completed: false });

        expect(completedAtFilters()).toEqual([['completed_at', 'IS', null]]);
        expect(statusFilters()).toEqual([]);
    });

    it('does not constrain status or completed_at when completed is omitted', async () => {
        await applyFilters({ user_id: 2 });

        expect(statusFilters()).toEqual([]);
        expect(completedAtFilters()).toEqual([]);
    });
});
