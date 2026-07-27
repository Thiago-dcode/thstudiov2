import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AppTokenGuard } from 'src/common/guards/app-token.guard';
import { SitemapService } from './sitemap.service';

/**
 * Lean, public endpoints that feed the Next.js sharded sitemap. They return only what a `<url>`
 * entry needs (loc keys + lastmod + resolved image URLs) and enforce the correct public-indexable
 * visibility rule that the general list endpoints cannot. Paginated with large pages.
 *
 * `@Public()` skips the JWT {@link AuthGuard}; {@link AppTokenGuard} then restricts the feed to our
 * own Next.js app, which must present the shared private token in the `x-app-token` header.
 */
@Controller('sitemap')
@UseGuards(AppTokenGuard)
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  /** Totals per entity so the web can compute how many shards each needs. */
  @Public()
  @Get('counts')
  async counts() {
    return this.sitemapService.counts();
  }

  @Public()
  @Get('artists')
  async artists(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.sitemapService.artists(Number(page), Number(perPage));
  }

  @Public()
  @Get('portfolios')
  async portfolios(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.sitemapService.portfolios(Number(page), Number(perPage));
  }

  @Public()
  @Get('collections')
  async collections(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.sitemapService.collections(Number(page), Number(perPage));
  }

  @Public()
  @Get('services')
  async services(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.sitemapService.services(Number(page), Number(perPage));
  }
}
