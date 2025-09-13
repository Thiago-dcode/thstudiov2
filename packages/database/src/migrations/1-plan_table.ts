import { Schema, Column } from '../lib/facades';
import SchemaBuilder from '../lib/builder/schemaBuilder';
import { createUpdatedAtTrigger } from '../lib/migration/utils';
const up = async () => {
  await Schema.table('plans').createIfNotExists([
    Column.id(),
    Column.string('name', 255, {
      unique: true,
    }),
    Column.text('description'),
    Column.text('logo', {
      nullable: true,
    }),
    Column.float('price'),
    Column.integer('max_media_size'),
    Column.integer('max_projects_count'),
    Column.integer('max_clients_count'),
    Column.integer('max_services_count'),
    Column.timestamps(true),
  ]);

  await createUpdatedAtTrigger('plans');

  await Schema.table('plan_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.string('description'),
    Column.foreignKey('plan_id', 'plans', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.foreignKey('language_code', 'languages', 'code', {
      onDelete: 'CASCADE',
      type: 'LANGUAGE_CODE',
    }),
  ]);
};

const down = async () => {
  // Drop the table
  await Schema.table('plan_translations').dropIfExists();
  await SchemaBuilder.table('plans').dropIfExists();
};

export { up, down };
