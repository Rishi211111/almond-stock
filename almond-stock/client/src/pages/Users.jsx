import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../toast.jsx';

function UserRow({ u, isSelf, onChange }) {
  const toast = useToast();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');

  async function patch(body, okMsg) {
    try {
      await api(`/users/${u.id}`, { method: 'PATCH', body });
      toast(okMsg);
      onChange();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <tr>
      <td>{u.name}{isSelf && ' (you)'}</td>
      <td>{u.email}</td>
      <td>
        <select value={u.role} disabled={isSelf} onChange={(e) => patch({ role: e.target.value }, 'Role updated.')} aria-label={`Role for ${u.name}`}>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td>{u.active ? <span className="chip ok">Active</span> : <span className="chip low">Disabled</span>}</td>
      <td className="r nowrap">
        {!isSelf && (
          <button type="button" className="btn sm" onClick={() => patch({ active: !u.active }, u.active ? 'Account disabled.' : 'Account enabled.')}>
            {u.active ? 'Disable' : 'Enable'}
          </button>
        )}{' '}
        {pwOpen ? (
          <span className="inline-pw">
            <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label={`New password for ${u.name}`} />
            <button
              type="button"
              className="btn sm"
              onClick={async () => {
                await patch({ password: pw }, 'Password changed.');
                setPw('');
                setPwOpen(false);
              }}
            >
              Save
            </button>
          </span>
        ) : (
          <button type="button" className="btn sm" onClick={() => setPwOpen(true)}>Reset password</button>
        )}
      </td>
    </tr>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const load = useCallback(() => {
    api('/users').then(setUsers).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/users', { method: 'POST', body: form });
      toast(`Added ${form.name}.`);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="split">
      <div className="panel">
        <h3>Add a user</h3>
        <p className="sub">Staff can add production and sales. Admins can also delete entries and manage users.</p>
        <form onSubmit={submit} autoComplete="off">
          <div className="field"><label htmlFor="u-name">Name</label><input id="u-name" value={form.name} onChange={set('name')} required /></div>
          <div className="field"><label htmlFor="u-email">Email</label><input id="u-email" type="email" value={form.email} onChange={set('email')} required /></div>
          <div className="field">
            <label htmlFor="u-pass">Password</label>
            <input id="u-pass" type="password" minLength={8} value={form.password} onChange={set('password')} required />
            <div className="hint">At least 8 characters.</div>
          </div>
          <div className="field">
            <label htmlFor="u-role">Role</label>
            <select id="u-role" value={form.role} onChange={set('role')}>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="hint err" role="alert">{error}</div>
          <button className="btn prod" type="submit">Add user</button>
        </form>
      </div>

      <div className="panel">
        <h3>Users</h3>
        <p className="sub">Disabled users cannot sign in.</p>
        <div className="tscroll">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
            <tbody>
              {users.map((u) => <UserRow key={u.id} u={u} isSelf={u.id === me.id} onChange={load} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
