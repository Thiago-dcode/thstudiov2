import { Column, Schema } from "src/lib/facades";

const up = async () => {

  //Address
  await Schema.table('addresses').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('formated_address', 255, {
      nullable: true,
    }),
    Column.string('street', 255, {
      nullable: true,
    }),
    Column.string('city', 255, {
      nullable: true,
    }),
    Column.string('state', 255, {
      nullable: true,
    }),
    Column.string('zip', 10, {
      nullable: true,
    }),
    Column.string('country', 255, {
      nullable: true,
    }),
    Column.string('country_code', 5, {
      nullable: true,
    }),
    Column.double('latitude', {
      nullable: true,
    }),
    Column.double('longitude', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'SET NULL',
      unique:true,
      nullable: true,
    }),
    Column.foreignKey('client_id', 'clients', 'id', {
      onDelete: 'SET NULL',
      unique:true,
      nullable: true,
    }),
  ]);

};

const down = async () => {


  
  // Then drop the addresses table
  await Schema.table('addresses').dropIfExists();

};

export { up, down };
