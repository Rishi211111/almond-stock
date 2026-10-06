import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Production from './models/Production.js';
import Sale from './models/Sale.js';
import { DEFAULT_RATE, GRADES } from './config/constants.js';
import { addDays, todayStr, weekday } from './utils/dates.js';

const mode = process.argv[2];
const force = process.argv.includes('--force');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env first.');
  }
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin ${email} already exists. Nothing to do.`);
    return;
  }
  await User.create({
    name: process.env.ADMIN_NAME || 'Owner',
    email,
    role: 'admin',
    passwordHash: await User.hashPassword(password),
  });
  console.log(`Admin created: ${email}`);
}

async function seedDemo() {
  const count = (await Production.countDocuments()) + (await Sale.countDocuments());
  if (count > 0 && !force) {
    throw new Error('Entries already exist. Run with --force to wipe them and load sample data.');
  }
  await Promise.all([Production.deleteMany({}), Sale.deleteMany({})]);

  const today = todayStr();
  const customers = ['Sri Lakshmi Traders', 'Kumar Dry Fruits', 'Anand Sweets', 'Fresh Basket Retail', 'Madurai Nut House'];
  const production = [];
  const sales = [];

  for (let i = 14; i >= 0; i--) {
    const date = addDays(today, -i);
    if (weekday(date) === 0) continue; // closed on Sundays
    const q = { Whole: 120 + ((i * 37) % 60), Broken: 40 + ((i * 17) % 30), Sliced: 18 + ((i * 13) % 14) };
    for (const grade of GRADES) {
      production.push({
        date,
        grade,
        batchNo: `B-${date.slice(2).replace(/-/g, '')}-${grade[0]}`,
        quantityKg: q[grade],
        rawInputKg: Math.round(q[grade] * 1.12),
      });
    }
    const c = (i * 3) % customers.length;
    sales.push({ date, customer: customers[c], grade: 'Whole', quantityKg: 60 + ((i * 29) % 70), ratePerKg: DEFAULT_RATE.Whole });
    if (i % 2 === 0) {
      sales.push({ date, customer: customers[(c + 1) % customers.length], grade: 'Broken', quantityKg: 35 + ((i * 11) % 30), ratePerKg: DEFAULT_RATE.Broken });
    } else {
      sales.push({ date, customer: customers[(c + 2) % customers.length], grade: 'Sliced', quantityKg: 30 + ((i * 7) % 15), ratePerKg: DEFAULT_RATE.Sliced });
    }
  }

  await Production.insertMany(production);
  await Sale.insertMany(sales);
  console.log(`Loaded ${production.length} production entries and ${sales.length} sales.`);
}

try {
  if (!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI in .env');
  await mongoose.connect(process.env.MONGODB_URI);
  if (mode === 'admin') await seedAdmin();
  else if (mode === 'demo') await seedDemo();
  else throw new Error('Usage: node src/seed.js admin | demo [--force]');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
