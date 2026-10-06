export function notFound(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(' ');
    return res.status(400).json({ error: msg });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id.' });
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ error: `That ${field} is already in use.` });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
