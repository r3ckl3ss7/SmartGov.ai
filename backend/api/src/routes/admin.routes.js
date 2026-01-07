import express from "express";
import { uploads } from "../config/multer.js";
const router = express.Router();
import { adminOnly, protect } from "../middlewares/auth.js";
import {
  upload,
  getUploadHistory,
  getTransactionsByFile,
} from "../controllers/admin.controller.js";

// Upload CSV file
router.post("/upload", protect, adminOnly, uploads.single("dataset"), upload);

// Get upload history for current user
router.get("/uploads", protect, adminOnly, getUploadHistory);

// Get transactions by file upload ID
router.get("/uploads/:fileId/transactions", protect, adminOnly, getTransactionsByFile);

export default router;
