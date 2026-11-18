import { Alter } from '../lib/facades';


const up = async () => {
  await Alter.table('users').addColumnIfNotExists('username_auto_generated', 'BOOLEAN', {
    default: false
  });

};

const down = async () => {
  await Alter.table('users').dropColumnIfExists('username_auto_generated');
};

export { up, down };
