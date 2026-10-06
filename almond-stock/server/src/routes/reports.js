import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { addDays, daysBetween, todayStr } from '../utils/dates.js';
import { daywiseReport } from '../utils/stock.js';
import { reqDate, reqGrade } from '../utils/validate.js';

const router = Router();
router.use(requireAuth);

function params(query) {
  const to = query.to ? reqDate(query.to, 'To') : todayStr();
  const from = query.from ? reqDate(query.from, 'From') : addDays(to, -6);
  if (from > to) throw new HttpError(400, 'The start date must be on or before the end date.');
  if (daysBetween(from, to).length > 366) throw new HttpError(400, 'Choose a range of up to one year.');
  const grade = query.grade && query.grade !== 'all' ? reqGrade(query.grade) : null;
  return { from, to, grade };
}

router.get(
  '/daywise',
  asyncHandler(async (req, res) => {
    const { from, to, grade } = params(req.query);
    res.json(await daywiseReport(from, to, grade));
  })
);

router.get(
  '/daywise.csv',
  asyncHandler(async (req, res) => {
    const { from, to, grade } = params(req.query);
    const r = await daywiseReport(from, to, grade);
    const lines = ['Date,Opening (kg),Produced (kg),Sold (kg),Closing (kg),Sales value (INR)'];
    for (const x of r.rows) {
      lines.push([x.date, x.openingKg, x.producedKg, x.soldKg, x.closingKg, x.salesValue].join(','));
    }
    const t = r.totals;
    lines.push(['Total', t.openingKg, t.producedKg, t.soldKg, t.closingKg, t.salesValue].join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="daywise-${from}-to-${to}.csv"`);
    res.send(lines.join('\n'));
  })
);

export default router;
