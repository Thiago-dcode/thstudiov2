import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnumType } from '@repo/common-lib/constants/enums';
import {
  CACHE_KEY_LAYOUT_BY_NAME,
  CACHE_KEY_LAYOUTS_ALL,
  MAX_COLUMN_BASE_COLUMNS,
  MIN_COLUMN_BASE_COLUMNS,
} from '@repo/common-lib/constants/constants';
import {
  ColumBaseLayoutConfig,
  Layout,
  LayoutConfig,
  LayoutIndexRequest,
} from '@repo/common-lib/types/layout';
import { LayoutConfigSchemaWithoutTimestamps } from '@repo/common-lib/schemas/layout';
import { Helpers } from 'src/common/services/helpers.service';
import { LayoutRepository } from './layout.repository';
import { IndexLayoutsRequest } from './requests/index-layouts.request';

const LAYOUTS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type LayoutName = EnumType<'LAYOUT_TYPE'>;

const LAYOUT_CONFIG_NORMALIZERS: Record<
  LayoutName,
  (config: Record<string, unknown> | null | undefined) => LayoutConfig
> = {
  MASONRY: () => null,
  UNIFORM: () => null,
  COLUMN_BASE: (config): ColumBaseLayoutConfig => {
    const raw = config?.columns;
    const columns =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw)
          : NaN;

    if (!Number.isFinite(columns)) {
      throw new BadRequestException(
        `Invalid config for layout "COLUMN_BASE": columns must be a number`,
      );
    }

    return {
      columns: Math.min(
        MAX_COLUMN_BASE_COLUMNS,
        Math.max(MIN_COLUMN_BASE_COLUMNS, Math.trunc(columns)),
      ),
    };
  },
};

@Injectable()
export class LayoutService {
  constructor(
    private readonly layoutRepository: LayoutRepository,
    private readonly helpers: Helpers,
  ) {}

  async findAll(indexLayoutsRequest: IndexLayoutsRequest): Promise<Layout[]> {
    const filters: LayoutIndexRequest = {
      ...indexLayoutsRequest,
      // Default to active layouts (same as previous findAllActive behavior).
      is_active: indexLayoutsRequest.is_active ?? true,
    };

    const useCache =
      filters.is_active === true && filters.paginated !== true;

    if (useCache) {
      return await this.helpers.cacheRemember(
        CACHE_KEY_LAYOUTS_ALL,
        this.layoutRepository.findAll(filters),
        { append_language: false, ttl: LAYOUTS_CACHE_TTL_MS },
      );
    }

    return await this.layoutRepository.findAll(filters);
  }

  async findByName(name: LayoutName): Promise<Layout> {
    return await this.helpers.cacheRemember(
      CACHE_KEY_LAYOUT_BY_NAME(name),
      (async () => {
        const layout = await this.layoutRepository.findByName(name);
        if (!layout) {
          throw new NotFoundException(`Layout not found with name ${name}`);
        }
        return layout;
      })(),
      { append_language: false, ttl: LAYOUTS_CACHE_TTL_MS },
    );
  }

  async findById(id: number): Promise<Layout> {
    const layout = await this.layoutRepository.findById(id);
    if (!layout) {
      throw new NotFoundException(`Layout not found with id ${id}`);
    }
    return layout;
  }

  async resolveLayoutConfig(
    layoutId: number | undefined,
    config: Record<string, unknown> | null | undefined = undefined,
  ): Promise<{ layout: Layout; config: LayoutConfig }> {
    const layout = layoutId
      ? await this.findById(layoutId)
      : await this.findByName('MASONRY');

    return {
      layout,
      config: LAYOUT_CONFIG_NORMALIZERS[layout.name](config),
    };
  }

  async persistConfig(
    layout: Layout,
    portfolioId: number,
    config: LayoutConfig,
  ): Promise<LayoutConfigSchemaWithoutTimestamps> {
    return await this.layoutRepository.upsertConfigForPortfolio(
      portfolioId,
      layout.id,
      config,
    );
  }
}
