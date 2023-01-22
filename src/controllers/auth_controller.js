import joi from "joi";
import bcrypt from "bcrypt";
import db from "../database.js";
import dayjs from "dayjs";
import {v4 as uuidV4} from "uuid";

const userSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().required(),
  confirmPassword: joi.string().valid(joi.ref("password")).required(),
});

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
 });


 export async function signIn(req, res) {
    const { email, password } = req.body;
    const loginValidate = loginSchema.validate(
      { email, password },
      { abortEarly: false }
    );
  
    if (loginValidate.error) {
      return res.sendStatus(422);
    }
  
    try {
      const user = await db.collection("user").findOne({ email });
      if (!user) return res.status(401).send("E-mail inválido");
  
      const checkPassword = await bcrypt.compare(password, user.password);
      if (!checkPassword) return res.status(401).send("Senha incorreta");
  
      const authToken = {
        token: uuidV4(),
        expire: dayjs().add(1, "hour").format(),
      };
  
      await db.collection("session").updateOne(
        {
          user: user._id,
        },
        {
          $set: {
            user: user._id,
            token: authToken.token,
            expire_at: authToken.expire,
          },
        },
        {
          upsert: true,
        }
      );
  
      return res.send({
        token: authToken.token,
        expire: authToken.expire,
        user: {
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }
  
  export async function signUp(req, res) {
    const { name, email, password, confirmPassword } = req.body;
    const userValidate = userSchema.validate(
      { name, email, password, confirmPassword },
      { abortEarly: false }
    );
  
    if (userValidate.error) {
      return res.sendStatus(422);
    }
  
    try {
      if (await db.collection("user").findOne({ email })) {
        return res.status(409).send("Esse usuário já existe");
      }
  
      const saltPassword = bcrypt.hashSync(password, 10);
  
      const newUser = {
        name: name,
        email: email,
        password: saltPassword,
      };
  
      await db.collection("user").insertOne(newUser);
  
      return res.sendStatus(201);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }
  
  export async function logout(req, res) {}
  