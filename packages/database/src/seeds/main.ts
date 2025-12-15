import { main as plans } from './plans';
import { main as categorySeeder } from './categories';
import { main as paymentMethods } from './paymentMethods';
export const main = async () => {
  await plans();
  await categorySeeder();
  await paymentMethods();
};
