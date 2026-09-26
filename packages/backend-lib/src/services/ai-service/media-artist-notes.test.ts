import { mediaArtistNotesBlock } from './media-artist-notes';

const MADRID = {
  formatted: 'Museo del Prado, Madrid, Spain',
  name: 'Museo del Prado',
  city: 'Madrid',
  state: 'Community of Madrid',
  country: 'Spain',
};

describe('mediaArtistNotesBlock', () => {
  it('renders nothing when there are no notes', () => {
    expect(mediaArtistNotesBlock()).toBe('');
    expect(mediaArtistNotesBlock({ title: '  ', description: '', location: null })).toBe('');
  });

  it('renders a location-only block with the place rules', () => {
    const block = mediaArtistNotesBlock({ location: MADRID });
    expect(block).toContain('ARTIST NOTES');
    expect(block).toContain(
      JSON.stringify({
        title: null,
        description: null,
        location: {
          place: MADRID.formatted,
          city: 'Madrid',
          region: 'Community of Madrid',
          country: 'Spain',
        },
      }),
    );
    expect(block).toContain('"location" is where the artist says the work was made');
  });

  it('omits the place rules when no location is given', () => {
    const block = mediaArtistNotesBlock({ title: 'Morning light' });
    expect(block).toContain('"location":null');
    expect(block).not.toContain('"location" is where the artist');
  });

  it('clips oversized artist text', () => {
    const block = mediaArtistNotesBlock({ description: 'x'.repeat(5000) });
    expect(block).toContain(`"description":"${'x'.repeat(1000)}"`);
    expect(block).not.toContain('x'.repeat(1001));
  });
});
