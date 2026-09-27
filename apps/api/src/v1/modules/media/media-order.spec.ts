import type { MediaIndexRequest } from '@repo/common-lib/types/media';
import type { QueryBuilder } from '@repo/database/queryBuilder';
import { RequestService } from 'src/common/services/request.service';
import { MediaRepository } from './media.repository';

/**
 * Pagination appends `id DESC` as a tiebreaker. The requested sort has to be pushed before it, or
 * the list is ordered by id alone and `order_by` silently does nothing.
 */
describe('MediaRepository.applyFilters — order', () => {
    let repository: MediaRepository;
    let query: {
        [K in 'where' | 'select' | 'orderBy' | 'whereGroup' | 'count' | 'limit' | 'offset']: jest.Mock;
    };

    beforeEach(() => {
        query = {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            whereGroup: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue(0),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
        };
        repository = new MediaRepository({ pagination: null } as unknown as RequestService);
    });

    const orderCalls = async (filters: Partial<MediaIndexRequest>) => {
        await repository.applyFilters(
            { paginated: true, ...filters } as MediaIndexRequest,
            query as unknown as QueryBuilder,
        );
        return query.orderBy.mock.calls;
    };

    it('defaults to newest created first, ahead of the id tiebreaker', async () => {
        expect(await orderCalls({})).toEqual([
            ['created_at', 'DESC'],
            ['id', 'DESC'],
        ]);
    });

    it('honours the requested column and direction', async () => {
        expect(await orderCalls({ order_by: 'created_at', order: 'ASC' })).toEqual([
            ['created_at', 'ASC'],
            ['id', 'DESC'],
        ]);
    });

    it('puts never-generated media first when ordering by seo_generated_at oldest first', async () => {
        expect(await orderCalls({ order_by: 'seo_generated_at', order: 'ASC' })).toEqual([
            ['(media.seo_generated_at IS NULL)', 'DESC'],
            ['seo_generated_at', 'ASC'],
            ['id', 'DESC'],
        ]);
    });

    it('puts never-generated media last when ordering by seo_generated_at newest first', async () => {
        expect(await orderCalls({ order_by: 'seo_generated_at', order: 'DESC' })).toEqual([
            ['(media.seo_generated_at IS NULL)', 'ASC'],
            ['seo_generated_at', 'DESC'],
            ['id', 'DESC'],
        ]);
    });
});
