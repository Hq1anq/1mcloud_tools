import express from "express";

import * as authController from "../controller/auth.controller.js";
import { signup } from "../controller/auth.signup.ts";

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", signup);

export default router;
