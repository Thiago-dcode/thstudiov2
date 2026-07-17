import { EnumType } from '@repo/common-lib/constants/enums';
import { formatPortfolioLayout } from './portfolio.repository';

describe('formatPortfolioLayout', () => {
  it('maps COLUMN_BASE joined columns into PortfolioLayout', () => {
    const layout = formatPortfolioLayout({
      layout_id: 3,
      layout_name: 'COLUMN_BASE' as EnumType<'LAYOUT_TYPE'>,
      config: { columns: 3 },
    });

    expect(layout).toEqual({
      name: 'COLUMN_BASE',
      config: { columns: 3 },
    });
  });

  it('returns null config for MASONRY even when config payload is present', () => {
    const layout = formatPortfolioLayout({
      layout_id: 1,
      layout_name: 'MASONRY' as EnumType<'LAYOUT_TYPE'>,
      config: '{}' as unknown as Record<string, unknown>,
    });

    expect(layout).toEqual({
      name: 'MASONRY',
      config: null,
    });
  });

  it('returns null config for UNIFORM', () => {
    const layout = formatPortfolioLayout({
      layout_id: 2,
      layout_name: 'UNIFORM' as EnumType<'LAYOUT_TYPE'>,
      config: null,
    });

    expect(layout).toEqual({
      name: 'UNIFORM',
      config: null,
    });
  });

  it('returns undefined when no layout_config row is joined', () => {
    const layout = formatPortfolioLayout({
      layout_id: null,
      layout_name: null,
      config: null,
    });

    expect(layout).toBeUndefined();
  });
});
