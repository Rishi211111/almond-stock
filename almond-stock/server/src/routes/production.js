import { Router } from 'express';
import Production from '../models/Production.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { gradeStock } from '../utils/stock.js';
import { listFilter, reqDate, reqGrade, reqNum, optNum, optStr, reqStr } from '../utils/validate.js';

const router = Router();
router.use(requireAuth);

async function autoBatch(date, grade) {
  const base = `B-${date.slice(2).replace(/-/g, '')}-${grade[0]}`;
  const count = await Production.countDocuments({ batchNo: new RegExp(`^${base}(-\\d+)?$`) });
  return count ? `${base}-${count + 1}` : base;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 500);
    const rows = await Production.find(listFilter(req.query)).sort({ date: -1, _id: -1 }).limit(limit);
    res.json(rows);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body;
    const date = reqDate(b.date);
    const grade = reqGrade(b.grade);
    const quantityKg = reqNum(b.quantityKg, 'Quantity', { min: 0.1 });
    const rawInputKg = optNum(b.rawInputKg, 'Raw almonds used', { min: 0.1 });
    const batchNo = b.batchNo ? reqStr(b.batchNo, 'Batch number', { max: 40 }) : await autoBatch(date, grade);
    const notes = optStr(b.notes, 'Notes');

    const doc = await Production.create({
      date, grade, quantityKg, rawInputKg, batchNo, notes, createdBy: req.user._id,
    });
    res.status(201).json(doc);
  })
);

router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const doc = await Production.findById(req.params.id);
    if (!doc) throw new HttpError(404, 'Entry not found.');
    const stock = await gradeStock(doc.grade);
    if (stock - doc.quantityKg < -0.0001) {
      throw new HttpError(409, 'Cannot delete this entry: part of it has already been sold.');
    }
    await doc.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
