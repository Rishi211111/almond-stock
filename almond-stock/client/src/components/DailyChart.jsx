import { fmtDate, kg, parseDate } from '../utils.js';

export default function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.produced), ...daily.map((d) => d.sold));
  const top = Math.ceil(max / 100) * 100;
  const W = 700, H = 240, l = 44, r = 8, tp = 10, b = 28;
  const pw = W - l - r, ph = H - tp - b;
  const gw = pw / daily.length, bw = gw * 0.32;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily production and sales for the last 14 days, in kg">
      {[0, 1, 2, 3, 4].map((k) => {
        const y = tp + ph - (ph * k) / 4;
        return (
          <g key={k}>
            <line className="gl" x1={l} x2={W - r} y1={y} y2={y} />
            <text className="ax" x={l - 6} y={y + 4} textAnchor="end">{Math.round((top * k) / 4)}</text>
          </g>
        );
      })}
      {daily.map((d, i) => {
        const x0 = l + i * gw + gw / 2;
        const hp = (ph * d.produced) / top;
        const hs = (ph * d.sold) / top;
        return (
          <g key={d.date}>
            <rect className="bp" x={x0 - bw - 1} y={tp + ph - hp} width={bw} height={hp} rx="2">
              <title>{`${fmtDate(d.date)}: produced ${kg(d.produced)}`}</title>
            </rect>
            <rect className="bs" x={x0 + 1} y={tp + ph - hs} width={bw} height={hs} rx="2">
              <title>{`${fmtDate(d.date)}: sold ${kg(d.sold)}`}</title>
            </rect>
            <text className="ax" x={x0} y={H - 9} textAnchor="middle">{parseDate(d.date).getDate()}</text>
          </g>
        );
      })}
    </svg>
  );
}
