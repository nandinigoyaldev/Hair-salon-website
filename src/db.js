const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Store the SQLite database file in the src/ folder or custom env path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log(`Connected to the SQLite database at: ${dbPath}`);
    }
});

// Promise-based helpers for database operations
const query = {
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    }),
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    }),
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    })
};

// Initialize schema and seed defaults
async function initDb() {
    try {
        // Enable foreign keys
        await query.run('PRAGMA foreign_keys = ON');

        // Check if table needs upgrade (missing total_price column)
        const tableInfo = await query.all("PRAGMA table_info(bookings)");
        const hasTotalPrice = tableInfo.some(col => col.name === 'total_price');
        if (tableInfo.length > 0 && !hasTotalPrice) {
            console.log("Database: Upgrading bookings table schema...");
            await query.run("DROP TABLE IF EXISTS bookings");
        }

        // Create tables
        await query.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                price REAL NOT NULL,
                duration INTEGER NOT NULL, -- in minutes
                description TEXT
            )
        `);

        await query.run(`
            CREATE TABLE IF NOT EXISTS stylists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                specialty TEXT,
                image_url TEXT
            )
        `);

        await query.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                service_id INTEGER NOT NULL,
                stylist_id INTEGER NOT NULL,
                booking_date TEXT NOT NULL, -- YYYY-MM-DD
                booking_time TEXT NOT NULL, -- HH:MM
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                promo_code TEXT,
                discount_applied REAL DEFAULT 0,
                add_ons TEXT,
                total_price REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
                FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE
            )
        `);

        await query.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        `);

        await query.run(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed Services if empty
        const servicesCount = await query.get('SELECT COUNT(*) as count FROM services');
        if (servicesCount.count === 0) {
            await query.run(`
                INSERT INTO services (name, price, duration, description) VALUES
                ('Hair Styling', 50.00, 45, 'Trendy cuts and styles tailored to your face shape.'),
                ('Hair Coloring', 120.00, 120, 'Vibrant and natural shades using top-quality products.'),
                ('Hair Treatment', 80.00, 60, 'Strengthening and nourishing treatments for shiny, healthy hair.')
            `);
            console.log('Database: Seeded default services.');
        }

        // Seed Stylists if empty
        const stylistsCount = await query.get('SELECT COUNT(*) as count FROM stylists');
        if (stylistsCount.count === 0) {
            await query.run(`
                INSERT INTO stylists (name, specialty, image_url) VALUES
                ('Alice', 'Senior Stylist', 'assets/images/stylist.jpeg'),
                ('Michael', 'Color Specialist', 'assets/images/male.jpeg')
            `);
            console.log('Database: Seeded default stylists.');
        }

        // Seed Default Admin if empty
        const adminsCount = await query.get('SELECT COUNT(*) as count FROM admins');
        if (adminsCount.count === 0) {
            const defaultPassword = 'Password123';
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(defaultPassword, salt);
            await query.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
            console.log('Database: Seeded default admin user (username: "admin", password: "Password123").');
        }

        // Seed Reviews if empty
        const reviewsCount = await query.get('SELECT COUNT(*) as count FROM reviews');
        if (reviewsCount.count === 0) {
            await query.run(`
                INSERT INTO reviews (name, rating, comment) VALUES
                ('Sarah L.', 5, 'Maison de Beauté is the absolute benchmark of luxury hair care. My hair feels incredibly strong, shiny, and perfectly styled. The attention to detail is unmatched.'),
                ('John D.', 5, 'The color specialist Michael completely transformed my hair with a natural, gorgeous balayage. I''ve received countless compliments since my visit! Worth every cent.')
            `);
            console.log('Database: Seeded default reviews.');
        }
        
        console.log('Database: Schema verification and seeding completed.');
    } catch (err) {
        console.error('Error during database initialization:', err);
    }
}

module.exports = {
    db,
    query,
    initDb
};
