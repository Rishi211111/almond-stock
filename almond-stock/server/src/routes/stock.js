import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, r3 } from '../utils/http.js';
import { isValidDate, todayStr } from '../utils/dates.js';
import { gradeTotals, recentDaily, todayFigures } from '../utils/stock.js';

const router = Router();
router.use(requireAuth);

// Current stock per grade.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const grades = await gradeTotals();
    res.json({ grades, totalKg: r3(grades.reduce((a, g) => a + g.stockKg, 0)) });
  })
);

// Everything the stock overview screen needs in one call.
router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const today = isValidDate(req.query.today) ? req.query.today : todayStr();
    const [grades, daily, figures] = await Promise.all([
      gradeTotals(),
      recentDaily(today, 14),
      todayFigures(today),
    ]);
    res.json({
      today,
      grades,
      totalKg: r3(grades.reduce((a, g) => a + g.stockKg, 0)),
      todayFigures: figures,
      daily,
    });
  })
);

export default router;
