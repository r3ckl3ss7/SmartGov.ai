import express from "express";
const router = express.Router();
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.js";



router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", protect, logoutUser);

export default router;
