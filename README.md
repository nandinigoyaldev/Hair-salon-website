# Maison de Beauté — Full-Stack Hair Styling & Care Portal

```
   ✨  M A I S O N   D E   B E A U T É  ✨
   Professional Hair Styling • Color • Treatment
```

Maison de Beauté is an elegant, full-stack salon management and reservation platform designed for high-end luxury beauty salons. It features an interactive, step-by-step reservation wizard for clients, a coupon discount engine, visual transformation comparisons, and a secure staff portal for scheduling metrics and stylist commission reports.

---

## 🚀 Key Features

### 📅 Client Booking Interface
* **3-Step Reservation Wizard:** A slide-based booking step selector (Services ➔ Timing ➔ Client Details) styled to fit within a single screen height frame.
* **Service Upgrades & Add-ons:** Opt-in upgrades (e.g. *Hydrating Spa Mask (+$25)*, *Color-Protect Shampoo (+$18)*) with dynamic billing invoice adjustments.
* **Promo Code Engine:** Live coupon code validation (e.g., `WELCOME10` for 10% off; `GOLD15` for 15% off base service pricing).
* **Live Bill Invoice Summary:** Real-time billing breakdown displaying base price, active add-ons sum, coupon discounts, and net totals.
* **Printable Invoice Receipt:** Successful submissions generate a print-ready transaction invoice receipt card complete with a unique Reference ID and check-in QR Code.

### 🌟 Portfolio & Reviews
* **Draggable Before/After Slider:** An interactive widget clipping before/after hair styling results using an HTML range scroller handle.
* **Dynamic Reviews Grid:** Customer reviews are stored in a database table and rendered dynamically. Testimonials are automatically capped at the latest 3 cards to prevent layout bloat, with an elegant "View All Reviews" button to slide-reveal history.
* **Review Submission Form:** A glassmorphic form widget enabling clients to submit ratings (1-5 stars) and comments.

### 💼 Staff Admin Dashboard (`/login.html`)
* **Stylist Commissions Panel:** Automatically calculates completed appointment counts, total service sales, and commission payouts (50% split on base services) per stylist.
* **Showcase Demo Mode:** Prevents public portfolio visitors from deleting core services, stylists, or changing passwords (returns *403 Forbidden*), while letting automated test scripts bypass restrictions using an validation header.
* **Password Toggle:** An inline "SHOW"/"HIDE" password button on the admin login page for easier credential typing.
* **Comprehensive Metrics:** Tracks Total Bookings, Pending bookings, and net Revenue (computed from completed booking net totals).

---

## 📂 Project Structure

```
Hair-salon-website/
├── public/                    <-- Frontend Assets & Pages
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css      <-- Client styles, animated burger & step wizard
│   │   │   └── admin.css      <-- Admin dashboard cards & table structures
│   │   ├── images/            <-- Monogram logos & high-fashion model assets
│   │   └── js/
│   │       ├── main.js        <-- Multi-step wizard controllers & reviews loaders
│   │       └── admin.js       <-- Dashboard calculations & commissions reports
│   ├── index.html             <-- Client reservation homepage
│   ├── login.html             <-- Staff login page with show/hide password toggles
│   └── admin.html             <-- Administrative metrics & commissions dashboard
├── src/                       <-- Backend Server Source
│   ├── db.js                  <-- SQLite schemas and reviews seeding logic
│   └── server.js              <-- Express REST APIs & Demo Mode middleware
├── package.json               <-- Dependencies & start scripts
├── LICENSE                    <-- MIT open-source license
└── bookings.db                <-- persistent SQLite database file
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Server
Launch the Express application locally:
```bash
npm start
```
By default, the server runs on port `3000`. To run on a custom port:
```bash
PORT=3005 npm start
```

For developer hot-reload with auto-restart watchers:
```bash
npm run dev
```

---

## 🔐 Administrative Access & Demo Mode

Navigate to: **`http://localhost:3000/login.html`**
* **Default Username:** `admin`
* **Default Password:** `Password123`

> [!NOTE]
> To preserve the database state for portfolio reviewers, **Demo Mode** blocks all write operations (status updates, services/stylists deletion, password changes) with a 403 response. Clients can still freely schedule bookings and submit reviews on the homepage.

---

## 🧪 Automated Testing

To run the automated endpoint verification suite:
```bash
node verify_apis.js
```
The test suite executes 12 endpoint checks, using an testing header (`X-Testing-Mode: true`) to bypass Demo Mode, and cleans up after completion to maintain database integrity.

---

## 🌐 Deployment Details

For production deployments, note that **Vercel has an ephemeral read-only filesystem**.
* Hosting full-stack SQLite applications on Vercel will cause database updates to be lost whenever the serverless container spins down.
* **Recommended Hosting:** Deploy to **Render.com** as a Node Web Service, and attach a **Persistent Disk** to store `bookings.db` safely. See `deployment_guide.md` for details.

---

## ⚖️ License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
