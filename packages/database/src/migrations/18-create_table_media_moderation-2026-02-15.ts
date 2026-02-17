import { Column, Schema } from "src/lib/facades";

const up = async () => {

  await Schema.table('media_moderations').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.boolean('is_allowed', {
      nullable: false,
    }),
    Column.smallInteger('severity', {
      nullable: false,
      default: 0,
    }),
    Column.string('content_type', 50, {
      nullable: false,
    }),
    Column.string('reason', 255, {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
  ]);

};

const down = async () => {

  await Schema.table('media_moderations').dropIfExists();

};

export { up, down };
