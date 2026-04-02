import { Module } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CategoriesModule } from '../categories/categories.module';
import { AdminCategoriesController } from './admin-categories.controller';

/** Mounted at `api/v1/admin` — use `@Controller('segment')` → `api/v1/admin/segment`. */
@Module({
  imports: [CategoriesModule],
  controllers: [AdminCategoriesController],
  providers: [AdminGuard],
})
export class AdminModule {}
