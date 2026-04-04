import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  searchUsers,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Search users by email (for sharing)
router.get("/search", searchUsers);

// Get all users
router.get("/", getAllUsers);

// Get single user
router.get("/:id", getUserById);

export default router;
