import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();
let db;

try {
    const databaseClient = new MongoClient(process.env.DATABASE_URL);
    db = databaseClient.db();
} catch (error){
    console.log(error);
}

export default db;