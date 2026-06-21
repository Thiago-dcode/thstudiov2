import { Column, Schema } from '../lib/facades';

const up = async () => {

 await Schema.table('about_page').withTimestamps().createIfNotExists([
  Column.id(),
  Column.string('title',255,{
     nullable:true
  }),
  Column.string('photo',255,{
   nullable:true,
  }),
  Column.text('description'),
  Column.foreignKey('user_id','users'),
 ]);


};

const down = async () => {

await Schema.table('about_page').dropIfExists();

};

export { up, down };
