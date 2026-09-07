import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import * as userController from "../controller/user.controller.js";
import {
  requestVerifyEmail,
  sendVerifyToken,
} from "../controller/user.verify.ts";

const router = express.Router();

// Public route: verifying email token from email link
router.post("/verify", sendVerifyToken);

// Authenticated routes below
router.use(authenticate);

// Request verification email
router.get("/verify", requestVerifyEmail);

router.get("/profile", userController.getProfile);
router.get("/licenses", userController.getLicenses);

router.post("/licenses", userController.addLicenses);
router.put("/licenses/:id", userController.editLicenses);
router.delete("/licenses/:id", userController.deleteLicenses);

export default router;
