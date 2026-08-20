import {
  PipeTransform,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class IsUserAuthPipe implements PipeTransform {
  constructor(private readonly requestService: RequestService) { }
  async transform(value: any) {
    if (!this.requestService.user || this.requestService.user.id != value || this.requestService.user.role.name !== 'ADMIN') {
      throw new UnauthorizedException('Not authorized');
    }

    return value;
  }
}
