import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuidV4 } from 'uuid';

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
await mongoClient.connect();
db = mongoClient.db()
console.log("Conectado")
} catch (err) {
console.log("Erro no mongo.connect", err.message);
}


// valida usuario
// const userSchema = joi.object({
//     name: joi.string().required()
// })
// db = mongoClient.db("DIRETORIOOOO");
// const talCollection = db.collection("COLLECTIONNNNN");



// ROTAS:

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
} );