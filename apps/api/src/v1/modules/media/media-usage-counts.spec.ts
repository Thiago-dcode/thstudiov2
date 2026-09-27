import type { MediaIndexRequest } from '@repo/common-lib/types/media';
import type { QueryBuilder } from '@repo/database/queryBuilder';
import { RequestService } from 'src/common/services/request.service';
import { MediaRepository } from './media.repository';

/**
 * The usage counts are two correlated subqueries per row, and they describe the owner's own
 * portfolios/collections — so they are selected only when the owner-only route asks for them.
 */
describe('MediaRepository.applyFilters — usage counts', () => {
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

    const selected = async (filters: Partial<MediaIndexRequest>) => {
        await repository.applyFilters(
            filters as MediaIndexRequest,
            query as unknown as QueryBuilder,
        );
        return query.select.mock.calls[0][0] as string[];
    };

    it('leaves the counts out of an ordinary read', async () => {
        const columns = await selected({});
        expect(columns.some((c) => c.includes('_count'))).toBe(false);
    });

    it('selects both counts when asked', async () => {
        const columns = await selected({ with_usage_counts: true });
        expect(columns.filter((c) => c.endsWith('AS collections_count'))).toHaveLength(1);
        expect(columns.filter((c) => c.endsWith('AS portfolios_count'))).toHaveLength(1);
    });

    it('counts a portfolio once whether the media is placed directly or through a collection', async () => {
        const portfolios = (await selected({ with_usage_counts: true })).find((c) =>
            c.endsWith('AS portfolios_count'),
        );
        expect(portfolios).toContain('UNION');
        expect(portfolios).not.toContain('UNION ALL');
    });
});
