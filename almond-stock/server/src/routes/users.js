import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { reqStr } from '../utils/validate.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters.');
  }
  return pw;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await User.find().sort({ createdAt: 1 }));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = reqStr(req.body.name, 'Name', { max: 80 });
    const email = reqStr(req.body.email, 'Email', { max: 120 }).toLowerCase();
    const role = req.body.role || 'staff';
    if (!ROLES.includes(role)) throw new HttpError(400, 'Role must be admin or staff.');
    const passwordHash = await User.hashPassword(checkPassword(req.body.password));
    const user = await User.create({ name, email, role, passwordHash });
    res.status(201).json(user);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found.');
    const isSelf = user.id === req.user.id;

    if (req.body.name !== undefined) user.name = reqStr(req.body.name, 'Name', { max: 80 });
    if (req.body.role !== undefined) {
      if (!ROLES.includes(req.body.role)) throw new HttpError(400, 'Role must be admin or staff.');
      if (isSelf && req.body.role !== 'admin') {
        throw new HttpError(400, 'You cannot remove your own admin access.');
      }
      user.role = req.body.role;
    }
    if (req.body.active !== undefined) {
      if (isSelf && req.body.active === false) {
        throw new HttpError(400, 'You cannot deactivate your own account.');
      }
      user.active = Boolean(req.body.active);
    }
    if (req.body.password !== undefined) {
      user.passwordHash = await User.hashPassword(checkPassword(req.body.password));
    }
    await user.save();
    res.json(user);
  })
);

export default router;
