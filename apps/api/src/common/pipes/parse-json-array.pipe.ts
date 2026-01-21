import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseJsonArrayPipe<T> implements PipeTransform {
  constructor(private readonly classType: new () => T) {}

  async transform(value: any, ): Promise<T[]> {
    if (!value) {
      throw new BadRequestException('items field is required');
    }

    let parsed: any[];
    try {
      parsed = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e){
      console.log('ERROR',e)
      throw new BadRequestException('Invalid JSON format for items');
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException('items must be an array');
    }
    

    const instances = plainToInstance(this.classType, parsed, {
      enableImplicitConversion: true,
    }) as T[];

    const errors: string[] = [];
    for (let i = 0; i < instances.length; i++) {
      const validationErrors = await validate(instances[i] as object, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (validationErrors.length > 0) {
        const messages = validationErrors
          .map((err) => Object.values(err.constraints || {}).join(', '))
          .join('; ');
        errors.push(`Item ${i}: ${messages}`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return instances;
  }
}

