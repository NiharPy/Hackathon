import express from 'express';
import {loginSuperAdmin, signupSuperAdmin} from '../controllers/SuperAdminController.js';
const router = express.Router();

router.post('/login', loginSuperAdmin);
router.post('/signup', signupSuperAdmin);

export default router;