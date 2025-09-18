import express from 'express';
import {loginSuperAdmin, signupSuperAdmin, addVehicle} from '../controllers/SuperAdminController.js';
import authSuperAdmin from "../middleware/auth-superadmin.js";
const router = express.Router();

router.post('/login', loginSuperAdmin);
router.post('/signup', signupSuperAdmin);
router.post("/add-vehicles", authSuperAdmin, addVehicle);
export default router;