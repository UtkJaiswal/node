import { Router } from 'express';
import { isPhoneRegistered, loginUser, registerUser, sendOTP, sendVerificationEmail, verifyEmail, verifyOTP } from '../controllers/userController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/isPhoneRegistered',isPhoneRegistered)
router.post('/sendOTP', sendOTP);
router.post('/verifyOTP', verifyOTP);
router.post('/sendVerificationEmail', authMiddleware ,sendVerificationEmail);
router.get('/verify/:token', verifyEmail);

export default router;
