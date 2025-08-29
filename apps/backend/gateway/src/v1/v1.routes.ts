import { Routes } from '@nestjs/core';
import { ImagesModule } from './modules/media/Images/images.module';
import { ProjectsModule } from './modules/projects/projects.module';
const modules = [ImagesModule, ProjectsModule];
export const routes: Routes = modules.map((module) => ({
  path: '/v1',
  module,
}));
