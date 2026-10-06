import { GRADES } from '../config/constants.js';
import { HttpError } from './http.js';
import { isValidDate } from './dates.js';

const bad = (msg) => new HttpError(400, msg);

export function reqDate(v, name = 'Date') {
  if (!isValidDate(v)) throw bad(`${name} must be a valid date (YYYY-MM-DD).`);
  return v;
}

export function reqGrade(v) {
  if (!GRADES.includes(v)) throw bad(`Grade must be one of: ${GRADES.join(', ')}.`);
  return v;
}

export function reqNum(v, name, { min = -Infinity } = {}) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw bad(`${name} must be a number.`);
  if (n < min) throw bad(`${name} must be at least ${min}.`);
  return n;
}

export function optNum(v, name, opts) {
  if (v === undefined || v === null || v === '') return null;
  return reqNum(v, name, opts);
}

export function reqStr(v, name, { max = 200 } = {}) {
  if (typeof v !== 'string' || v.trim() === '') throw bad(`${name} is required.`);
  const s = v.trim();
  if (s.length > max) throw bad(`${name} must be at most ${max} characters.`);
  return s;
}

export function optStr(v, name, { max = 300 } = {}) {
  if (v === undefined || v === null || v === '') return '';
  return reqStr(v, name, { max });
}

// Builds a Mongo filter from ?from=&to=&grade=
export function listFilter(query) {
  const q = {};
  if (query.from || query.to) {
    q.date = {};
    if (query.from) q.date.$gte = reqDate(query.from, 'From');
    if (query.to) q.date.$lte = reqDate(query.to, 'To');
  }
  if (query.grade) q.grade = reqGrade(query.grade);
  return q;
}
