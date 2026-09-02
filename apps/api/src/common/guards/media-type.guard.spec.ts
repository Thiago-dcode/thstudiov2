import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { MediaTypeGuard } from './media-type.guard';

const contextWithFile = (file?: { mimetype: string }) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ file }),
    }),
  }) as never;

describe('MediaTypeGuard', () => {
  const guard = new MediaTypeGuard();
  const next = { handle: () => of(undefined) };

  describe('canActivate', () => {
    it('allows the request when Multer has not parsed a file yet', () => {
      expect(guard.canActivate(contextWithFile(undefined))).toBe(true);
    });

    it('allows a file whose mime type maps to a media type', () => {
      expect(
        guard.canActivate(contextWithFile({ mimetype: 'image/jpeg' })),
      ).toBe(true);
      expect(
        guard.canActivate(contextWithFile({ mimetype: 'image/gif' })),
      ).toBe(true);
      expect(
        guard.canActivate(contextWithFile({ mimetype: 'video/mp4' })),
      ).toBe(true);
    });

    it('rejects a file whose mime type cannot be resolved', () => {
      expect(() =>
        guard.canActivate(contextWithFile({ mimetype: 'application/pdf' })),
      ).toThrow(BadRequestException);
    });
  });

  describe('intercept', () => {
    it('rejects a missing file', () => {
      expect(() => guard.intercept(contextWithFile(undefined), next)).toThrow(
        BadRequestException,
      );
    });

    it('rejects a file whose mime type cannot be resolved', () => {
      expect(() =>
        guard.intercept(contextWithFile({ mimetype: 'application/pdf' }), next),
      ).toThrow(BadRequestException);
    });

    it('continues when the mime type maps to a media type', () => {
      const result = guard.intercept(
        contextWithFile({ mimetype: 'image/png' }),
        next,
      );
      expect(result).toBeDefined();
    });
  });
});
