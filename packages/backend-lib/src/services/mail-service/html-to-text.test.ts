import { htmlToText } from './html-to-text';

describe('htmlToText', () => {
  it('drops head/style and keeps link URLs next to their label', () => {
    const html = `<!DOCTYPE html><html><head><title>A11STUDIO</title><style>a{color:red}</style></head>
      <body><table><tr><td><h1>Confirm your email</h1></td></tr>
      <tr><td><a href="https://a11studio.com/wait-list/abc?x=1&amp;y=2" style="x">Validate Email</a></td></tr>
      </table></body></html>`;

    expect(htmlToText(html)).toBe(
      'Confirm your email\n\nValidate Email: https://a11studio.com/wait-list/abc?x=1&y=2',
    );
  });

  it('decodes entities and collapses whitespace', () => {
    expect(htmlToText('<p>&copy; 2026   A11STUDIO &middot; All rights</p>')).toBe('© 2026 A11STUDIO · All rights');
  });

  it('does not repeat a URL used as its own label', () => {
    expect(htmlToText('<a href="https://a11studio.com">https://a11studio.com</a>')).toBe('https://a11studio.com');
  });
});
