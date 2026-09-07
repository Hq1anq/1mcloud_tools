import express from "express";

import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";
import * as vpsController from "../controller/vps.controller.js";

const router = express.Router();

router.get("/plan", optionalAuthenticate, vpsController.getVpsPlan);

router.use(authenticate);

router.get("/support", vpsController.support);
router.get("/support/os", vpsController.supportOs);
router.post("/upgrade/plans", vpsController.upgradePlans);
router.post("/upgrade/calculate", vpsController.upgradeCalculate);
router.post("/upgrade", vpsController.upgrade);
router.get("/change-ip-params", vpsController.supportChangeIp);

router.get("/", vpsController.getVpsList);
router.post("/", vpsController.saveVpsList);
router.post("/sync", vpsController.syncVps);
router.delete("/", vpsController.deleteVpsList);

export default router;
