import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { GRADES, LOW_STOCK_KG, DEFAULT_RATE } from '../config/constants.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in a few minutes.' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && user.active && (await user.verifyPassword(password));
    if (!ok) throw new HttpError(401, 'Incorrect email or password.');

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || '12h',
    });
    res.json({ token, user });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

// Grades, low-stock levels and default rates for the forms.
router.get('/meta', requireAuth, (req, res) =>
  res.json({ grades: GRADES, lowStockKg: LOW_STOCK_KG, defaultRate: DEFAULT_RATE })
);

export default router;
