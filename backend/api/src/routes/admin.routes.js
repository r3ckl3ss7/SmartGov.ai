import express from "express";
import { uploads } from "../config/multer.js";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  upload,
  getUploadHistory,
  getTransactionsByFile,
  generateAnalysis,
} from "../controllers/admin.controller.js";

// Upload CSV file
router.post("/upload", protect, uploads.single("dataset"), upload);

// Get upload history for current user
router.get("/uploads", protect, getUploadHistory);

// Get transactions by file upload ID
router.get(
  "/uploads/:fileId/transactions",
  protect,
  getTransactionsByFile
);

router.get("/uploads/:fileId/analysis", protect, generateAnalysis);
export default router;
