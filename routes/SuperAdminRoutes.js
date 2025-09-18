import express from 'express';
import {loginSuperAdmin, signupSuperAdmin, addVehicle, uploadMineMap, addHazardPin, getSafetyHazardPin, listVehicles, placeDetails, getDirectionsAndETA, streamTracking, addProgressPin} from '../controllers/SuperAdminController.js';
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
router.post(
  "/pins/hazard",
  authSuperAdmin, // ✅ injects req.user.id
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "voiceNote", maxCount: 1 },
  ]),
  addHazardPin
);
router.post(
    "/pins/progress",
    authSuperAdmin, // ✅ injects req.user.id
    upload.fields([
      { name: "images", maxCount: 5 },
      { name: "voiceNote", maxCount: 1 },
    ]),
    addProgressPin
  );
router.get("/hazard/:pinId", authSuperAdmin,getSafetyHazardPin);

router.get("/vehicles",authSuperAdmin ,listVehicles);
router.get("/places/:placeId",authSuperAdmin ,placeDetails);
router.post("/directions", authSuperAdmin, getDirectionsAndETA);
router.get("/track/stream/:reg",authSuperAdmin ,streamTracking);

export default router;