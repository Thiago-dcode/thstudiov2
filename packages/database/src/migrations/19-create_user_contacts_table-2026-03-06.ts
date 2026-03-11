
import { Column, Schema } from '../lib/facades';

const up = async () => {
  await Schema.table('user_contacts').withTimestamps().createIfNotExists([
    Column.id(),
    Column.string('contact_name'),
    Column.email('contact_email', {
      unique: false
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.text('message'),
    Column.string('subject', 255),
  ]);
};

const down = async () => {
  await Schema.table('user_contacts').dropIfExists();
};

export { up, down };
