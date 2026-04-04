import { Router } from "express";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeShare,
  getDocumentPermissions,
} from "../controllers/document.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Document CRUD
router.post("/", createDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.patch("/:id", updateDocument);
router.delete("/:id", deleteDocument);

// Permission / Sharing
router.post("/:id/share", shareDocument);
router.delete("/:id/share/:userId", removeShare);
router.get("/:id/permissions", getDocumentPermissions);

export default router;
