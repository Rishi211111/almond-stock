import { Router } from 'express';
import Sale from '../models/Sale.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { gradeStock } from '../utils/stock.js';
import { listFilter, reqDate, reqGrade, reqNum, reqStr, optStr } from '../utils/validate.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 500);
    const rows = await Sale.find(listFilter(req.query)).sort({ date: -1, _id: -1 }).limit(limit);
    res.json(rows);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body;
    const date = reqDate(b.date);
    const grade = reqGrade(b.grade);
    const customer = reqStr(b.customer, 'Customer', { max: 120 });
    const quantityKg = reqNum(b.quantityKg, 'Quantity', { min: 0.1 });
    const ratePerKg = reqNum(b.ratePerKg, 'Rate', { min: 0 });
    const notes = optStr(b.notes, 'Notes');

    // Never sell more than we have.
    // Note: two sales saved at the exact same moment could both pass this check.
    // For a single-site business this is fine; use a MongoDB transaction if it ever matters.
    const available = await gradeStock(grade);
    if (quantityKg > available + 0.0001) {
      throw new HttpError(409, `Only ${available} kg of ${grade} is in stock. Reduce the quantity or add production first.`);
    }

    const doc = await Sale.create({ date, grade, customer, quantityKg, ratePerKg, notes, createdBy: req.user._id });
    res.status(201).json(doc);
  })
);

router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const doc = await Sale.findById(req.params.id);
    if (!doc) throw new HttpError(404, 'Entry not found.');
    await doc.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
