# Almond Stock

Inventory app for an almond business. It records **daily production**, **sales**, and works out **stock on hand** per grade. Built with the MERN stack (MongoDB, Express, React, Node) and role-based logins.

- **Stock overview:** stock per grade with low-stock warnings, today's figures, 14-day chart
- **Daily production:** add and review production entries (grade, kg, batch, raw almonds used, yield)
- **Sales:** record sales; the server refuses a sale larger than the stock available
- **Day-wise report:** opening, produced, sold and closing stock for each day, with CSV download
- **Users:** admins add staff, change roles, disable accounts and reset passwords

Stock is never typed in. It is always calculated as total produced minus total sold, so it cannot drift out of sync.

## Roles

| | Staff | Admin |
|---|---|---|
| View stock, reports, entries | yes | yes |
| Add production and sales | yes | yes |
| Delete entries | no | yes |
| Manage users | no | yes |

## What you need

- Node.js 18.11 or newer
- MongoDB: a local install, or a free MongoDB Atlas cluster

## Run it locally

```bash
# 1. Backend
cd server
npm install
cp .env.example .env        # then edit .env: set MONGODB_URI, JWT_SECRET, admin email and password
npm run seed:admin          # creates the first admin user
npm run seed:demo           # optional: loads 2 weeks of sample data
npm run dev                 # API on http://localhost:5000

# 2. Frontend (in a second terminal)
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Open http://localhost:5173 and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Then open the **Users** tab to add staff accounts.

To generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Change grades, low-stock levels and default rates

Edit `server/src/config/constants.js` and restart the server. Use the client's real grades before going live. Existing entries keep their old grade names, so decide the names first.

## Deploy as one app

```bash
cd client && npm install && npm run build     # creates client/dist
cd ../server && npm install && npm start      # serves the API and the built React app
```

When `client/dist` exists, the Express server serves it, so one Node process runs everything. Set these environment variables on the host:

- `MONGODB_URI` (use MongoDB Atlas)
- `JWT_SECRET` (long and random)
- `CLIENT_ORIGIN` (only needed if the frontend is hosted separately)
- `PORT` (most hosts set this for you)

Serve the site over HTTPS. Render, Railway and similar hosts do this automatically.

## API

All routes need `Authorization: Bearer <token>` except login.

| Method and path | Who | What |
|---|---|---|
| `POST /api/auth/login` | public | Sign in, returns token and user |
| `GET /api/auth/me` | any | Current user |
| `GET /api/auth/meta` | any | Grades, low-stock levels, default rates |
| `GET /api/production` | any | List entries (`from`, `to`, `grade`, `limit`) |
| `POST /api/production` | any | Add a production entry |
| `DELETE /api/production/:id` | admin | Delete (blocked if that stock was already sold) |
| `GET /api/sales` | any | List sales (`from`, `to`, `grade`, `limit`) |
| `POST /api/sales` | any | Record a sale (blocked if stock is too low) |
| `DELETE /api/sales/:id` | admin | Delete a sale |
| `GET /api/stock` | any | Current stock per grade |
| `GET /api/stock/overview` | any | Dashboard data in one call |
| `GET /api/reports/daywise` | any | Day-wise report as JSON (`from`, `to`, `grade`) |
| `GET /api/reports/daywise.csv` | any | Same report as a CSV file |
| `GET/POST/PATCH /api/users` | admin | List, add, and update users |

## Project layout

```
server/src
  config/      constants (grades, levels), database connection
  models/      User, Production, Sale
  routes/      auth, users, production, sales, stock, reports
  middleware/  JWT auth and role checks, error handler
  utils/       stock maths, date helpers, validation
  seed.js      creates the first admin and optional demo data
client/src
  pages/       Dashboard, Production, Sales, Report, Users, Login
  components/  Layout, chart, delete confirmation
```

## Good to know

- Dates are saved as plain `YYYY-MM-DD` text, so time zones never shift an entry to another day. Set `TZ_NAME` in `.env` for the server's idea of "today".
- Passwords are hashed with bcrypt. Login is rate limited. Tokens expire after 12 hours (`JWT_EXPIRES`).
- Two sales saved at the very same instant could both pass the stock check. For one shop this is not a practical concern; MongoDB transactions can close the gap later.
- Back up the database regularly (Atlas does this on paid tiers; otherwise schedule `mongodump`).

## Ideas for later

Packaging sizes (for example 250 g and 1 kg packs), customer records with payments owed, wastage tracking, edit entries with an audit trail, and multiple warehouses.
