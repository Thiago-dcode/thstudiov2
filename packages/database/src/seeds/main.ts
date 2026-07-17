import { getConfigValue } from '@repo/common-lib/config/utils';
import { main as plans } from './plans';
import { main as categorySeeder } from './categories';
import { main as paymentMethods } from './paymentMethods';
import { main as benefits } from './benefits';
import { main as invitationLinks } from './invitationLinks';
import { main as roles } from './roles';
import { main as layouts } from './layouts';
import { ADMIN_USERNAME, main as adminUser } from './admin-user';
import { main as supportUser } from './support-user';
import { main as portfolioSeed } from './portfolio';
import { main as collectionSeed } from './collection';
import { main as mediaSeed } from './media';
import { main as assetsSeed } from './assets';
import { main as serviceSeed } from './service';

export const main = async () => {
  await roles();
  await plans();
  await categorySeeder();
  await paymentMethods();
  await benefits();
  await invitationLinks();
  await layouts();
  await supportUser();
  await adminUser();
  await assetsSeed();
  if (!getConfigValue('app').isProduction) {
    await mediaSeed(ADMIN_USERNAME);
    await portfolioSeed(ADMIN_USERNAME, 5);
    await collectionSeed(ADMIN_USERNAME, 5);
    await serviceSeed(ADMIN_USERNAME, 5);
  }
};
