import { Type } from '@nestjs/common';
import type { Routes } from '@nestjs/core';
const modules: Type<any>[] = [];
export const routes: Routes = modules.map((module) => ({
  path: '/v1',
  module,
}));
