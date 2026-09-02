import {
  BadRequestException,
  CallHandler,
  CanActivate,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { MediaHelper } from '@repo/common-lib/utils/media';
import { Observable } from 'rxjs';

/**
 * Ensures the uploaded file's MIME type maps to a `MEDIA_TYPE`.
 *
 * Nest runs guards before `FileInterceptor`, so `canActivate` only checks when
 * `req.file` is already present. The interceptor runs after Multer and is the
 * check that actually fires on create / createAsync.
 */
@Injectable()
export class MediaTypeGuard implements CanActivate, NestInterceptor {
  canActivate(context: ExecutionContext): boolean {
    const file = this.getFile(context);
    if (!file) return true;
    this.assertResolvable(file);
    return true;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const file = this.getFile(context);
    if (!file) {
      throw new BadRequestException('File is required');
    }
    this.assertResolvable(file);
    return next.handle();
  }

  private getFile(context: ExecutionContext): Express.Multer.File | undefined {
    return context.switchToHttp().getRequest<{ file?: Express.Multer.File }>()
      .file;
  }

  private assertResolvable(file: Express.Multer.File): void {
    if (!MediaHelper.getMediaTypeFromMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Unable to resolve media type from "${file.mimetype}"`,
      );
    }
  }
}
