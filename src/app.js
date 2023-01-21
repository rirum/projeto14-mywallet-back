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

// valida signup
const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
})

// ROTAS:
//cadastro

app.post("/sign-up", async (req,res) => {
    const { name, email, password, confirmPassword } = req.body //recebe parametro name a ser cadastrado
    const userValidate = userSchema.validate({name, email, password, confirmPassword}, {abortEarly:false}) //validaçao 422
    // const user = {
    //     name: name,
    //     email: email,
    //     password: password,
    //     transaction: []
    // }

    if (userValidate.error){
       return res.sendStatus(422);
        }

    try {
        
        if (await db.collection('user').findOne({email})){
                return res.status(409).send("Esse usuário já existe")
        }

    const saltPassword = bcrypt.hashSync(password, 10);
    await db.collection('user').insertOne({
        name,
        email,
        password: saltPassword,
        transaction: []
    });
    res.send(201).status("ok")
        } catch (err) {
        console.log(err)
        res.status(500).send("Deu algo errado no cadastro")
    }
})

//login
app.post("/sign-in", async (req,res) => {
    const { email, password } = req.body;
    const loginValidate = loginSchema.validate({email,password}, {abortEarly: false});

    if (loginValidate.error){
        return res.sendStatus(422)
    }
    const user = await db.collection('user').findOne({email})
    if (!user) return res.status(401).send("E-mail não cadastrado!") //mudar para senha ou usuario incorretos

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) return res.status(401).send("Senha incorreta!") //musar para senha ou usuario incorretos    

    const token = uuidV4();
    const sessionInfo = {
        userId: user._id,
        token
    };

    await db.collection('session').insertOne(sessionInfo);
    return res.send({token, name: user.name});
  
});

//transaçoes
//get e post

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
} );