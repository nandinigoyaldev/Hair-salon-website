# Deployment Guide - Maison de Beauté (100% Free Hosting Paths)

Since Render's persistent disk is a paid add-on, this guide provides two completely **free-tier** deployment routes with persistent databases.

---

## Path A: Glitch.com (100% Free SQLite Persistence)

[Glitch.com](https://glitch.com/) is a developer platform that hosts Node.js projects for free. It has a built-in persistent folder named `.data` which keeps your SQLite `bookings.db` file safe across restarts.

### Step 1: Import Your Code to Glitch
1. Log in to [Glitch.com](https://glitch.com/) (sign up with GitHub).
2. Click **New Project** and select **Import from GitHub**.
3. Paste your repository URL: `https://github.com/nandinigoyaldev/mason-de-beaute.git`.

### Step 2: Configure the Database Path
Once imported, Glitch will create an editor workspace:
1. Open the `.env` file in the Glitch sidebar (create it if it doesn't exist).
2. Add the following environment variable:
   ```env
   DATABASE_PATH=/app/.data/bookings.db
   ```
3. Glitch will automatically install your dependencies from `package.json` and start the server. 
4. Your application will be live at `https://[your-project-name].glitch.me`.

---

## Path B: Neon.tech PostgreSQL (Free Cloud Database)

For a professional portfolio piece, migrating your database to a cloud-hosted PostgreSQL database like **Neon.tech** or **Supabase** is highly recommended. It allows you to host the backend on Render's Free Tier and the database on Neon's Free Tier.

### Step 1: Create a Free Database on Neon
1. Go to [Neon.tech](https://neon.tech/) and create a free account.
2. Create a project and select **PostgreSQL**.
3. Copy the **Connection String** from the dashboard. It will look like:
   `postgresql://alex:password@ep-cool-pool-1234.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Switch the Connection Driver
To support PostgreSQL instead of SQLite, we install the Node PostgreSQL client:
```bash
npm install pg
```

Here is how you update `src/db.js` to support Postgres dynamically if a `DATABASE_URL` exists:

```javascript
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let query;
let isPostgres = false;

if (process.env.DATABASE_URL) {
    isPostgres = true;
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    query = {
        all: (sql, params = []) => pool.query(sql.replace(/\?/g, (m, i) => `$${params.indexOf(params[i]) + 1}`)).then(res => res.rows),
        get: (sql, params = []) => pool.query(sql.replace(/\?/g, (m, i) => `$${params.indexOf(params[i]) + 1}`)).then(res => res.rows[0]),
        run: (sql, params = []) => pool.query(sql.replace(/\?/g, (m, i) => `$${params.indexOf(params[i]) + 1}`))
    };
    console.log('Connected to cloud PostgreSQL database.');
} else {
    // Fallback to SQLite locally
    const dbPath = path.join(__dirname, '..', 'bookings.db');
    const db = new sqlite3.Database(dbPath);
    query = {
        all: (sql, params = []) => new Promise((r, j) => db.all(sql, params, (e, rows) => e ? j(e) : r(rows))),
        get: (sql, params = []) => new Promise((r, j) => db.get(sql, params, (e, row) => e ? j(e) : r(row))),
        run: (sql, params = []) => new Promise((r, j) => db.run(sql, params, function(e) { e ? j(e) : r(this) }))
    };
    console.log('Connected to local SQLite database.');
}
```

### Step 3: Deploy Backend to Render Free Tier
1. Create a **Web Service** on Render pointing to your GitHub repository.
2. Set build command to `npm install` and start command to `node src/server.js`.
3. In the **Environment** tab, add a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** *[Your Neon Connection String]*
4. Click **Save Changes**. Your database is now hosted in the cloud, completely free, and will never reset!
