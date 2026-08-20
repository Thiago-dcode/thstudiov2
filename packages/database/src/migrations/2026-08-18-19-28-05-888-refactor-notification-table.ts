import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { Column, Schema } from "../lib/facades";

const table = TABLES_ENUM.USER_NOTIFICATIONS;

const up = async () => {
  await Schema.table(table).dropIfExists();

  await Schema.dropEnumIfExists('NOTIFICATION_TYPE');
  await Schema.createEnum('NOTIFICATION_TYPE');

  await Schema.table(table).withTimestamps().createIfNotExists([
    Column.id(),
    Column.enum('type', 'NOTIFICATION_TYPE', {
      nullable: false,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.integer('entity_id', {
      nullable: false,
    }),
    Column.timestamp('read_at', {
      nullable: true,
    }),
    Column.uniques('UC_notifications_type_entity_id', ['type', 'entity_id']),
  ]);
};

const down = async () => {

  await Schema.table(table).dropIfExists();
  await Schema.dropEnum('NOTIFICATION_TYPE');

};

export { up, down };
