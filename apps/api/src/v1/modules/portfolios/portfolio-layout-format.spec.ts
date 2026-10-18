import { EnumType } from '@repo/common-lib/constants/enums';
import { formatPortfolioLayout } from './portfolio.repository';

describe('formatPortfolioLayout', () => {
  it('maps COLUMN_BASE joined columns into PortfolioLayout', () => {
    const layout = formatPortfolioLayout({
      layout_id: 3,
      layout_name: 'COLUMN_BASE' as EnumType<'LAYOUT_TYPE'>,
      config: { layout: { columns: 3 }, items: { show_title: true } },
    });

    expect(layout).toEqual({
      name: 'COLUMN_BASE',
      config: { layout: { columns: 3 }, items: { show_title: true } },
      layout_id: 3,
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
      layout_id: 1,
    });
  });

  it('parses a JSON-string COLUMN_BASE config and falls back to defaults', () => {
    const layout = formatPortfolioLayout({
      layout_id: 3,
      layout_name: 'COLUMN_BASE' as EnumType<'LAYOUT_TYPE'>,
      config: '{"layout":{}}' as unknown as Record<string, unknown>,
    });

    expect(layout).toEqual({
      name: 'COLUMN_BASE',
      config: { layout: { columns: 1 }, items: { show_title: false } },
      layout_id: 3,
    });
  });

  it('keeps show_title for UNIFORM', () => {
    const layout = formatPortfolioLayout({
      layout_id: 2,
      layout_name: 'UNIFORM' as EnumType<'LAYOUT_TYPE'>,
      config: { layout: {}, items: { show_title: true } },
    });

    expect(layout).toEqual({
      name: 'UNIFORM',
      config: { layout: {}, items: { show_title: true } },
      layout_id: 2,
    });
  });

  it('defaults UNIFORM items when no config is stored', () => {
    const layout = formatPortfolioLayout({
      layout_id: 2,
      layout_name: 'UNIFORM' as EnumType<'LAYOUT_TYPE'>,
      config: null,
    });

    expect(layout).toEqual({
      name: 'UNIFORM',
      config: { layout: {}, items: { show_title: false } },
      layout_id: 2,
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
