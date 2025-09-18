import express from 'express';
import {loginSuperAdmin, signupSuperAdmin, addVehicle, listVehicles, placeDetails, getDirectionsAndETA, streamTracking} from '../controllers/SuperAdminController.js';
import authSuperAdmin from "../middleware/auth-superadmin.js";
const router = express.Router();

router.post('/login', loginSuperAdmin);
router.post('/signup', signupSuperAdmin);
router.post("/add-vehicles", authSuperAdmin, addVehicle);
router.get("/vehicles",authSuperAdmin ,listVehicles);
router.get("/places/:placeId",authSuperAdmin ,placeDetails);
router.post("/directions", authSuperAdmin, getDirectionsAndETA);
router.get("/track/stream/:reg",authSuperAdmin ,streamTracking);

export default router;