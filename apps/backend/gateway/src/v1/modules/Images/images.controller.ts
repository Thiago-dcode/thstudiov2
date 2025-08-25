import { Controller, Get, Param } from '@nestjs/common';

@Controller('media/images')
export class ImagesController {
  @Get()
  index() {
    return 'Hello World';
  }
  @Get(':id')
  show(@Param('id') id: string) {
    return `Hello World ${id}`;
  }
}
