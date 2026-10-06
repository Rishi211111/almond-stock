import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ConfirmDelete from '../components/ConfirmDelete.jsx';
import { useMeta } from '../meta.jsx';
import { useToast } from '../toast.jsx';
import { fmtDate, inr, kg, today } from '../utils.js';

export default function Sales() {
  const { grades, defaultRate } = useMeta();
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [stock, setStock] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rateTouched, setRateTouched] = useState(false);
  const [form, setForm] = useState({
    date: today(), customer: '', grade: grades[0], quantityKg: '', ratePerKg: defaultRate[grades[0]] ?? '',
  });

  const load = useCallback(() => {
    api('/sales?limit=40').then(setRows).catch((e) => setError(e.message));
    api('/stock').then((d) => setStock(d.grades)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const customers = useMemo(() => [...new Set(rows.map((r) => r.customer))], [rows]);
  const available = stock.find((s) => s.grade === form.grade)?.stockKg;
  const amount = Number(form.quantityKg) > 0 && Number(form.ratePerKg) >= 0 ? inr(form.quantityKg * form.ratePerKg) : '';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function changeGrade(e) {
    const grade = e.target.value;
    setError('');
    setForm((f) => ({ ...f, grade, ratePerKg: rateTouched ? f.ratePerKg : defaultRate[grade] ?? f.ratePerKg }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/sales', { method: 'POST', body: form });
      toast(`Recorded sale of ${kg(form.quantityKg)} ${form.grade} for ${amount}.`);
      setForm((f) => ({ ...f, customer: '', quantityKg: '' }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api(`/sales/${id}`, { method: 'DELETE' });
      toast('Entry deleted.');
      load();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <div className="split">
      <div className="panel">
        <h3>Record a sale</h3>
        <p className="sub">Stock is reduced as soon as you save.</p>
        <form onSubmit={submit} autoComplete="off">
          <div className="field">
            <label htmlFor="s-date">Date</label>
            <input id="s-date" type="date" value={form.date} onChange={set('date')} required />
          </div>
          <div className="field">
            <label htmlFor="s-cust">Customer</label>
            <input id="s-cust" type="text" list="custlist" value={form.customer} onChange={set('customer')} required />
            <datalist id="custlist">{customers.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="s-grade">Grade</label>
              <select id="s-grade" value={form.grade} onChange={changeGrade}>
                {grades.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-qty">Sold (kg)</label>
              <input id="s-qty" type="number" min="0.1" step="0.1" inputMode="decimal" value={form.quantityKg} onChange={(e) => { setError(''); set('quantityKg')(e); }} required />
            </div>
          </div>
          <div className="hint" style={{ margin: '-6px 0 10px' }}>
            {available !== undefined ? `In stock: ${kg(available)} of ${form.grade}` : ''}
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="s-rate">Rate per kg (₹)</label>
              <input id="s-rate" type="number" min="0" step="1" inputMode="decimal" value={form.ratePerKg} onChange={(e) => { setRateTouched(true); set('ratePerKg')(e); }} required />
            </div>
            <div className="field">
              <label htmlFor="s-total">Amount (₹)</label>
              <input id="s-total" type="text" value={amount} readOnly />
            </div>
          </div>
          <div className="hint err" role="alert">{error}</div>
          <button className="btn sale" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Record sale'}</button>
        </form>
      </div>

      <div className="panel">
        <div className="row-head">
          <div>
            <h3>Recent sales</h3>
            <p className="sub" style={{ margin: 0 }}>Latest 40 entries, newest first.</p>
          </div>
        </div>
        <div className="tscroll">
          <table>
            <thead>
              <tr><th>Date</th><th>Customer</th><th>Grade</th><th className="r">Sold</th><th className="r">Rate</th><th className="r">Amount</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="7" className="empty">No sales recorded yet. Record the first sale on the left.</td></tr>}
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>{fmtDate(x.date)}</td>
                  <td>{x.customer}</td>
                  <td>{x.grade}</td>
                  <td className="r">{kg(x.quantityKg)}</td>
                  <td className="r">{inr(x.ratePerKg)}</td>
                  <td className="r">{inr(x.amount)}</td>
                  <td className="r">{user.role === 'admin' && <ConfirmDelete onConfirm={() => remove(x.id)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
