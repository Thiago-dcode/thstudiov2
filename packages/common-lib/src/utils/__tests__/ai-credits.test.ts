import { AiCreditsHelper } from '../ai-credits';

describe('AiCreditsHelper.metadataUsageType', () => {
  it('returns the video usage type for VIDEO', () => {
    expect(AiCreditsHelper.metadataUsageType('VIDEO')).toBe('GENERATE_MEDIA_METADATA_VIDEO');
  });

  it('returns the image usage type for IMAGE', () => {
    expect(AiCreditsHelper.metadataUsageType('IMAGE')).toBe('GENERATE_MEDIA_METADATA');
  });

  it('returns the image usage type for GIF', () => {
    expect(AiCreditsHelper.metadataUsageType('GIF')).toBe('GENERATE_MEDIA_METADATA');
  });

  it('falls back to the image usage type for null/undefined', () => {
    expect(AiCreditsHelper.metadataUsageType(null)).toBe('GENERATE_MEDIA_METADATA');
    expect(AiCreditsHelper.metadataUsageType(undefined)).toBe('GENERATE_MEDIA_METADATA');
  });
});

describe('AiCreditsHelper.metadataCreditCost', () => {
  it('costs 3 for a video', () => {
    expect(AiCreditsHelper.metadataCreditCost('VIDEO')).toBe(3);
  });

  it('costs 1 for an image or GIF', () => {
    expect(AiCreditsHelper.metadataCreditCost('IMAGE')).toBe(1);
    expect(AiCreditsHelper.metadataCreditCost('GIF')).toBe(1);
  });
});

describe('AiCreditsHelper.creditCost', () => {
  it('returns the weight for a credit-consuming usage type', () => {
    expect(AiCreditsHelper.creditCost('GENERATE_MEDIA_METADATA')).toBe(1);
    expect(AiCreditsHelper.creditCost('GENERATE_MEDIA_METADATA_VIDEO')).toBe(3);
  });

  it('returns 0 for a non-credit-consuming usage type', () => {
    expect(AiCreditsHelper.creditCost('MODERATE_MEDIA_CONTENT')).toBe(0);
    expect(AiCreditsHelper.creditCost('GENERATE_PORTFOLIO_METADATA')).toBe(0);
  });
});

describe('AiCreditsHelper.consumedFromUsageRows', () => {
  it('sums weighted credits across mixed usage types', () => {
    const rows = [
      { usage_type: 'GENERATE_MEDIA_METADATA' as const },
      { usage_type: 'GENERATE_MEDIA_METADATA_VIDEO' as const },
      { usage_type: 'GENERATE_MEDIA_METADATA' as const },
    ];
    expect(AiCreditsHelper.consumedFromUsageRows(rows)).toBe(5);
  });

  it('returns 0 for an empty list', () => {
    expect(AiCreditsHelper.consumedFromUsageRows([])).toBe(0);
  });
});
