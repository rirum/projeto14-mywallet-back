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
    const user = await db.collection("user").findOne({email});
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


app.get("/transactions", async(req,res) => {
    const userId = req.headers.user;

    const user = await db.collection("user").findOne({_id: ObjectId(userId)});
    if(!user) return res.status(401).send("Usuário não cadastrado");

    const transactions = await db.collection("transaction").find({user: userId}).toArray();
    let totalBalance = 0;

    transactions.forEach((element) => {
        let valor = Number(element.value);
        if (element.type ==="entry") {
            totalBalance = totalBalance + valor;
        } else {
            totalBalance = totalBalance - valor;
        }
    });

    const result = {
        totalBalance: totalBalance,
        transactions: transactions.reverse(),
    };

    return res.status(200).send(result);
})

app.post("/transaction", async(req,res) => {
    const transaction = req.body;

    let date = new Date(Date.now());

    let month = (date.getMonth() +1).toString().padStart(2, "0");
    let day = (date.getMonth() +1).toString().padStart(2, "0");

    date = day + "/" + month;

    transaction.date = date;

    const user = await db.collection("user").findOne({ _id:ObjectId(transaction.user)});

    if (!user) return res.status(401).send("Usuário não cadastrado");

    await db.collection("transaction").insertOne(transaction);

    return res.sendStatus(201);
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
} );