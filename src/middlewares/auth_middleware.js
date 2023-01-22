import dayjs from "dayjs";
import db from "../database.js";

export async function checkAuth(req,res,next) {
    const token = req.headers.authorization?.split(" ")[1];

    if(!token) return res.sendStatus(401);

    const session = await db.collection("session").findOne({token});
    if (!session) return res.sendStatus(401);

    const sessionExpired = dayjs().isAfter(session.expire_at);

    if(sessionExpired) return res.sendStatus(401);
    res.locals.userId = session.user;
    next();
}