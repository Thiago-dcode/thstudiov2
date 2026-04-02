import { main as plans } from './plans';
import { main as categorySeeder } from './categories';
import { main as paymentMethods } from './paymentMethods';
import { main as roles } from './roles';
export const main = async () => {
  await roles();
  await plans();
  await categorySeeder();
  await paymentMethods();
};
