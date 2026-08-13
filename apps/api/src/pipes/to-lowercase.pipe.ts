import {
  PipeTransform,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

@Injectable()
export class ToLowerCasePipe implements PipeTransform {
  constructor() {}
  async transform(value: any) {
 
    if(typeof value !=='string'){
      throw new UnprocessableEntityException('Expected a string got a: ' + typeof value)
    }
    return value.toLocaleLowerCase().trim();
  }
}
