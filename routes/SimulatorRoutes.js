import express from 'express';
import { getAllSafetyNodes, addSimulatorEventToNode } from '../controllers/SimulatorController.js';
const router = express.Router();

router.get("/", getAllSafetyNodes);
router.post("/:nodeId/events", addSimulatorEventToNode);

export default router;