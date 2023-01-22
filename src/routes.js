import express from "express";
import cors from "cors";

import {
    get as getTransactions,
    save as saveTransaction,
} from "./controllers/transaction_controller.js";

import { signIn, signUp } from "./controllers/auth_controller.js";
import { checkAuth } from "./middlewares/auth_middleware.js";

const router = express.Router();

router.use(cors());
router.use(express.json());

router.post("/sign-up", signUp);
router.post("/sign-in", signIn);

router.use(checkAuth);

router.post("/transaction", saveTransaction);
router.get("/transactions", getTransactions);

export default router;