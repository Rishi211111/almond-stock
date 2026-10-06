import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ConfirmDelete from '../components/ConfirmDelete.jsx';
import { useMeta } from '../meta.jsx';
import { useToast } from '../toast.jsx';
import { fmtDate, kg, today } from '../utils.js';

export default function Production() {
  const { grades } = useMeta();
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ date: today(), grade: grades[0], quantityKg: '', rawInputKg: '', batchNo: '', notes: '' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = useCallback(() => {
    api('/production?limit=40').then(setRows).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/production', {
        method: 'POST',
        body: {
          date: form.date,
          grade: form.grade,
          quantityKg: form.quantityKg,
          rawInputKg: form.rawInputKg,
          batchNo: form.batchNo,
          notes: form.notes,
        },
      });
      toast(`Added ${kg(form.quantityKg)} of ${form.grade} to ${fmtDate(form.date)} production.`);
      setForm((f) => ({ ...f, quantityKg: '', rawInputKg: '', batchNo: '', notes: '' }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api(`/production/${id}`, { method: 'DELETE' });
      toast('Entry deleted.');
      load();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <div className="split">
      <div className="panel">
        <h3>Add production</h3>
        <p className="sub">Record what came out of production for a day.</p>
        <form onSubmit={submit} autoComplete="off">
          <div className="field">
            <label htmlFor="p-date">Date</label>
            <input id="p-date" type="date" value={form.date} onChange={set('date')} required />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="p-grade">Grade</label>
              <select id="p-grade" value={form.grade} onChange={set('grade')}>
                {grades.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-qty">Produced (kg)</label>
              <input id="p-qty" type="number" min="0.1" step="0.1" inputMode="decimal" value={form.quantityKg} onChange={set('quantityKg')} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="p-raw">Raw almonds used (kg), optional</label>
            <input id="p-raw" type="number" min="0.1" step="0.1" inputMode="decimal" value={form.rawInputKg} onChange={set('rawInputKg')} />
          </div>
          <div className="field">
            <label htmlFor="p-batch">Batch number</label>
            <input id="p-batch" type="text" value={form.batchNo} onChange={set('batchNo')} />
            <div className="hint">Leave empty and a batch number is created for you.</div>
          </div>
          <div className="field">
            <label htmlFor="p-notes">Notes, optional</label>
            <textarea id="p-notes" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="hint err" role="alert">{error}</div>
          <button className="btn prod" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add production'}</button>
        </form>
      </div>

      <div className="panel">
        <div className="row-head">
          <div>
            <h3>Recent production</h3>
            <p className="sub" style={{ margin: 0 }}>Latest 40 entries, newest first.</p>
          </div>
        </div>
        <div className="tscroll">
          <table>
            <thead>
              <tr><th>Date</th><th>Batch</th><th>Grade</th><th className="r">Produced</th><th className="r">Yield</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="7" className="empty">No production recorded yet. Add the first entry on the left.</td></tr>}
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>{fmtDate(x.date)}</td>
                  <td>{x.batchNo}</td>
                  <td>{x.grade}</td>
                  <td className="r">{kg(x.quantityKg)}</td>
                  <td className="r">{x.rawInputKg ? `${Math.round((x.quantityKg / x.rawInputKg) * 100)}%` : '–'}</td>
                  <td>{x.notes}</td>
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
