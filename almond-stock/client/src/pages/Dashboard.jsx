import { useEffect, useState } from 'react';
import { api } from '../api.js';
import DailyChart from '../components/DailyChart.jsx';
import { fmtDate, inr, kg, n1, today } from '../utils.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/stock/overview?today=${today()}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="sub">Loading…</p>;

  const { grades, totalKg, todayFigures: t, daily } = data;
  const scale = Math.max(...grades.map((g) => g.stockKg), ...grades.map((g) => g.lowLevelKg)) * 1.12 || 1;
  const change = t.produced - t.sold;

  return (
    <>
      <div className="grid2">
        <div className="panel">
          <h3>Stock on hand</h3>
          <p className="sub">{kg(totalKg)} across {grades.length} grades</p>
          <div>
            {grades.map((g) => {
              const w = Math.max(0, Math.min(100, (g.stockKg / scale) * 100));
              const m = (g.lowLevelKg / scale) * 100;
              return (
                <div className="bin" key={g.grade}>
                  <div className="bin-name">{g.grade}</div>
                  <div className="track" role="img" aria-label={`${g.grade}: ${kg(g.stockKg)} in stock, low-stock level ${g.lowLevelKg} kg`}>
                    <div className={`fill${g.isLow ? ' low' : ''}`} style={{ width: `${w}%` }} />
                    <div className="mark" style={{ left: `${m}%` }} />
                  </div>
                  <div className="bin-val">
                    <b>{kg(g.stockKg)}</b>
                    {g.isLow ? <span className="chip low">Low, under {g.lowLevelKg} kg</span> : <span className="chip ok">Enough stock</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="legend-key">The dark line on each bar marks the low-stock level.</p>
        </div>

        <div className="panel">
          <h3>Today</h3>
          <p className="sub">{fmtDate(data.today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <dl className="today">
            <div><dt>Produced</dt><dd className="c-prod">{kg(t.produced)}</dd></div>
            <div><dt>Sold</dt><dd className="c-sale">{kg(t.sold)}</dd></div>
            <div><dt>Sales value</dt><dd>{inr(t.salesValue)}</dd></div>
            <div><dt>Stock change</dt><dd>{change >= 0 ? '+' : '−'}{n1(Math.abs(change))} kg</dd></div>
          </dl>
        </div>
      </div>

      <div className="panel">
        <h3>Production and sales, last 14 days</h3>
        <p className="sub">All grades together, in kg per day.</p>
        <div className="legend">
          <span><i className="sw" style={{ background: 'var(--prod)' }} />Produced</span>
          <span><i className="sw" style={{ background: 'var(--sale)' }} />Sold</span>
        </div>
        <div className="chart-scroll"><DailyChart daily={daily} /></div>
      </div>
    </>
  );
}
