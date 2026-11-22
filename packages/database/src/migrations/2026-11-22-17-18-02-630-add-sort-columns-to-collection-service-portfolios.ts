import { TableName } from "@repo/common-lib/types/database";
import { Alter } from "../lib/facades";

const TABLES: TableName[] = ['portfolios', 'collections', 'services', 'clients'];
const COLUMN = 'position';

const up = async () => {



  await Promise.all(TABLES.map((table) => Alter.table(table).addColumnIfNotExists(COLUMN, 'INTEGER', {
    default: 999
  })));

};

const down = async () => {

  await Promise.all(TABLES.map((table) => Alter.table(table).dropColumnIfExists(COLUMN)));
};

export { up, down };
