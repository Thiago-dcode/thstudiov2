import { connectDb } from '../lib/scripts/utils';
import { main as plans } from './plans';
import { main as devSeeder } from './dev.seeder';
import { main as categorySeeder } from './categories';
export const main = async () => {
  await connectDb();
  await plans();
  await devSeeder();
  await categorySeeder();
};
