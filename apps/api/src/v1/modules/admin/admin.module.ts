import { Module } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CategoriesModule } from '../categories/categories.module';
import { InvitationLinkModule } from '../invitation-links/invitation-link.module';
import { WaitListModule } from '../wait-list/wait-list.module';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminInvitationLinksController } from './admin-invitation-links.controller';
import { AdminWaitListController } from './admin-wait-list.controller';

/** Mounted at `api/v1/admin` — use `@Controller('segment')` → `api/v1/admin/segment`. */
@Module({
  imports: [CategoriesModule, InvitationLinkModule, WaitListModule],
  controllers: [AdminCategoriesController, AdminInvitationLinksController, AdminWaitListController],
  providers: [AdminGuard],
})
export class AdminModule { }
