const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { initDb, query } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'salon-creative-secret-key-1298371982',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
        secure: false // set to true if using https
    }
}));

// Serve static assets from public folder (one level up)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Admin authentication check middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
}

// ==========================================
// CUSTOMER-FACING APIS
// ==========================================

// Get all services
app.get('/api/services', async (req, res) => {
    try {
        const services = await query.all('SELECT * FROM services ORDER BY name ASC');
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services.' });
    }
});

// Get all stylists
app.get('/api/stylists', async (req, res) => {
    try {
        const stylists = await query.all('SELECT * FROM stylists ORDER BY name ASC');
        res.json(stylists);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stylists.' });
    }
});

// Get stylist availability for a specific date
app.get('/api/availability', async (req, res) => {
    const { stylist_id, date } = req.query;
    
    if (!stylist_id || !date) {
        return res.status(400).json({ error: 'stylist_id and date query parameters are required.' });
    }
    
    try {
        // Retrieve booked times for the given stylist and date where the status is NOT cancelled
        const bookings = await query.all(
            `SELECT booking_time FROM bookings 
             WHERE stylist_id = ? AND booking_date = ? AND status != 'cancelled'`,
            [stylist_id, date]
        );
        
        const bookedSlots = bookings.map(b => b.booking_time);
        
        // Return list of booked slots. The frontend will filter its time list accordingly.
        res.json({ bookedSlots });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch availability.' });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    const { name, email, phone, service_id, stylist_id, date, time } = req.body;
    
    if (!name || !email || !phone || !service_id || !stylist_id || !date || !time) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    
    try {
        // Validate stylist exists
        const stylist = await query.get('SELECT id FROM stylists WHERE id = ?', [stylist_id]);
        if (!stylist) {
            return res.status(400).json({ error: 'Selected stylist does not exist.' });
        }
        
        // Validate service exists
        const service = await query.get('SELECT id FROM services WHERE id = ?', [service_id]);
        if (!service) {
            return res.status(400).json({ error: 'Selected service does not exist.' });
        }

        // Double-booking check: Ensure the stylist is not already booked at this date and time
        const existing = await query.get(
            `SELECT id FROM bookings 
             WHERE stylist_id = ? AND booking_date = ? AND booking_time = ? AND status != 'cancelled'`,
            [stylist_id, date, time]
        );
        
        if (existing) {
            return res.status(400).json({ error: 'This time slot is no longer available. Please select another time.' });
        }
        
        // Insert booking into database
        const result = await query.run(
            `INSERT INTO bookings (customer_name, customer_email, customer_phone, service_id, stylist_id, booking_date, booking_time, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [name, email, phone, service_id, stylist_id, date, time]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Booking request received!', 
            bookingId: result.id 
        });
    } catch (err) {
        console.error('Booking insertion error:', err);
        res.status(500).json({ error: 'An error occurred while creating your booking.' });
    }
});


// ==========================================
// ADMIN APIS (SECURE)
// ==========================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    
    try {
        const admin = await query.get('SELECT * FROM admins WHERE username = ?', [username]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        
        req.session.isAdmin = true;
        req.session.username = admin.username;
        
        res.json({ success: true, message: 'Logged in successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out.' });
        }
        res.json({ success: true, message: 'Logged out successfully.' });
    });
});

// Check Session Status
app.get('/api/admin/status', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Get all bookings (with service and stylist details)
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
    try {
        const bookings = await query.all(
            `SELECT b.*, s.name as service_name, s.price as service_price, t.name as stylist_name 
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             JOIN stylists t ON b.stylist_id = t.id
             ORDER BY b.booking_date DESC, b.booking_time DESC`
        );
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching admin bookings:', err);
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
});

// Update booking status
app.patch('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required.' });
    }
    
    try {
        const result = await query.run(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Booking not found.' });
        }
        
        res.json({ success: true, message: 'Booking status updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update booking status.' });
    }
});

// Delete a booking
app.delete('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query.run('DELETE FROM bookings WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Booking not found.' });
        }
        res.json({ success: true, message: 'Booking deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete booking.' });
    }
});

// Add a service
app.post('/api/admin/services', requireAdmin, async (req, res) => {
    const { name, price, duration, description } = req.body;
    if (!name || isNaN(price) || isNaN(duration)) {
        return res.status(400).json({ error: 'Valid service name, price, and duration are required.' });
    }
    
    try {
        await query.run(
            'INSERT INTO services (name, price, duration, description) VALUES (?, ?, ?, ?)',
            [name, price, duration, description || '']
        );
        res.status(201).json({ success: true, message: 'Service added successfully.' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'A service with this name already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to add service.' });
        }
    }
});

// Delete a service
app.delete('/api/admin/services/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deletion of all services
        const servicesCount = await query.get('SELECT COUNT(*) as count FROM services');
        if (servicesCount.count <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last remaining service.' });
        }

        const result = await query.run('DELETE FROM services WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Service not found.' });
        }
        res.json({ success: true, message: 'Service deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete service.' });
    }
});

// Add a stylist
app.post('/api/admin/stylists', requireAdmin, async (req, res) => {
    const { name, specialty, image_url } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Stylist name is required.' });
    }
    
    const finalImageUrl = image_url || 'assets/images/logo.png'; // Fallback
    
    try {
        await query.run(
            'INSERT INTO stylists (name, specialty, image_url) VALUES (?, ?, ?)',
            [name, specialty || 'Stylist', finalImageUrl]
        );
        res.status(201).json({ success: true, message: 'Stylist added successfully.' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'A stylist with this name already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to add stylist.' });
        }
    }
});

// Delete a stylist
app.delete('/api/admin/stylists/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deletion of all stylists
        const stylistsCount = await query.get('SELECT COUNT(*) as count FROM stylists');
        if (stylistsCount.count <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last remaining stylist.' });
        }

        const result = await query.run('DELETE FROM stylists WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Stylist not found.' });
        }
        res.json({ success: true, message: 'Stylist deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete stylist.' });
    }
});

// Change Admin Password
app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password and new password are required.' });
    }
    
    try {
        const username = req.session.username;
        const admin = await query.get('SELECT * FROM admins WHERE username = ?', [username]);
        
        const match = await bcrypt.compare(oldPassword, admin.password_hash);
        if (!match) {
            return res.status(400).json({ error: 'Incorrect current password.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        
        await query.run('UPDATE admins SET password_hash = ? WHERE username = ?', [hash, username]);
        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

// Handle wildcard fallbacks for routes - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Express Server
async function startServer() {
    // Initialize DB tables and seeds
    await initDb();
    
    app.listen(PORT, () => {
        console.log(`================================================`);
        console.log(`🚀 Server is running on: http://localhost:${PORT}`);
        console.log(`💼 Access Admin Portal at: http://localhost:${PORT}/login.html`);
        console.log(`================================================`);
    });
}

startServer();
