import { Router } from "express";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentState,
  saveDocumentState,
  shareDocument,
  getPermissions,
  revokePermission,
  generateShareLink,
  getShareLink,
  revokeShareLink,
  joinByLink,
} from "../controllers/document.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Join by share link (must be before /:id)
router.post("/join/:token", joinByLink);

router.post("/", createDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.patch("/:id", updateDocument);
router.delete("/:id", deleteDocument);

router.get("/:id/state", getDocumentState);
router.put("/:id/state", saveDocumentState);

router.post("/:id/share", shareDocument);
router.get("/:id/permissions", getPermissions);
router.delete("/:id/share/:userId", revokePermission);

// Share link
router.post("/:id/share-link", generateShareLink);
router.get("/:id/share-link", getShareLink);
router.delete("/:id/share-link", revokeShareLink);

export default router;
