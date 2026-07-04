# Deployment Guide - Maison de Beauté Full-Stack Salon Portal

This document provides step-by-step instructions to deploy the Maison de Beauté full-stack application (Node.js + Express + SQLite) to production.

---

## 1. Hosting Platforms: Why Vercel has Database Limitations

> [!WARNING]
> **Vercel is a Serverless platform with an ephemeral (temporary) filesystem.**
> If you deploy this project to Vercel:
> - The SQLite database `bookings.db` will be read-only or reset to its initial seed data every time Vercel's serverless container spins down (which happens after a few minutes of inactivity).
> - Any client bookings or reviews submitted by visitors will be lost on container recycle.

For persistent production databases in full-stack Node.js projects, choose one of the following deployment paths:

---

## Path A: Render.com (Highly Recommended & Easiest)

Render.com supports **Web Services** (running a continuous background Node server) and offers a **Persistent Disk** to store the SQLite `bookings.db` file securely.

### Step 1: Create a Render Account
1. Go to [Render.com](https://render.com/) and log in with your GitHub account.

### Step 2: Create a Web Service
1. In the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the following project settings:
   - **Name:** `maison-de-beaute-salon`
   - **Environment:** `Node`
   - **Region:** Choose the region closest to you (e.g., Oregon, Frankfurt).
   - **Branch:** `main` (or your active development branch)
   - **Root Directory:** `Hair-salon-website` (if your project is inside a subfolder, otherwise leave blank)
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`

### Step 3: Mount a Persistent Disk (Crucial for SQLite)
To prevent your SQLite database from resetting:
1. In your Web Service dashboard, go to the **Disks** tab in the left-hand menu.
2. Click **Add Disk** and configure:
   - **Name:** `sqlite-db-disk`
   - **Mount Path:** `/var/data`
   - **Size:** `1 GB` (more than enough for thousands of bookings)
3. Click **Save Changes**.

### Step 4: Configure Environment Variables
You need to tell the server to save the database file inside the mounted disk:
1. Go to the **Environment** tab on Render.
2. Click **Add Environment Variable** and define:
   - **Key:** `DATABASE_PATH`
   - **Value:** `/var/data/bookings.db`
   - **Key:** `PORT`
   - **Value:** `10000` (Render's default port)
3. Click **Save**. Render will automatically rebuild and host your full-stack app with database persistence!

---

## Path B: Vercel (Frontend) + Supabase/Neon (Database)

If you want to keep the frontend hosted on Vercel's fast global CDN:

1. **Host Frontend:** Deploy the `public/` assets folder as a static site on Vercel.
2. **Host Backend:** Deploy `src/server.js` to Render.com as a Web Service.
3. **Database:** Create a free hosted PostgreSQL database on [Supabase](https://supabase.com/) or [Neon.tech](https://neon.tech/).
4. **Integration:** Update `src/db.js` in your repository to connect to the cloud PostgreSQL database via a `DATABASE_URL` environment variable instead of using the local SQLite driver.

---

## 🔐 Logins & Verification

Once deployed, visit your service URL:
* **Client Homepage:** `https://your-app-name.onrender.com/`
* **Admin Portal Login:** `https://your-app-name.onrender.com/login.html`
  - **Username:** `admin`
  - **Password:** `Password123`

*Note: In Demo Mode, administrative modifications are blocked on the public URL to protect your database showcase. You can run automated tests locally by executing `node verify_apis.js`.*
