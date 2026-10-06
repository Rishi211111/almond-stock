import Production from '../models/Production.js';
import Sale from '../models/Sale.js';
import { GRADES, LOW_STOCK_KG } from '../config/constants.js';
import { addDays, daysBetween } from './dates.js';
import { r1, r3 } from './http.js';

// Stock is never stored. It is always: total produced - total sold.

export async function gradeTotals() {
  const group = { $group: { _id: '$grade', kg: { $sum: '$quantityKg' } } };
  const [p, s] = await Promise.all([Production.aggregate([group]), Sale.aggregate([group])]);
  const pm = Object.fromEntries(p.map((x) => [x._id, x.kg]));
  const sm = Object.fromEntries(s.map((x) => [x._id, x.kg]));
  return GRADES.map((grade) => {
    const producedKg = r3(pm[grade] || 0);
    const soldKg = r3(sm[grade] || 0);
    const stockKg = r3(producedKg - soldKg);
    return {
      grade,
      producedKg,
      soldKg,
      stockKg,
      lowLevelKg: LOW_STOCK_KG[grade],
      isLow: stockKg < LOW_STOCK_KG[grade],
    };
  });
}

export async function gradeStock(grade) {
  const pipeline = [{ $match: { grade } }, { $group: { _id: null, kg: { $sum: '$quantityKg' } } }];
  const [p, s] = await Promise.all([Production.aggregate(pipeline), Sale.aggregate(pipeline)]);
  return r3((p[0]?.kg || 0) - (s[0]?.kg || 0));
}

async function dailyTotals(from, to, grade) {
  const match = { date: { $gte: from, $lte: to } };
  if (grade) match.grade = grade;
  const [p, s] = await Promise.all([
    Production.aggregate([
      { $match: match },
      { $group: { _id: '$date', kg: { $sum: '$quantityKg' } } },
    ]),
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$date',
          kg: { $sum: '$quantityKg' },
          value: { $sum: { $multiply: ['$quantityKg', '$ratePerKg'] } },
        },
      },
    ]),
  ]);
  return {
    produced: Object.fromEntries(p.map((x) => [x._id, x.kg])),
    sold: Object.fromEntries(s.map((x) => [x._id, { kg: x.kg, value: x.value }])),
  };
}

async function stockBefore(date, grade) {
  const match = { date: { $lt: date } };
  if (grade) match.grade = grade;
  const pipeline = [{ $match: match }, { $group: { _id: null, kg: { $sum: '$quantityKg' } } }];
  const [p, s] = await Promise.all([Production.aggregate(pipeline), Sale.aggregate(pipeline)]);
  return (p[0]?.kg || 0) - (s[0]?.kg || 0);
}

// Last N days (ending today) of produced / sold kg, for the chart.
export async function recentDaily(today, count = 14) {
  const from = addDays(today, -(count - 1));
  const t = await dailyTotals(from, today, null);
  return daysBetween(from, today).map((date) => ({
    date,
    produced: r1(t.produced[date] || 0),
    sold: r1(t.sold[date]?.kg || 0),
  }));
}

export async function todayFigures(today) {
  const t = await dailyTotals(today, today, null);
  return {
    produced: r1(t.produced[today] || 0),
    sold: r1(t.sold[today]?.kg || 0),
    salesValue: Math.round(t.sold[today]?.value || 0),
  };
}

// Day-wise report: opening, produced, sold, closing for each day in the range.
export async function daywiseReport(from, to, grade) {
  const [opening, t] = await Promise.all([stockBefore(from, grade), dailyTotals(from, to, grade)]);
  let running = opening;
  let totalProduced = 0;
  let totalSold = 0;
  let totalValue = 0;

  const rows = daysBetween(from, to).map((date) => {
    const produced = t.produced[date] || 0;
    const sold = t.sold[date]?.kg || 0;
    const value = t.sold[date]?.value || 0;
    const open = running;
    running = open + produced - sold;
    totalProduced += produced;
    totalSold += sold;
    totalValue += value;
    return {
      date,
      openingKg: r1(open),
      producedKg: r1(produced),
      soldKg: r1(sold),
      closingKg: r1(running),
      salesValue: Math.round(value),
    };
  });

  return {
    from,
    to,
    grade: grade || 'all',
    rows,
    totals: {
      openingKg: r1(opening),
      producedKg: r1(totalProduced),
      soldKg: r1(totalSold),
      closingKg: r1(running),
      salesValue: Math.round(totalValue),
    },
  };
}
