import { main as plans } from './plans';
import { main as categorySeeder } from './categories';
export const main = async () => {
  await plans();
  await categorySeeder();
};
