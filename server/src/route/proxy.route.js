import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import * as proxyController from "../controller/proxy.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", proxyController.getProxies);
router.post("/", proxyController.saveProxies);
router.post("/sync", proxyController.syncProxy);
router.delete("/", proxyController.deleteProxies);

export default router;
