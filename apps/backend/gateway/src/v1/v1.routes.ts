import { Routes } from '@nestjs/core';
import { ImagesModule } from './modules/Images/images.module';
const modules = [ImagesModule];
  export const routes: Routes = modules.map(module => ({
    path: '/v1',
    module,
  }));
