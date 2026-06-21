import { Column, Schema } from '../lib/facades';

const up = async () => {

  await Schema.table('llm_tokens_usage').withTimestamps().createIfNotExists([
    Column.id(),
    Column.integer('tokens'),
    Column.string('model'),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      'onUpdate': 'CASCADE'
    }),
    Column.boolean('matches_expected_response',{
      default:false,
    }),
    Column.enum('usage_type','LLM_USAGE_TYPE')
  ])
};

const down = async () => {

await Schema.table('llm_tokens_usage').dropIfExists();

};

export { up, down };
