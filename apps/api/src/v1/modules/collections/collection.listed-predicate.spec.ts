import { CollectionRepository } from './collection.repository';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { ServiceRepository } from '../services/service.repository';
import { listedEntitySql } from '../../../common/utils/public-entity';

describe('LISTED_*_PREDICATE', () => {
  it('AC-3: listedEntitySql is the active + unblocked pair on the alias', () => {
    expect(listedEntitySql('x')).toBe('x.blocked_at IS NULL AND x.is_active = true');
  });

  it('AC-2/AC-4: portfolio and service predicates are exactly the listed pair, no SEO conditions', () => {
    expect(PortfolioRepository.LISTED_PORTFOLIO_PREDICATE).toBe(listedEntitySql('p'));
    expect(ServiceRepository.LISTED_SERVICE_PREDICATE).toBe(listedEntitySql('s'));
    expect(PortfolioRepository.LISTED_PORTFOLIO_PREDICATE).not.toContain('is_indexable');
    expect(ServiceRepository.LISTED_SERVICE_PREDICATE).not.toContain('is_indexable');
  });

  it('AC-3: collection predicate requires >=1 visible media with a thumbnail', () => {
    const sql = CollectionRepository.LISTED_COLLECTION_PREDICATE.replace(/\s+/g, ' ');
    expect(sql.startsWith(listedEntitySql('c'))).toBe(true);
    expect(sql).toContain('EXISTS');
    expect(sql).toContain('collection_media');
    expect(sql).toContain('.thumbnail IS NOT NULL');
    expect(sql).toMatch(/\.blocked_at IS NULL AND \w+\.is_active = true\s*\)/);
    expect(sql).toContain('.collection_id = c.id');
    expect(sql).not.toContain('is_indexable');
  });
});
