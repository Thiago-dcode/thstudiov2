import { Alter } from "../facades";
import { connectDb } from "./utils";

const testDb = async () => {
  
  try {
    await connectDb();
    console.log('Db connected')
    const result = await Alter.table('users').columnExist('id');
    console.log("result", result)
    
  } catch (error) {
    console.log("error", error);
  }
  process.exit(0);
};

export { testDb };
