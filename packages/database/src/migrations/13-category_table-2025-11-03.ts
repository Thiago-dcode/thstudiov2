import { Alter, Column, Schema } from "src/lib/facades";

const up = async () => {

  //Your migration code here

  await Schema.table('categories').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.text('tags'),
    Column.string('thumbnail', 255, {
      nullable: true,
    }),
    Column.boolean('is_featured', {
      default: false
    }),
    Column.string('name', 255, {
      unique: true
    }),
    Column.string('slug', 255, {
      unique: true
    }),
  ]);
  await Alter.table('categories').foreignKeyAdd('parent_id', 'categories', 'id', {
    nullable: true,
  });

  await Schema.table('user_categories').create([
    Column.id(),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.foreignKey('category_id', 'categories', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.uniques('UC_user_Category', ['user_id', 'category_id'])
  ]);
  await Schema.table('portfolio_categories').create([
    Column.id(),
    Column.foreignKey('portfolio_id', 'portfolios', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.foreignKey('category_id', 'categories', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.uniques('UC_portfolio_Category', ['portfolio_id', 'category_id'])
  ]);
  await Schema.table('category_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('category_id', 'categories', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.uniques('UC_Category_translation', ['language_code', 'category_id'])
  ]);

};

const down = async () => {

  //Your migration rollback code here
  await Schema.table('category_translations').dropIfExists();
  await Alter.table('categories').dropConstraint('categories_parent_id_fkey');
  await Schema.table('portfolio_categories').dropIfExists();
  await Schema.table('user_categories').dropIfExists();
  await Schema.table('categories').dropIfExists();
};

export { up, down };
