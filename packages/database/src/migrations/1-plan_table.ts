import { Schema, Column } from '../lib/utils/facades';
import SchemaBuilder from '../lib/builder/schemaBuilder';
import { createUpdatedAtTrigger } from '../lib/migration/utils';
const up = async () => {
  await Schema.table('plans').create([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.text('logo', {
      nullable: true,
    }),
    Column.integer('price'),
    Column.integer('max_media_size'),
    Column.integer('max_media_count'),
    Column.integer('max_projects_count'),
    Column.integer('max_clients_count'),
    Column.integer('max_services_count'),
    Column.timestamps(),
    Column.softDelete(),
  ]);

  await createUpdatedAtTrigger('plans');
};

const down = async () => {
  // Drop the trigger first
  await Schema.table('plans').raw(
    `DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;`,
  );

  // Drop the table
  await SchemaBuilder.table('plans').drop();
};

export { up, down };
