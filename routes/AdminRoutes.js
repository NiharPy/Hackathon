import express from "express";
import authAdmin from "../middleware/auth-admin.js";
import {
  adminSignup,
  adminLogin,
  createWorker
} from "../controllers/AdminController.js";
const router = express.Router();

// Open signup + login (no SuperAdmin guard)
// NOTE: Your adminSignup controller should accept `superAdminId` in the body.
router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.post("/createWorker", authAdmin,createWorker );

export default router;
