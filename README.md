# Creative Inc. — Full-Stack Hair Styling & Care Portal

```
   ✨  C R E A T I V E   I N C .  ✨
   Professional Hair Styling • Color • Treatment
```

Creative Inc. is a professional, production-ready full-stack web application for premium hair salons. It features an interactive client reservation portal with real-time availability check, dynamic time slot locking, and a complete administrative control panel.

---

## 🚀 Key Features

### 📅 Client Booking Interface
- **Dynamic Catalog Loading:** Services and stylists are fetched dynamically from the database.
- **Real-Time Time Slots:** Shows available time slots for selected stylists and dates. Booked slots are locked out in real time to prevent double-booking.
- **Modal Confirmation:** Smooth, animated success and failure modal pop-ups.
- **Responsive Form Validation:** Instant feedback on empty states and incorrect dates.

### 💼 Admin Management Dashboard (`/login.html`)
- **Metrics Panel:** Real-time analytics tracking Total Bookings, Pending reviews, and Total Revenue (automatically calculated from completed appointments).
- **Interactive Bookings Grid:** Filter appointments by Date, Stylist, or Status. Approve, complete, or cancel bookings via quick dropdowns.
- **Service Catalog CRUD:** Form to add new styling packages and remove old ones.
- **Stylist Registry CRUD:** Manage active stylists and specialties.
- **Passcode Settings:** Change administrative passwords securely.
- **Admin Authentication:** Session-based authentication using cookies and cryptographically hashed passwords.

### 🎨 Visuals & UX
- **IntersectionObserver Scroll Reveals:** Sections glide into view with a smooth 3D translation scale as you scroll.
- **Glassmorphism Header:** Floating navigation menu shrinks and blurs dynamically on scroll.
- **Modern Select Fields:** Custom-styled select arrows matching the dark purple theme.
- **Animated Time Chips:** Expanding time slot selectors with hover scaling transitions.

---

## 📂 Project Structure

```
Hair-salon-website/
├── public/                    <-- Frontend Assets & Pages
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css      <-- Client styles, animations & reveals
│   │   │   └── admin.css      <-- Admin dashboard card & table layout
│   │   ├── images/            <-- Web assets & stylists portraits
│   │   └── js/
│   │       ├── main.js        <-- Client-side catalog loader & booking flow
│   │       └── admin.js       <-- Dashboard controller & metrics analyzer
│   ├── index.html             <-- Client reservation homepage
│   ├── login.html             <-- Admin secure log-in
│   └── admin.html             <-- Admin dashboard control room
├── src/                       <-- Backend Server Source
│   ├── db.js                  <-- SQLite database initialization & tables seeding
│   └── server.js              <-- Express REST API, middlewares & sessions
├── package.json               <-- Dependencies & start scripts
├── .gitignore                 <-- Standard Git files exclusion
├── LICENSE                    <-- MIT open-source license
└── bookings.db                <-- persistent SQLite local database file
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Install Dependencies
Navigate to the directory and run:
```bash
npm install
```

### 3. Run the Server
Launch the Express application:
```bash
npm start
```
By default, the server runs on port `3000`. If you wish to run it on a custom port (e.g. `3005`), define the `PORT` environment variable:
```bash
PORT=3005 npm start
```

For developer hot-reload, run the nodemon watcher:
```bash
npm run dev
```

---

## 🔐 Administrative Account

Navigate to: **`http://localhost:3000/login.html`**
- **Default Username:** `admin`
- **Default Password:** `Password123`

*⚠️ IMPORTANT: After logging in for the first time, go to the "Settings" tab in the dashboard and update your passcode.*

---

## ⚖️ License
Distributed under the MIT License. See [LICENSE](file:///Users/nandini/Downloads/t/Hair-salon-website/LICENSE) for more details.
