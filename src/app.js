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
const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    confirmPassword: joi.string().valid(joi.ref('password')).required()
})
// db = mongoClient.db("DIRETORIOOOO");
// const talCollection = db.collection("COLLECTIONNNNN");



app.post("/sign-up", async (req,res) => {
    const { name, email, password, confirmPassword } = req.body //recebe parametro name a ser cadastrado
    const userValidate = userSchema.validate({name, email, password, confirmPassword}) //validaçao 422
    if (userValidate.error){
        return res.sendStatus(422)
    }

    try {
        // const userExist = await db.collection("user").findOne({name})
        if (await db.collection('user').findOne({email})){
            res.status(409).send("Este usuário já existe") 
        }  //impedir cadastro de usuario ja existente

       await db.collection('user').insertOne({name, email, password:bcrypt.hashSync(password,10)})
        res.status(201).send("ok") //retornar status 201 pode retirar esse send ok 
    } catch (err) {
        console.log(err)
        res.status(500).send("Deu algo errado no cadastro")
    }
})


app.post("/sign-in", async (req,res) => {
    const { email, password } = req.body;
    const user = await db.collection('user').findOne({email})
    if (!user) return res.status(401).send("E-mail não cadastrado!")

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) return res.status(401).send("Senha incorreta!")

    const token = uuidV4();
    const sessionInfo = {
        userId: user._id,
        token
    };

    await db.collection('session').insertOne(sessionInfo);
    return res.send({token, name: user.name});
    //necessario tratar erro no input
});

// ROTAS:

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
} );