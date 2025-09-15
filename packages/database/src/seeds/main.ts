import { connectDb } from 'lib/scripts/utils';
import { main as plans } from './plans';

export const main = async () => {
  await connectDb();
  await plans();
};
