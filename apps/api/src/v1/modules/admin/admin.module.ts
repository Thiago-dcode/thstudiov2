import { Module } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AssetsModule } from '../assets/assets.module';
import { CategoriesModule } from '../categories/categories.module';
import { InvitationLinkModule } from '../invitation-links/invitation-link.module';
import { WaitListModule } from '../wait-list/wait-list.module';
import { AdminAssetsController } from '../assets/admin-assets.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminInvitationLinksController } from './admin-invitation-links.controller';
import { AdminWaitListController } from './admin-wait-list.controller';

/** Mounted at `api/v1/admin` — use `@Controller('segment')` → `api/v1/admin/segment`. */
@Module({
  imports: [AssetsModule, CategoriesModule, InvitationLinkModule, WaitListModule],
  controllers: [AdminAssetsController, AdminCategoriesController, AdminInvitationLinksController, AdminWaitListController],
  providers: [AdminGuard],
})
export class AdminModule { }
