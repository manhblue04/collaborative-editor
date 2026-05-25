import { Router } from "express";
import {
  listVersions,
  saveVersion,
  getVersionState,
  restoreVersion,
} from "../controllers/version.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true }); // mergeParams để lấy :id từ parent

router.use(authenticate);

router.get("/", listVersions);
router.post("/", saveVersion);
router.get("/:versionId/state", getVersionState);
router.post("/:versionId/restore", restoreVersion);

export default router;
