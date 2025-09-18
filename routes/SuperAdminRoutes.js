import express from 'express';
import {loginSuperAdmin, signupSuperAdmin, addVehicle, uploadMineMap, addHazardPin, getSafetyHazardPin, listVehicles, placeDetails, getDirectionsAndETA, streamTracking, addProgressPin, getProgressPin, getMineMapWithPins, addSafetyNode, refreshSuperAdminToken} from '../controllers/SuperAdminController.js';
import authSuperAdmin from "../middleware/auth-superadmin.js";
import { startShift,endShift,getShifts,summarizePinLog } from '../controllers/SuperAdminController.js';
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
router.get("/progress/:pinId", authSuperAdmin,getProgressPin);
router.get("/vehicles",authSuperAdmin ,listVehicles);
router.get("/places/:placeId",authSuperAdmin ,placeDetails);
router.post("/directions", authSuperAdmin, getDirectionsAndETA);
router.get("/track/stream/:reg",authSuperAdmin ,streamTracking);
router.get("/mine-map", authSuperAdmin, getMineMapWithPins);
router.post("/add/SafetyNode", authSuperAdmin, addSafetyNode);
router.post("/refresh-token", authSuperAdmin, refreshSuperAdminToken);
router.post("/shift/start", authSuperAdmin,startShift);
router.post("/shift/end", authSuperAdmin, endShift);
router.get("/:superAdminId/shifts", getShifts);
router.post("/:pinId/summarize",authSuperAdmin, summarizePinLog);

export default router;