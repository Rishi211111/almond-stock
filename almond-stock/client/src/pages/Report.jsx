import { useEffect, useState } from 'react';
import { api, downloadFile } from '../api.js';
import { useMeta } from '../meta.jsx';
import { useToast } from '../toast.jsx';
import { addDays, fmtDate, inr, n1, today } from '../utils.js';

export default function Report() {
  const { grades } = useMeta();
  const toast = useToast();
  const [from, setFrom] = useState(addDays(today(), -6));
  const [to, setTo] = useState(today());
  const [grade, setGrade] = useState('all');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const query = `from=${from}&to=${to}&grade=${grade}`;

  useEffect(() => {
    if (!from || !to) return;
    setError('');
    api(`/reports/daywise?${query}`)
      .then(setReport)
      .catch((e) => { setReport(null); setError(e.message); });
  }, [from, to, grade]); // eslint-disable-line react-hooks/exhaustive-deps

  async function download() {
    try {
      await downloadFile(`/reports/daywise.csv?${query}`, `daywise-${from}-to-${to}.csv`);
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <div className="panel">
      <div className="row-head">
        <div>
          <h3>Day-wise report</h3>
          <p className="sub" style={{ margin: 0 }}>Opening stock, production, sales and closing stock for each day.</p>
        </div>
        <button className="btn" type="button" onClick={download} disabled={!report}>Download CSV for Excel</button>
      </div>

      <div className="filters">
        <div className="field"><label htmlFor="r-from">From</label><input id="r-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label htmlFor="r-to">To</label><input id="r-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field">
          <label htmlFor="r-grade">Grade</label>
          <select id="r-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="all">All grades</option>
            {grades.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="err">{error}</p>}

      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th>Date</th><th className="r">Opening (kg)</th><th className="r">Produced (kg)</th>
              <th className="r">Sold (kg)</th><th className="r">Closing (kg)</th><th className="r">Sales value</th>
            </tr>
          </thead>
          <tbody>
            {report?.rows.map((r) => (
              <tr key={r.date} className={r.producedKg === 0 && r.soldKg === 0 ? 'zero' : ''}>
                <td>{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td className="r">{n1(r.openingKg)}</td>
                <td className="r">{r.producedKg ? n1(r.producedKg) : '–'}</td>
                <td className="r">{r.soldKg ? n1(r.soldKg) : '–'}</td>
                <td className="r"><b>{n1(r.closingKg)}</b></td>
                <td className="r">{r.salesValue ? inr(r.salesValue) : '–'}</td>
              </tr>
            ))}
          </tbody>
          {report && (
            <tfoot>
              <tr>
                <td>Period total</td>
                <td className="r">{n1(report.totals.openingKg)}</td>
                <td className="r">{n1(report.totals.producedKg)}</td>
                <td className="r">{n1(report.totals.soldKg)}</td>
                <td className="r">{n1(report.totals.closingKg)}</td>
                <td className="r">{inr(report.totals.salesValue)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
