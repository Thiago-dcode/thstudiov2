import {
  PipeTransform,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

@Injectable()
export class IsNumberPipe implements PipeTransform {
  constructor(private readonly positive: boolean = false) {}
  async transform(value: any) {
    const _value = parseInt(value);
    if (isNaN(_value)) {
      throw new UnprocessableEntityException('Value must be a number');
    }
    if (this.positive && _value < 0) {
      throw new UnprocessableEntityException('Value must be a positive number');
    }
    return value;
  }
}
