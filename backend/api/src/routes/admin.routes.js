import express from "express";
import { uploads } from "../config/multer.js";
const router = express.Router();
import { adminOnly, protect } from "../middlewares/auth.js";
import { upload } from "../controllers/admin.controller.js";



router.post("/", protect, adminOnly, uploads.single("dataset"), upload);

export default router;
