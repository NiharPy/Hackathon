import express from 'express';
import {loginSuperAdmin, signupSuperAdmin, addVehicle, uploadMineMap} from '../controllers/SuperAdminController.js';
import authSuperAdmin from "../middleware/auth-superadmin.js";
import upload from "../middleware/multer.js";
const router = express.Router();

router.post('/login', loginSuperAdmin);
router.post('/signup', signupSuperAdmin);
router.post("/add-vehicles", authSuperAdmin, addVehicle);
router.post(
    "/upload-map",
    authSuperAdmin,
    upload.single("mineMap"), // name must match form-data key in Postman
    uploadMineMap
  );
export default router;