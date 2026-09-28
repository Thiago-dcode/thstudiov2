import { Injectable } from '@nestjs/common';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { artistShareReadySql } from '@repo/common-lib/utils/artist-share-ready';
import { Query } from '@repo/database/facades';
import { MediaRepository } from '@repo/database/repositories/media';
import { CollectionRepository } from '../collections/collection.repository';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { ServiceRepository } from '../services/service.repository';

/**
 * Locale-agnostic paths of public pages changed after a point in time — what IndexNow is told
 * about. Each kind uses the same "is this public" predicate as its sitemap shard, so nothing is
 * ever submitted that the sitemap would not also advertise (drafts, blocked or incomplete artists).
 */
@Injectable()
export class IndexNowRepository {
  async changedPathsSince(since: Date, limit: number): Promise<string[]> {
    const result = await Query.raw(
      `SELECT path FROM (
         SELECT '/artists/' || u.username AS path, u.updated_at AS changed_at
           FROM ${TABLES_ENUM.USERS} u
          WHERE u.updated_at > $1 AND ${artistShareReadySql('u.id')}
         UNION ALL
         SELECT '/artists/' || u.username || '/portfolios/' || p.slug, p.updated_at
           FROM ${TABLES_ENUM.PORTFOLIOS} p
           JOIN ${TABLES_ENUM.USERS} u ON u.id = p.user_id
          WHERE p.updated_at > $1 AND ${PortfolioRepository.PUBLIC_PORTFOLIO_PREDICATE}
         UNION ALL
         SELECT '/artists/' || u.username || '/collections/' || c.slug, c.updated_at
           FROM ${TABLES_ENUM.COLLECTIONS} c
           JOIN ${TABLES_ENUM.USERS} u ON u.id = c.user_id
          WHERE c.updated_at > $1 AND ${CollectionRepository.PUBLIC_COLLECTION_PREDICATE}
         UNION ALL
         SELECT '/artists/' || u.username || '/services/' || s.slug, s.updated_at
           FROM ${TABLES_ENUM.SERVICES} s
           JOIN ${TABLES_ENUM.USERS} u ON u.id = s.user_id
          WHERE s.updated_at > $1 AND ${ServiceRepository.PUBLIC_SERVICE_PREDICATE}
         UNION ALL
         SELECT '/artists/' || u.username || '/media/' || m.public_id, m.updated_at
           FROM ${TABLES_ENUM.MEDIA} m
           JOIN ${TABLES_ENUM.USERS} u ON u.id = m.user_id
          WHERE m.updated_at > $1 AND ${MediaRepository.PUBLIC_MEDIA_PREDICATE}
       ) changed
       ORDER BY changed_at DESC
       LIMIT $2`,
      [since.toISOString(), limit],
    );
    const rows = Array.isArray(result) ? result[0] : result?.rows ?? [];
    return (Array.isArray(rows) ? rows : []).map((row: { path: string }) => row.path);
  }
}
