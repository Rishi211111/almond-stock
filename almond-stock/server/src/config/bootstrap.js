import User from '../models/User.js';

// On a fresh database, create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD.
// This lets a hosted copy start with a login without running any script by hand.
// It only runs when there are no users at all, so it never overwrites anything.
export async function ensureAdmin() {
  if ((await User.countDocuments()) > 0) return;

  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 8) {
    console.warn('No users yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) to create the first admin.');
    return;
  }

  await User.create({
    name: process.env.ADMIN_NAME || 'Owner',
    email,
    role: 'admin',
    passwordHash: await User.hashPassword(password),
  });
  console.log(`First admin created: ${email}`);
}
